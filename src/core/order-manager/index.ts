import { Market, Order, Position } from '../../interfaces/subgraphTypes';
import { Decimal } from 'decimal.js';
import {
  DECIMAL_ZERO,
  DEVIATION_PRECISION_MULTIPLIER,
  GAS_LIMIT_LIQUIDATION,
  GAS_LIMIT_SETTLEMENT,
  MAX_FEE,
  PRECISION_MULTIPLIER,
} from '../../common/constants';
import { getAccruedBorrowFeesInMarket, getMarketUtilization } from '../data-fabric';
import { convertMarketAmountToCollateral } from '../price-feed';
import { Chain } from '@parifi/references';
import { contracts as parifiContracts } from '@parifi/references';
import { Contract, ethers } from 'ethers';
import { AxiosInstance } from 'axios';
import { getPythPriceIdsForOrderIds, getPythPriceIdsForPositionIds } from '../../subgraph';
import { getVaaPriceUpdateData } from '../../pyth/pyth';
import { getPriceIdsForCollaterals } from '../../common';
import { executeTxUsingGelato } from '../../gelato/gelato-function';

// Returns an Order Manager contract instance without signer
export const getOrderManagerInstance = (chain: Chain): Contract => {
  try {
    return new ethers.Contract(parifiContracts[chain].OrderManager.address, parifiContracts[chain].OrderManager.abi);
  } catch (error) {
    throw error;
  }
};

// Return the Profit or Loss for a position in USD
// `normalizedMarketPrice` is the price of market with 8 decimals
export const getProfitOrLossInUsd = (
  userPosition: Position,
  normalizedMarketPrice: Decimal,
  marketDecimals: Decimal,
): { totalProfitOrLoss: Decimal; isProfit: boolean } => {
  let profitOrLoss: Decimal;
  let isProfit: boolean;

  const positionAvgPrice = new Decimal(userPosition.avgPrice ?? normalizedMarketPrice);

  if (userPosition.isLong) {
    if (normalizedMarketPrice.gt(positionAvgPrice)) {
      // User position is profitable
      profitOrLoss = normalizedMarketPrice.minus(positionAvgPrice);
      isProfit = true;
    } else {
      // User position is at loss
      profitOrLoss = positionAvgPrice.minus(normalizedMarketPrice);
      isProfit = false;
    }
  } else {
    if (normalizedMarketPrice.gt(positionAvgPrice)) {
      // User position is at loss
      profitOrLoss = normalizedMarketPrice.minus(positionAvgPrice);
      isProfit = false;
    } else {
      // User position is profitable
      profitOrLoss = positionAvgPrice.minus(normalizedMarketPrice);
      isProfit = true;
    }
  }

  const positionSize = new Decimal(userPosition.positionSize ?? '0');
  const totalProfitOrLoss = positionSize.times(profitOrLoss).dividedBy(new Decimal(10).pow(marketDecimals));

  return { totalProfitOrLoss, isProfit };
};

// Returns the Profit or Loss of a position in collateral with decimals
// Normalized price for market and token is the price with 8 decimals, which is used
// throughout the protocol
export const getPnlWithoutFeesInCollateral = (
  position: Position,
  market: Market,
  normalizedMarketPrice: Decimal,
  normalizedCollateralPrice: Decimal,
): { profitOrLoss: Decimal; isProfit: boolean } => {
  const depositTokenDecimals = new Decimal(market?.depositToken?.decimals ?? '0');
  const marketDecimals = new Decimal(market?.marketDecimals ?? '0');

  const { totalProfitOrLoss: pnlInUsd, isProfit } = getProfitOrLossInUsd(
    position,
    normalizedMarketPrice,
    marketDecimals,
  );

  const tokenMultiplier = new Decimal(10).pow(depositTokenDecimals);
  const profitOrLoss = pnlInUsd.times(tokenMultiplier).dividedBy(normalizedCollateralPrice).ceil();

  return { profitOrLoss, isProfit };
};

// Returns the deviated price of the market based on the liquidity curve
// normalizedMarketPrice is the price of market in USD with 8 decimals
export const getDeviatedMarketPriceInUsd = (
  market: Market,
  normalizedMarketPrice: Decimal,
  isLong: boolean,
  isIncrease: boolean,
): Decimal => {
  const deviationCoeff = market.deviationCoeff ?? '0';
  const deviationConst = market.deviationConst ?? '0';

  const marketUtilization = getMarketUtilization(market, isLong);

  const deviationPoints = new Decimal(deviationCoeff)
    .times(marketUtilization)
    .times(marketUtilization)
    .add(deviationConst);

  const PRECISION = DEVIATION_PRECISION_MULTIPLIER.mul(100);

  const increasedPrice = normalizedMarketPrice.times(PRECISION.add(deviationPoints)).dividedBy(PRECISION).ceil();
  const reducedPrice = normalizedMarketPrice.times(PRECISION.minus(deviationPoints)).dividedBy(PRECISION).floor();

  if (isIncrease) return isLong ? increasedPrice : reducedPrice;
  return isLong ? reducedPrice : increasedPrice;
};

