import {
  Account,
  Market,
  Order,
  Position,
  PriceFeedSnapshot,
  PythData,
  Token,
  Vault,
  VaultPosition,
} from '../interfaces/subgraphTypes';

////////////////////////////////////////////////////////////////
//////////////////////    ACCOUNT   ////////////////////////////
////////////////////////////////////////////////////////////////

export const mapSubgraphResponseToAccountInterface = (response: any): Account | undefined => {
  try {
    return {
      id: response.id,
      totalOrdersCount: response.totalOrdersCount,
      openPositionsCount: response.openPositionsCount,
      totalPositionsCount: response.totalPositionsCount,
      referralFeesInUsd: response.referralFeesInUsd,
      totalRealizedPnlPositions: response.totalRealizedPnlPositions,
      totalRealizedPnlVaults: response.totalRealizedPnlVaults,
    };
  } catch (error) {
    console.log('Error while mapping data', error);
    throw error;
  }
};

////////////////////////////////////////////////////////////////
//////////////////////    MARKET    ////////////////////////////
////////////////////////////////////////////////////////////////

export const mapSingleMarketToInterface = (response: any): Market | undefined => {
  try {
    return {
      id: response.id,
      vaultAddress: response.vaultAddress,
      depositToken: response.depositToken ? mapSubgraphResponseToTokenInterface(response.depositToken) : undefined,
      isLive: response.isLive,
      marketDecimals: response.marketDecimals,
      liquidationThreshold: response.liquidationThreshold,
      minCollateral: response.minCollateral,
      maxLeverage: response.maxLeverage,
      openingFee: response.openingFee,
      closingFee: response.closingFee,
      liquidationFee: response.liquidationFee,
      maxPriceDeviation: response.maxPriceDeviation,
      createdTimestamp: response.createdTimestamp,
      lastUpdated: response.lastUpdated,
      maxOpenInterest: response.maxOpenInterest,
      totalLongs: response.totalLongs,
      avgPriceLongs: response.avgPriceLongs,
      pnlLongs: response.pnlLongs,
      totalShorts: response.totalShorts,
      avgPriceShorts: response.avgPriceShorts,
      pnlShorts: response.pnlShorts,
      netPnl: response.netPnl,
      netPnlDec: response.netPnlDec,
      totalOI: response.totalOI,
      totalOIAssets: response.totalOIAssets,
      closeOnlyMode: response.closeOnlyMode,
      feeLastUpdatedTimestamp: response.feeLastUpdatedTimestamp,
      priceDeviationLongs: response.priceDeviationLongs,
      priceDeviationShorts: response.priceDeviationShorts,
      utilizationLongs: response.utilizationLongs,
      utilizationShorts: response.utilizationShorts,
      marketSkew: response.marketSkew,
      baseFeeCumulativeLongs: response.baseFeeCumulativeLongs,
      baseFeeCumulativeShorts: response.baseFeeCumulativeShorts,
      dynamicFeeCumulativeLongs: response.dynamicFeeCumulativeLongs,
      dynamicFeeCumulativeShorts: response.dynamicFeeCumulativeShorts,
      deviationCoeff: response.deviationCoeff,
      deviationConst: response.deviationConst,
      baseCoeff: response.baseCoeff,
      baseConst: response.baseConst,
      maxDynamicBorrowFee: response.maxDynamicBorrowFee,
      dynamicCoeff: response.dynamicCoeff,
      transactionHash: response.transactionHash,
      senderAddress: response.senderAddress,
      pyth: response.pyth ? mapSubgraphResponseToPythDataInterface(response.pyth) : undefined,
    };
  } catch (error) {
    console.log('Error while mapping data', error);
    throw error;
  }
};

export const mapMarketsArrayToInterface = (response: any): Market[] | undefined => {
  try {
    return response.markets.map((market: Market) => {
      return mapSingleMarketToInterface(market);
    });
  } catch (error) {
    console.log('Error while mapping data', error);
    throw error;
  }
};

////////////////////////////////////////////////////////////////
//////////////////////    ORDERS    ////////////////////////////
////////////////////////////////////////////////////////////////

export const mapSingleOrderToInterface = (response: any): Order | undefined => {
  try {
    return {
      id: response.id,
      market: response.market ? mapSingleMarketToInterface(response.market) : undefined,
      user: response.user ? mapSubgraphResponseToAccountInterface(response.user) : undefined,
      orderType: response.orderType,
      isLong: response.isLong,
      isLimitOrder: response.isLimitOrder,
      triggerAbove: response.triggerAbove,
      deadline: response.deadline,
      deadlineISO: response.deadlineISO,
      deltaCollateral: response.deltaCollateral,
      deltaSize: response.deltaSize,
      deltaSizeUsd: response.deltaSizeUsd,
      expectedPrice: response.expectedPrice,
      maxSlippage: response.maxSlippage,
      partnerAddress: response.partnerAddress,
      executionFee: response.executionFee,
      txHash: response.txHash,
      createdTimestamp: response.createdTimestamp,
      status: response.status,
      settledTxHash: response.settledTxHash,
      settledTimestamp: response.settledTimestamp,
      settledTimestampISO: response.settledTimestampISO,
      executionPrice: response.executionPrice,
      settledBy: response.settledBy ? mapSubgraphResponseToAccountInterface(response.settledBy) : undefined,
      cancellationTxHash: response.cancellationTxHash,
      positionId: response.position ? response.position.id : undefined,
    };
  } catch (error) {
    console.log('Error while mapping data', error);
    throw error;
  }
};

