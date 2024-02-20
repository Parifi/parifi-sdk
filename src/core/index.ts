import Decimal from 'decimal.js';
import { PythConfig, RelayerConfig, RpcConfig, SubgraphConfig } from '../interfaces/classConfigs';
import { Market, Order, Position } from '../interfaces/subgraphTypes';
import {
  getAccruedBorrowFeesInMarket,
  getBaseBorrowRatePerSecond,
  getDynamicBorrowRatePerSecond,
  getMarketSkew,
  getMarketUtilization,
} from './data-fabric';
import { Contract } from 'ethers';
import {
  calculatePositionLeverage,
  getNetProfitOrLossInCollateral,
  getOrderManagerInstance,
  getProfitOrLossInUsd,
  isPositionLiquidatable,
} from './order-manager';
import { checkIfOrderCanBeSettled } from './order-manager/';
import { batchSettlePendingOrdersUsingGelato, getParifiUtilsInstance } from './parifi-utils';
import { AxiosInstance } from 'axios';
import { convertCollateralAmountToUsd, convertMarketAmountToCollateral, convertMarketAmountToUsd } from './price-feed';
import { getMarketBorrowingRatePerHour, getMarketOpenInterestInUsd } from './pages/statsPage';
import { getPublicSubgraphEndpoint } from '../subgraph';
import { getPythClient } from '../pyth/pyth';

// export * from './data-fabric';
// export * from './order-manager';
// export * from './price-feed';
// export * from './parifi-utils';

export class Core {
  constructor(
    private rpcConfig: RpcConfig,
    private subgraphConfig: SubgraphConfig,
    private relayerConfig: RelayerConfig,
    private pythConfig: PythConfig,
  ) {}

  ////////////////////////////////////////////////////////////////
  //////////////////////    DATA FABRIC    ///////////////////////
  ////////////////////////////////////////////////////////////////
  getMarketUtilization = (market: Market, isLong: boolean): Decimal => {
    return getMarketUtilization(market, isLong);
  };

  getMarketSkew = (market: Market): Decimal => {
    return getMarketSkew(market);
  };

  getDynamicBorrowRatePerSecond = (market: Market): Decimal => {
    return getDynamicBorrowRatePerSecond(market);
  };

  getBaseBorrowRatePerSecond = (
    market: Market,
  ): { baseBorrowRatePerSecondLong: Decimal; baseBorrowRatePerSecondShort: Decimal } => {
    return getBaseBorrowRatePerSecond(market);
  };

  getAccruedBorrowFeesInMarket = (position: Position, market: Market): Decimal => {
    return getAccruedBorrowFeesInMarket(position, market);
  };

  ////////////////////////////////////////////////////////////////
  //////////////////////    ORDER MANAGER    /////////////////////
  ////////////////////////////////////////////////////////////////

  getOrderManagerInstance = (): Contract => {
    return getOrderManagerInstance(this.rpcConfig.chainId);
  };

  getProfitOrLossInUsd = (
    userPosition: Position,
    normalizedMarketPrice: Decimal,
    marketDecimals: Decimal,
  ): { totalProfitOrLoss: Decimal; isProfit: boolean } => {
    return getProfitOrLossInUsd(userPosition, normalizedMarketPrice, marketDecimals);
  };

  getPnlWithoutFeesInCollateral = (
    position: Position,
    market: Market,
    normalizedMarketPrice: Decimal,
    normalizedCollateralPrice: Decimal,
  ): { profitOrLoss: Decimal; isProfit: boolean } => {
    return this.getPnlWithoutFeesInCollateral(position, market, normalizedMarketPrice, normalizedCollateralPrice);
  };

  getDeviatedMarketPriceInUsd = (
    market: Market,
    normalizedMarketPrice: Decimal,
    isLong: boolean,
    isIncrease: boolean,
  ): Decimal => {
    return this.getDeviatedMarketPriceInUsd(market, normalizedMarketPrice, isLong, isIncrease);
  };

