import { Market, Order, OrderStatus, Position } from '../../interfaces/subgraphTypes';
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
import { convertCollateralAmountToUsd, convertMarketAmountToCollateral, convertMarketAmountToUsd } from '../price-feed';
import { Chain } from '@parifi/references';
import { contracts as parifiContracts } from '@parifi/references';
import { Contract, ethers } from 'ethers';
import { AxiosInstance } from 'axios';
import {
  getOrderById,
  getPythPriceIdsForOrderIds,
  getPythPriceIdsForPositionIds,
  getTotalUnrealizedPnlInUsd,
} from '../../subgraph';
import { getLatestPricesFromPyth, getVaaPriceUpdateData, normalizePythPriceForParifi } from '../../pyth/pyth';
import { getCurrentTimestampInSeconds, getPriceIdsForCollaterals } from '../../common';
import { executeTxUsingGelato } from '../../relayers/gelato/gelato-function';

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
// Uses the same code implementation from Smart contract
export const canBeSettled = (
  isLimitOrder: boolean,
  triggerAbove: boolean,
  isLong: boolean,
  maxSlippage: Decimal,
  expectedPrice: Decimal,
  normalizedMarketPrice: Decimal,
): boolean => {
  if (isLimitOrder) {
    // For limit orders, expected price cannot be zero
    if (expectedPrice.equals(DECIMAL_ZERO)) return false;

    // If its a limit order, check if the limit price is reached, either above or below
    // depending on the triggerAbove flag
    if (
      (triggerAbove && normalizedMarketPrice < expectedPrice) ||
      (!triggerAbove && normalizedMarketPrice > expectedPrice)
    ) {
      console.log('Order cannot be settled because of Trigger price');
      return false;
    }
  } else {
    // Market Orders
    // Check if current market price is within slippage range
    if (!expectedPrice.equals(DECIMAL_ZERO)) {
      const upperLimit = expectedPrice.mul(PRECISION_MULTIPLIER.add(maxSlippage)).div(PRECISION_MULTIPLIER);
      const lowerLimit = expectedPrice.mul(PRECISION_MULTIPLIER.sub(maxSlippage)).div(PRECISION_MULTIPLIER);

      if ((isLong && normalizedMarketPrice > upperLimit) || (!isLong && normalizedMarketPrice < lowerLimit)) {
        console.log('Order cannot be settled because of slippage price limits');
        return false;
      }
    }
  }
  return true;
};

// Returns true if the price of market is within the range configured in order struct
// The function can be used to check if a pending order can be settled or not
export const canBeSettledPriceId = async (
  isLimitOrder: boolean,
  triggerAbove: boolean,
  isLong: boolean,
  maxSlippage: Decimal,
  expectedPrice: Decimal,
  orderPriceId: string,
  pythClient: AxiosInstance,
): Promise<boolean> => {
  // Pyth returns price id without '0x' at the start, hence the price id from order
  // needs to be formatted
  const formattedPriceId = orderPriceId.startsWith('0x') ? orderPriceId.substring(2) : orderPriceId;

  const pythLatestPrices = await getLatestPricesFromPyth([orderPriceId], pythClient);

  const assetPrice = pythLatestPrices.find((pythPrice) => pythPrice.id === formattedPriceId);
  const normalizedMarketPrice = normalizePythPriceForParifi(
    parseInt(assetPrice?.price.price ?? '0'),
    assetPrice?.price.expo ?? 0,
  );

  return canBeSettled(isLimitOrder, triggerAbove, isLong, maxSlippage, expectedPrice, normalizedMarketPrice);
};

// Returns true if the price of market is within the range configured in order struct
// The function can be used to check if a pending order can be settled or not
export const checkIfOrderCanBeSettled = (order: Order, normalizedMarketPrice: Decimal): boolean => {
  // Return false if any of the fields is undefined
  if (order.isLimitOrder === undefined || order.triggerAbove === undefined || order.isLong === undefined) {
    console.log('Fields in Order struct undefined. Order cannot be settled');
    return false;
  }

  // Return false if any of the fields is undefined
  if (order.expectedPrice === undefined || order.maxSlippage === undefined) {
    console.log('Fields in Order struct undefined. Order cannot be settled');
    return false;
  }

  if (order.status !== OrderStatus.PENDING) {
    console.log('Order already settled or cancelled');
    return false;
  }

  const orderDeadline = Number(order.deadline);
  if (orderDeadline < getCurrentTimestampInSeconds() && orderDeadline != 0) {
    console.log('Order expired, cannot be settled');
    return false;
  }

  return canBeSettled(
    order.isLimitOrder,
    order.triggerAbove,
    order.isLong,
    new Decimal(order.maxSlippage),
    new Decimal(order.expectedPrice),
    normalizedMarketPrice,
  );
};