export const mapOrdersArrayToInterface = (response: any): Order[] | undefined => {
  try {
    return response.orders.map((order: Order) => {
      return mapSingleOrderToInterface(order);
    });
  } catch (error) {
    console.log('Error while mapping data', error);
    throw error;
  }
};

////////////////////////////////////////////////////////////////
//////////////////////    POSITION    //////////////////////////
////////////////////////////////////////////////////////////////

export const mapSinglePositionToInterface = (response: any): Position | undefined => {
  try {
    return {
      id: response.id,
      market: response.market ? mapSingleMarketToInterface(response.market) : undefined,
      user: response.user ? mapSubgraphResponseToAccountInterface(response.user) : undefined,
      isLong: response.isLong,
      positionCollateral: response.positionCollateral,
      positionSize: response.positionSize,
      avgPrice: response.avgPrice,
      avgPriceDec: response.avgPriceDec,
      lastCumulativeFee: response.lastCumulativeFee,
      status: response.status,
      txHash: response.txHash,
      liquidationTxHash: response.liquidationTxHash,
      closingPrice: response.closingPrice,
      realizedPnl: response.realizedPnl,
      realizedPnlCollateral: response.realizedPnlCollateral,
      realizedFee: response.realizedFee,
      realizedFeeCollateral: response.realizedFeeCollateral,
      netRealizedPnl: response.netRealizedPnl,
      createdTimestamp: response.createdTimestamp,
      lastRefresh: response.lastRefresh,
      lastRefreshISO: response.lastRefreshISO,
    };
  } catch (error) {
    console.log('Error while mapping data', error);
    throw error;
  }
};

export const mapPositionsArrayToInterface = (response: any): Position[] | undefined => {
  try {
    return response.positions.map((position: Position) => {
      return mapSinglePositionToInterface(position);
    });
  } catch (error) {
    console.log('Error while mapping data', error);
    throw error;
  }
};

////////////////////////////////////////////////////////////////
//////////////////////    TOKEN    /////////////////////////////
////////////////////////////////////////////////////////////////

export const mapSubgraphResponseToTokenInterface = (response: any): Token | undefined => {
  try {
    return {
      id: response.id,
      name: response.name,
      symbol: response.symbol,
      decimals: response.decimals,
      pyth: response.pyth ? mapSubgraphResponseToPythDataInterface(response.pyth) : undefined,
      lastPriceUSD: response.lastPriceUSD,
      lastPriceTimestamp: response.lastPriceTimestamp,
    };
  } catch (error) {
    console.log('Error while mapping data', error);
    throw error;
  }
};

////////////////////////////////////////////////////////////////
////////////////////////    PYTH    ////////////////////////////
////////////////////////////////////////////////////////////////

export const mapSubgraphResponseToPriceFeedSnapshotInterface = (response: any): PriceFeedSnapshot | undefined => {
  try {
    return {
      id: response.id,
      priceId: response.priceId,
      publishTime: response.publishTime,
      price: response.price,
      confidence: response.confidence,
    };
  } catch (error) {
    console.log('Error while mapping data', error);
    throw error;
  }
};

export const mapSubgraphResponseToPythDataInterface = (response: any): PythData | undefined => {
  try {
    return {
      id: response.id,
      marketId: response.marketId,
      tokenAddress: response.tokenAddress,
      price: response.price,
      lastUpdatedTimestamp: response.lastUpdatedTimestamp,
    };
  } catch (error) {
    console.log('Error while mapping data', error);
    throw error;
  }
};

////////////////////////////////////////////////////////////////
//////////////////////    VAULTS    ////////////////////////////
////////////////////////////////////////////////////////////////

export const mapSingleVaultToInterface = (response: any): Vault | undefined => {
  try {
    return {
      id: response.id,
      vaultName: response.vaultName,
      vaultSymbol: response.vaultSymbol,
      vaultDecimals: response.vaultDecimals,
      depositToken: response.depositToken ? mapSubgraphResponseToTokenInterface(response.depositToken) : undefined,
      isPaused: response.isPaused,
      feeManagerAddress: response.feeManagerAddress,
      totalAssets: response.totalAssets,
      totalShares: response.totalShares,
      assetsPerShare: response.assetsPerShare,
      assetsPerShareDec: response.assetsPerShareDec,
      sharesPerAsset: response.sharesPerAsset,
      withdrawalFee: response.withdrawalFee,
      profitFromTraderLosses: response.profitFromTraderLosses,
      lossFromTraderProfits: response.lossFromTraderProfits,
      cooldownPeriod: response.cooldownPeriod,
      withdrawalWindow: response.withdrawalWindow,
    };
  } catch (error) {
    console.log('Error while mapping data', error);
    throw error;
  }
};

export const mapVaultsArrayToInterface = (response: any): Vault[] | undefined => {
  try {
    return response.vaults.map((vault: Vault) => {
      return mapSingleVaultToInterface(vault);
    });
  } catch (error) {
    console.log('Error while mapping data', error);
    throw error;
  }
};
