import Decimal from 'decimal.js';
import { CollateralDeposit, Position } from '../interfaces';
import { collateralMappingWithRegularSymbol, convertWeiToEther, DECIMAL_ZERO, SYMBOL_TO_PYTH_FEED } from '../common';
import { getProfitOrLossInUsd } from './positions';

// Calculates the unrealized pnl in USD for an array of positions off-chain
// using the provided position array and price data
export const calculateUnrealizedPnlForPositions = (
  positions: Position[],
  priceData: { id: string; price: number }[],
): Decimal => {
  let totalUnrealizedPnl = DECIMAL_ZERO;
  positions.forEach((position) => {
    const currentPrice = getPriceFromPriceArray(priceData, position.market?.feedId);
    const unrealizedPnl = getProfitOrLossInUsd(
      currentPrice,
      convertWeiToEther(position.avgPrice),
      convertWeiToEther(position.positionSize),
    );
    totalUnrealizedPnl = totalUnrealizedPnl.add(unrealizedPnl);
  });

  return totalUnrealizedPnl;
};

// Calculates the total USD value for an array of collateral deposits off-chain
// using the provided collateral deposits array and price data
export const calculateUsdValueOfCollateralDeposits = (
  collateralDeposits: CollateralDeposit[],
  priceData: { id: string; price: number }[],
): Decimal => {
  let totalCollateralValueInUsd = DECIMAL_ZERO;
  collateralDeposits.forEach((deposit) => {
    const price = getPriceFromPriceArray(priceData, undefined, deposit.collateralSymbol);

    const usdValue = convertWeiToEther(deposit.currentDepositedAmount) * price;
    totalCollateralValueInUsd = totalCollateralValueInUsd.add(usdValue);
  });
  return totalCollateralValueInUsd;
};

// Returns the price for a price id from a provided price data array

export const getPriceFromPriceArray = (
  priceData: { id: string; price: number }[],
  priceId?: string | undefined,
  tokenSymbol?: string | undefined,
): number => {
  if (!priceId && !tokenSymbol) return 0;

  if (!priceId) {
    const formattedSymbol =
      collateralMappingWithRegularSymbol.get(tokenSymbol?.toLowerCase() || '') || tokenSymbol?.toLowerCase();

    priceId = SYMBOL_TO_PYTH_FEED.get(formattedSymbol?.toUpperCase() || '');
  }
  // Check if pythId exists before trying to access collateralPrice
  const price = priceId ? priceData.find((p) => p.id === priceId.slice(2))?.price || 0 : 0;
  console.log('price: ', priceId, price);
  return price;
};

/**
 * Calculates the liquidation price for a position
 * @param availableMarginInUsd USD value of the margin that is available
 * @param marginBufferInUsd Margin used as buffer for the account
 * @param formattedPositionSize Formatted position size
 * @param formattedMarketPrice Formatted market price of the market
 * @returns liquidationPrice Approximate liquidation price of the asset
 */
export const calculateLiquidationPriceOffchain = ({
  availableMarginInUsd,
  marginBufferInUsd,
  formattedPositionSize,
  formattedMarketPrice,
}: {
  availableMarginInUsd: number;
  marginBufferInUsd: number;
  formattedPositionSize: number;
  formattedMarketPrice: number;
}): number => {
  // For invalid position, return current market price
  if (formattedPositionSize == 0) return formattedMarketPrice;
  if (availableMarginInUsd == 0) return 0;

  const lossPerToken = Math.abs((marginBufferInUsd - availableMarginInUsd) / formattedPositionSize);

  let liquidationPrice;
  if (formattedPositionSize > 0) {
    liquidationPrice = formattedMarketPrice - lossPerToken;
  } else {
    liquidationPrice = formattedMarketPrice + lossPerToken;
  }

  return liquidationPrice;
};