// Returns true if the price of market is within the range configured in order struct
// The function can be used to check if a pending order can be settled or not
export const checkIfOrderCanBeSettledId = async (
  subgraphEndpoint: string,
  orderId: string,
  pythClient: AxiosInstance,
): Promise<boolean> => {
  const order = await getOrderById(subgraphEndpoint, orderId);

  // Pyth returns price id without '0x' at the start, hence the price id from order
  // needs to be formatted
  const orderPriceId = order.market?.pyth?.id ?? '0x';
  const formattedPriceId = orderPriceId.startsWith('0x') ? orderPriceId.substring(2) : orderPriceId;

  const pythLatestPrices = await getLatestPricesFromPyth([orderPriceId], pythClient);

  const assetPrice = pythLatestPrices.find((pythPrice) => pythPrice.id === formattedPriceId);
  const normalizedMarketPrice = normalizePythPriceForParifi(
    parseInt(assetPrice?.price.price ?? '0'),
    assetPrice?.price.expo ?? 0,
  );

  return checkIfOrderCanBeSettled(order, normalizedMarketPrice);
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

// Returns the liquidation price of a Position, 0 if Liquidation price is not applicable
// A position is liquidated when the loss of a position in USD goes above the USD value
// of liquidation threshold times the deposited collateral value
export const getLiquidationPrice = (
  position: Position,
  market: Market,
  normalizedMarketPrice: Decimal,
  normalizedCollateralPrice: Decimal,
): Decimal => {
  const collateral = new Decimal(position.positionCollateral ?? '0');

  // Decimal digits for market and collateral token
  const collateralDecimals = new Decimal(market.depositToken?.decimals ?? '18');
  const marketDecimals = new Decimal(market.marketDecimals ?? '18');

  // Total fees for the position taking into account closing fee and liquidation fee
  const accruedBorrowFeesInMarket = getAccruedBorrowFeesInMarket(position, market);
  const fixedFeesInMarket = new Decimal(position.positionSize ?? '0')
    .times(new Decimal(market.openingFee ?? '0').add(market.liquidationFee ?? '0'))
    .div(MAX_FEE);

  const totalFeesInUsd = convertMarketAmountToUsd(
    accruedBorrowFeesInMarket.add(fixedFeesInMarket),
    marketDecimals,
    normalizedMarketPrice,
  );

  const collateralInUsd = convertCollateralAmountToUsd(collateral, collateralDecimals, normalizedCollateralPrice);
  const maxLossLimitInUsd = collateralInUsd.times(market.liquidationThreshold ?? '0').div(PRECISION_MULTIPLIER);

  const lossLimitAfterFees = maxLossLimitInUsd.sub(totalFeesInUsd);

  // @todo Revisit this
  // If loss is already more than the max loss, the position can be liquidated at the current price
  if (lossLimitAfterFees.lessThan(DECIMAL_ZERO)) return normalizedMarketPrice;

  const lossPerToken = lossLimitAfterFees
    .times(new Decimal('10').pow(marketDecimals))
    .div(position.positionSize ?? '1');

  let liquidationPrice = DECIMAL_ZERO;
  if (position.isLong) {
    liquidationPrice = new Decimal(position.avgPrice ?? 0).sub(lossPerToken);

    // For LONG positions, if Liquidation price is less than 0, it means that the leverage is below 1x
    // and liquidation price is not applicable
    if (liquidationPrice.lessThan(DECIMAL_ZERO)) {
      console.log('Leverage less than 1x. LiquidationPrice set to DECIMAL_ZERO');
      return DECIMAL_ZERO;
    }
  } else {
    liquidationPrice = new Decimal(position.avgPrice ?? 0).add(lossPerToken);

    // For SHORT positions, if Liquidation price is less than the normalized market price, it means that the leverage is below 1x
    // and liquidation price is not applicable
    if (liquidationPrice.lessThan(normalizedMarketPrice)) {
      console.log('Leverage less than 1x. LiquidationPrice set to DECIMAL_ZERO');
      return DECIMAL_ZERO;
    }
  }
  return liquidationPrice;
};