// Returns `true` if a position can be liquidated, otherwise false
export const isPositionLiquidatable = (
  position: Position,
  market: Market,
  normalizedMarketPrice: Decimal,
  normalizedCollateralPrice: Decimal,
): { canBeLiquidated: boolean } => {
  let canBeLiquidated: boolean = false;

  const { profitOrLoss: pnlInCollateral, isProfit } = getPnlWithoutFeesInCollateral(
    position,
    market,
    normalizedMarketPrice,
    normalizedCollateralPrice,
  );

  // The fixed fees during liquidation include the closing fee and the liquidation fee
  const fixedClosingFeeDuringLiquidation = new Decimal(market.liquidationFee ?? '0')
    .add(market.closingFee ?? '0')
    .mul(position.positionSize ?? '0')
    .dividedBy(MAX_FEE);

  const accruedBorrowFeesInMarket = getAccruedBorrowFeesInMarket(position, market);

  const totalFeesMarket = fixedClosingFeeDuringLiquidation.add(accruedBorrowFeesInMarket);
  const feesInCollateral = convertMarketAmountToCollateral(
    totalFeesMarket,
    new Decimal(market.marketDecimals ?? '0'),
    new Decimal(market.depositToken?.decimals ?? '0'),
    normalizedMarketPrice,
    normalizedCollateralPrice,
  );

  let lossInCollateral: Decimal;
  if (isProfit) {
    // If the position is profitable and fees are less than the profit, return false
    // else calculate the loss by subtracting profit from fees
    if (feesInCollateral.lessThan(pnlInCollateral)) {
      return { canBeLiquidated: false };
    } else {
      lossInCollateral = feesInCollateral.minus(pnlInCollateral);
    }
  } else {
    // Add fees to position loss to get net loss
    lossInCollateral = pnlInCollateral.add(feesInCollateral);
  }

  const liquidationThresholdInCollateral = new Decimal(market.liquidationThreshold ?? '0')
    .times(position.positionCollateral ?? '0')
    .dividedBy(PRECISION_MULTIPLIER);

  if (lossInCollateral.gt(liquidationThresholdInCollateral)) canBeLiquidated = true;

  return {
    canBeLiquidated,
  };
};

export const calculatePositionLeverage = (
  position: Position,
  market: Market,
  normalizedMarketPrice: Decimal,
  normalizedCollateralPrice: Decimal,
): {
  leverage: string;
  formattedLeverage: number;
} => {
  let leverage: Decimal = new Decimal('0');

  const positionCollateralAmount = new Decimal(position.positionCollateral ?? '0');

  // Convert the position size in collateral terms
  const sizeInCollateral = convertMarketAmountToCollateral(
    new Decimal(position.positionSize ?? '0'),
    new Decimal(market.marketDecimals ?? '0'),
    new Decimal(market.depositToken?.decimals ?? '0'),
    normalizedMarketPrice,
    normalizedCollateralPrice,
  );

  const { netPnlInCollateral, isNetProfit } = getNetProfitOrLossInCollateral(
    position,
    market,
    normalizedMarketPrice,
    normalizedCollateralPrice,
  );

  const sizeInCollateralWithPrecision = sizeInCollateral.mul(PRECISION_MULTIPLIER);

  if (isNetProfit) {
    leverage = sizeInCollateralWithPrecision.div(positionCollateralAmount.add(netPnlInCollateral)).ceil();
  } else {
    // Handle divide by zero in case loss is not recoverable from collateral
    if (netPnlInCollateral.lt(positionCollateralAmount)) {
      leverage = sizeInCollateralWithPrecision.dividedBy(positionCollateralAmount.minus(netPnlInCollateral)).ceil();
    } else {
      leverage = new Decimal(10000);
    }
  }

  return {
    leverage: leverage.toString(),
    formattedLeverage: leverage.dividedBy(PRECISION_MULTIPLIER).toNumber(),
  };
};

// Returns the net profit or loss considering the accrued borrowing fees for the position
export const getNetProfitOrLossInCollateral = (
  position: Position,
  market: Market,
  normalizedMarketPrice: Decimal,
  normalizedCollateralPrice: Decimal,
): { netPnlInCollateral: Decimal; isNetProfit: boolean } => {
  // Get profit/loss for the position without fees
  const { profitOrLoss: pnlInCollateral, isProfit } = getPnlWithoutFeesInCollateral(
    position,
    market,
    normalizedMarketPrice,
    normalizedCollateralPrice,
  );

  // Calculate the fees accrued for this position
  const accruedBorrowFeesInMarket = getAccruedBorrowFeesInMarket(position, market);

  const feesInCollateral = convertMarketAmountToCollateral(
    accruedBorrowFeesInMarket,
    new Decimal(market.marketDecimals ?? '0'),
    new Decimal(market.depositToken?.decimals ?? '0'),
    normalizedMarketPrice,
    normalizedCollateralPrice,
  );

  let netPnlInCollateral: Decimal;
  let isNetProfit: boolean;
  if (isProfit) {
    // If the position is profitable and fees are less than the profit, return false
    // else calculate the loss by subtracting profit from fees
    if (feesInCollateral.lessThan(pnlInCollateral)) {
      netPnlInCollateral = pnlInCollateral.minus(feesInCollateral);
      isNetProfit = true;
    } else {
      // Fees are more than the profit
      netPnlInCollateral = feesInCollateral.minus(pnlInCollateral);
      isNetProfit = false;
    }
  } else {
    // Add fees to position loss to get net loss
    netPnlInCollateral = pnlInCollateral.add(feesInCollateral);
    isNetProfit = false;
  }

  return { netPnlInCollateral, isNetProfit };
};