  isPositionLiquidatable = (
    position: Position,
    market: Market,
    normalizedMarketPrice: Decimal,
    normalizedCollateralPrice: Decimal,
  ): { canBeLiquidated: boolean } => {
    return isPositionLiquidatable(position, market, normalizedMarketPrice, normalizedCollateralPrice);
  };

  calculatePositionLeverage = (
    position: Position,
    market: Market,
    normalizedMarketPrice: Decimal,
    normalizedCollateralPrice: Decimal,
  ): {
    leverage: string;
    formattedLeverage: number;
  } => {
    return calculatePositionLeverage(position, market, normalizedMarketPrice, normalizedCollateralPrice);
  };

  getNetProfitOrLossInCollateral = (
    position: Position,
    market: Market,
    normalizedMarketPrice: Decimal,
    normalizedCollateralPrice: Decimal,
  ): { netPnlInCollateral: Decimal; isNetProfit: boolean } => {
    return getNetProfitOrLossInCollateral(position, market, normalizedMarketPrice, normalizedCollateralPrice);
  };

  checkIfOrderCanBeSettled = (order: Order, normalizedMarketPrice: Decimal): boolean => {
    return checkIfOrderCanBeSettled(order, normalizedMarketPrice);
  };

  ////////////////////////////////////////////////////////////////
  //////////////////////    PARIFI UTILS    //////////////////////
  ////////////////////////////////////////////////////////////////

  getParifiUtilsInstance = (): Contract => {
    return getParifiUtilsInstance(this.rpcConfig.chainId);
  };

  batchSettlePendingOrdersUsingGelato = async (gelatoKey: string): Promise<{ ordersCount: number }> => {
    const subgraphEndpoint = this.subgraphConfig.subgraphEndpoint ?? getPublicSubgraphEndpoint(this.rpcConfig.chainId);
    const pythClient = await getPythClient(
      this.pythConfig.pythEndpoint,
      this.pythConfig.username,
      this.pythConfig.password,
      this.pythConfig.isStable,
    );
    return batchSettlePendingOrdersUsingGelato(this.rpcConfig.chainId, gelatoKey, subgraphEndpoint, pythClient);
  };

  ////////////////////////////////////////////////////////////////
  //////////////////////    PRICEFEED    /////////////////////////
  ////////////////////////////////////////////////////////////////
  convertMarketAmountToCollateral = (
    marketAmount: Decimal,
    marketDecimals: Decimal,
    collateralDecimals: Decimal,
    normalizedMarketPrice: Decimal,
    normalizedCollateralPrice: Decimal,
  ): Decimal => {
    return convertMarketAmountToCollateral(
      marketAmount,
      marketDecimals,
      collateralDecimals,
      normalizedMarketPrice,
      normalizedCollateralPrice,
    );
  };

  convertMarketAmountToUsd = (
    marketAmount: Decimal,
    marketDecimals: Decimal,
    normalizedMarketPrice: Decimal,
  ): Decimal => {
    return convertMarketAmountToUsd(marketAmount, marketDecimals, normalizedMarketPrice);
  };

  convertCollateralAmountToUsd = (
    collateralAmount: Decimal,
    collateralDecimals: Decimal,
    normalizedCollateralPrice: Decimal,
  ): Decimal => {
    return convertCollateralAmountToUsd(collateralAmount, collateralDecimals, normalizedCollateralPrice);
  };

  ////////////////////////////////////////////////////////////////
  //////////////////////    PAGES    /////////////////////////////
  ////////////////////////////////////////////////////////////////

  getMarketBorrowingRatePerHour = (
    market: Market,
  ): { borrowingRatePerHourLong: Decimal; borrowingRatePerHourShorts: Decimal } => {
    return getMarketBorrowingRatePerHour(market);
  };

  getMarketOpenInterestInUsd = (
    market: Market,
    normalizedMarketPrice: Decimal,
  ): { openInterestInUsdLongs: Decimal; openInterestInUsdShorts: Decimal } => {
    return getMarketOpenInterestInUsd(market, normalizedMarketPrice);
  };
}