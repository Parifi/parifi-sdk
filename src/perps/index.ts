import Decimal from 'decimal.js';
import {
  calculateCollateralFromSizeAndLeverage,
  calculateLeverageFromCollateralAndSize,
  calculateSizeFromCollateralAndLeverage,
  getProfitOrLossInUsd,
} from './positions';
import { CollateralDeposit, Position } from '../interfaces';
import { collateralMappingWithRegularSymbol, convertWeiToEther, DECIMAL_ZERO, SYMBOL_TO_PYTH_FEED } from '../common';
import {
  calculateLiquidationPriceOffchain,
  calculateUnrealizedPnlForPositions,
  calculateUsdValueOfCollateralDeposits,
  getPriceFromPriceArray,
} from './offchain';

export class Perps {
  constructor() {}

  getProfitOrLossInUsd = (marketPrice: number, avgPrice: number, positionSize: number): Decimal => {
    return getProfitOrLossInUsd(marketPrice, avgPrice, positionSize);
  };

  calculateSizeFromCollateralAndLeverage = ({
    collateralValueInUsd,
    leverage,
    marketPrice,
  }: {
    collateralValueInUsd: number;
    leverage: number;
    marketPrice: number;
  }): Decimal => {
    return calculateSizeFromCollateralAndLeverage(collateralValueInUsd, leverage, marketPrice);
  };

  calculateCollateralFromSizeAndLeverage = ({
    sizeInUsd,
    leverage,
    collateralPrice,
  }: {
    sizeInUsd: number;
    leverage: number;
    collateralPrice: number;
  }): Decimal => {
    return calculateCollateralFromSizeAndLeverage(sizeInUsd, leverage, collateralPrice);
  };

  calculateLeverageFromCollateralAndSize = ({
    collateralValueInUsd,
    sizeInUsd,
  }: {
    collateralValueInUsd: number;
    sizeInUsd: number;
  }): number => {
    return calculateLeverageFromCollateralAndSize(collateralValueInUsd, sizeInUsd);
  };

  // Calculates the unrealized pnl in USD for an array of positions off-chain
  // using the provided position array and price data
  calculateUnrealizedPnlForPositions = (positions: Position[], priceData: { id: string; price: number }[]): Decimal => {
    return calculateUnrealizedPnlForPositions(positions, priceData);
  };

  // Calculates the total USD value for an array of collateral deposits off-chain
  // using the provided collateral deposits array and price data
  calculateUsdValueOfCollateralDeposits = (
    collateralDeposits: CollateralDeposit[],
    priceData: { id: string; price: number }[],
  ): Decimal => {
    return calculateUsdValueOfCollateralDeposits(collateralDeposits, priceData);
  };

  // Returns the price for a price id from a provided price data array
  getPriceFromPriceArray = (
    priceData: { id: string; price: number }[],
    priceId?: string | undefined,
    tokenSymbol?: string | undefined,
  ): number => {
    return getPriceFromPriceArray(priceData, priceId, tokenSymbol);
  };

  //   Calculates the liquidation price for a position
  calculateLiquidationPriceOffchain = ({
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
    return calculateLiquidationPriceOffchain({
      availableMarginInUsd,
      marginBufferInUsd,
      formattedPositionSize,
      formattedMarketPrice,
    });
  };
}