// Returns true if the price of market is within the range configured in order struct
// The function can be used to check if a pending order can be settled or not
export const checkIfOrderCanBeSettled = (order: Order, normalizedMarketPrice: Decimal): boolean => {
  const isLimitOrder = order.isLimitOrder;
  const triggerAbove = order.triggerAbove;
  const isLong = order.isLong;
  // Return false if any of the fields is undefined
  if (isLimitOrder === undefined || triggerAbove === undefined || isLong === undefined) {
    return false;
  }

  // Return false if any of the fields is undefined
  if (order.expectedPrice === undefined || order.maxSlippage === undefined) {
    return false;
  }
  const expectedPrice = new Decimal(order.expectedPrice);
  const maxSlippage = new Decimal(order.maxSlippage);

  if (isLimitOrder) {
    // If its a limit order, check if the limit price is reached, either above or below
    // depending on the triggerAbove flag
    if (
      (triggerAbove && normalizedMarketPrice < expectedPrice) ||
      (!triggerAbove && normalizedMarketPrice > expectedPrice)
    ) {
      return false;
    }
  } else {
    // Market Orders
    // Check if current market price is within slippage range
    if (expectedPrice != DECIMAL_ZERO) {
      const upperLimit = expectedPrice.mul(PRECISION_MULTIPLIER.add(maxSlippage)).div(PRECISION_MULTIPLIER);
      const lowerLimit = expectedPrice.mul(PRECISION_MULTIPLIER.sub(maxSlippage)).div(PRECISION_MULTIPLIER);

      if ((isLong && normalizedMarketPrice > upperLimit) || (!isLong && normalizedMarketPrice < lowerLimit)) {
        return false;
      }
    }
  }
  return true;
};

// Liquidates a position using Gelato as the relayer
export const liquidatePositionUsingGelato = async (
  chainId: Chain,
  positionId: string,
  gelatoKey: string,
  subgraphEndpoint: string,
  isStablePyth: boolean,
  pythClient: AxiosInstance,
): Promise<{ gelatoTaskId: string }> => {
  // Get unique price ids for the position
  const priceIds = await getPythPriceIdsForPositionIds(subgraphEndpoint, [positionId]);
  const collateralPriceIds = getPriceIdsForCollaterals(isStablePyth);

  // Get Price update data and latest prices from Pyth
  const priceUpdateData = await getVaaPriceUpdateData(priceIds.concat(collateralPriceIds), pythClient);

  // Encode transaction data
  let taskId: string = '';
  const orderManager = getOrderManagerInstance(chainId);
  const { data: encodedTxData } = await orderManager.liquidatePosition.populateTransaction(positionId, priceUpdateData);

  const gelatoGasLimit = BigInt(GAS_LIMIT_LIQUIDATION);
  taskId = await executeTxUsingGelato(
    parifiContracts[chainId].OrderManager.address,
    chainId,
    gelatoKey,
    encodedTxData,
    gelatoGasLimit,
  );

  // We need these console logs for feedback to Tenderly actions and other scripts
  console.log('Task ID:', taskId);
  return { gelatoTaskId: taskId };
};

// Settles an order using Gelato as the relayer
export const settleOrderUsingGelato = async (
  chainId: Chain,
  orderId: string,
  gelatoKey: string,
  subgraphEndpoint: string,
  isStablePyth: boolean,
  pythClient: AxiosInstance,
): Promise<{ gelatoTaskId: string }> => {
  // Get unique price ids for the order
  const priceIds = await getPythPriceIdsForOrderIds(subgraphEndpoint, [orderId]);
  const collateralPriceIds = getPriceIdsForCollaterals(isStablePyth);

  // Get Price update data and latest prices from Pyth
  const priceUpdateData = await getVaaPriceUpdateData(priceIds.concat(collateralPriceIds), pythClient);

  // Encode transaction data
  let taskId: string = '';
  const orderManager = getOrderManagerInstance(chainId);
  const { data: encodedTxData } = await orderManager.settleOrder.populateTransaction(orderId, priceUpdateData);

  const gelatoGasLimit = BigInt(GAS_LIMIT_SETTLEMENT);

  taskId = await executeTxUsingGelato(
    parifiContracts[chainId].OrderManager.address,
    chainId,
    gelatoKey,
    encodedTxData,
    gelatoGasLimit,
  );

  // We need these console logs for feedback to Tenderly actions and other scripts
  console.log('Task ID:', taskId);
  return { gelatoTaskId: taskId };
};
