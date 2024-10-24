import { formatEther, formatUnits } from 'ethers';
import { PriceFeedSnapshot, PythData, Token } from '../interfaces/subgraphTypes';
import { DepositCollateral, Market, Order, Position, Wallet } from '../interfaces/sdkTypes';
import { Market as MarketSg } from '../interfaces/subgraphTypes';

////////////////////////////////////////////////////////////////
//////////////////////    Wallet   ////////////////////////////
////////////////////////////////////////////////////////////////

export const mapSubgraphResponseToWalletInterface = (response: any): Wallet | undefined => {
  if (response === null) return undefined;
  try {
    return {
      id: response.id,
      totalOrdersCount: response.totalOrdersCount,
      totalPositionsCount: response.totalPositionsCount,
      totalRealizedPnlPositions: response.totalRealizedPnlPositions,
      openPositionCount: response.openPositionCount,
      countProfitablePositions: response.countProfitablePositions,
      countLossPositions: response.countLossPositions,
      countLiquidatedPositions: response.countLiquidatedPositions,
      totalVolumeInUsd: response.totalVolumeInUsd,
      totalVolumeInUsdLongs: response.totalVolumeInUsdLongs,
      totalVolumeInUsdShorts: response.totalVolumeInUsdShorts,
      totalAccruedBorrowingFeesInUsd: response.totalAccruedBorrowingFeesInUsd,
    };
  } catch (error) {
    console.log('Error while mapping data', error);
    throw error;
  }
};

////////////////////////////////////////////////////////////////
//////////////////////    MARKET    ////////////////////////////
////////////////////////////////////////////////////////////////

export const mapSingleMarketToInterface = (response: MarketSg): Market | undefined => {
  if (response === null) return undefined;
  if (response.marketName === '' || response.marketSymbol === '') return undefined;
  try {
    return {
      id: response.id ?? '',
      marketName: response.marketName ?? '',
      marketSymbol: response.marketSymbol ?? '',
      feedId: response.feedId ?? '',
      marketPrice: response.marketPrice ?? '0',
      size: response.size ?? '0',
      skew: response.skew ?? '0',
      maxOpenInterest: response.maxOpenInterest ?? '0',
      maxMarketValue: response.maxMarketValue ?? '0',
      interestRate: response.interestRate ?? '0',
      currentFundingRate: response.currentFundingRate ?? '0',
      currentFundingVelocity: response.currentFundingVelocity ?? '0',
      indexPrice: response.indexPrice ?? '0',
      skewScale: response.skewScale ?? '0',
      maxFundingVelocity: response.maxFundingVelocity ?? '0',
      makerFee: response.makerFee ?? '0',
      takerFee: response.takerFee ?? '0',
      initialMarginRatioD18: response.initialMarginRatioD18 ?? '0',
      minimumPositionMargin: response.minimumPositionMargin ?? '0',
      maintenanceMarginRatioD18: response.maintenanceMarginRatioD18 ?? '0',
      minimumInitialMarginRatioD18: response.minimumInitialMarginRatioD18 ?? '0',
    };
  } catch (error) {
    console.log('Error while mapping data', error);
    throw error;
  }
};

export const mapWalletsArrayToInterface = (response: any): Wallet[] | undefined => {
  if (response === null) return undefined;
  try {
    return response.accounts.map((account: Wallet) => {
      return mapSubgraphResponseToWalletInterface(account);
    });
  } catch (error) {
    console.log('Error while mapping data', error);
    throw error;
  }
};

export const mapMarketsArrayToInterface = (response: MarketSg[]): (Market | undefined)[] | undefined => {
  if (response === null) return undefined;
  try {
    return response.map((market: MarketSg) => {
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

export const mapSingleOrderToInterface = (
  orderResponse: any,
  depositCollateral?: DepositCollateral[] | undefined,
): Order | undefined => {
  if (orderResponse === null) return undefined;
  try {
    return {
      id: orderResponse.id,
      market: mapSingleMarketToInterface(orderResponse.market),
      user: orderResponse.user ? mapSubgraphResponseToWalletInterface(orderResponse.user) : undefined,
      isLimitOrder: orderResponse.isLimitOrder,
      deadline: orderResponse.expirationTime,
      deltaCollateral: orderResponse.deltaCollateral,
      deltaSize: orderResponse.deltaSize,
      deltaSizeUsd: orderResponse.deltaSizeUsd,
      executionFee: orderResponse.collectedFees,
      txHash: orderResponse.txHash,
      createdTimestamp: orderResponse.createdTimestamp,
      status: orderResponse.status,
      settledTxHash: orderResponse.settledTxHash,
      settledTimestamp: orderResponse.settledTimestamp,
      settledTimestampISO: orderResponse.settledTimestampISO,
      executionPrice: orderResponse.executionPrice,
      formattedExecutionPrice: formatEther(orderResponse.executionPrice ?? '0'),
      expectedPrice: orderResponse.acceptablePrice,
      formateedExpectedPrice: formatEther(orderResponse.acceptablePrice ?? '0'),
      settledBy: orderResponse.settledBy ? mapSubgraphResponseToWalletInterface(orderResponse.settledBy) : undefined,
      positionId: orderResponse.position ? orderResponse.position.id : undefined,
      formattedDeltaSize: formatEther(orderResponse.deltaSize ?? '0'),
      depositCollateral: depositCollateral,
      snxAccount: {
        id: orderResponse?.snxAccount?.id,
        accountId: orderResponse?.snxAccount?.accountId,
      },
    };
  } catch (error) {
    console.log('Error while mapping data', error);
    throw error;
  }
};

export const mapOrdersArrayToInterface = (
  response: any,
  collateralDepositResponse: Record<string, DepositCollateral[]>,
): Order[] | undefined => {
  if (response === null) return undefined;
  try {
    return response.orders.map((order: Order) => {
      const depositedCollateral = collateralDepositResponse[order?.snxAccount?.id || ''];
      return mapSingleOrderToInterface(order, depositedCollateral);
    });
  } catch (error) {
    console.log('Error while mapping data', error);
    throw error;
  }
};
export const mapOrderArrayToPriceid = (response:any) =>{
  if (response === null) return undefined;
  try {
    return response.orders.map((order: Order) => {
      return  {
        priceIds :order.market?.feedId
      }
    });
  } catch (error) {
    console.log('Error while mapping data', error);
    throw error;
  }
}
export const mapDespositCollateralArrayToInterface = (response: any): DepositCollateral[] | undefined => {
  if (response === null) return undefined;
  try {
    return response.collateralDeposits.map((depositedCollateral: DepositCollateral) => {
      return mapSingleDepoistCollateral(depositedCollateral);
    });
  } catch (error) {
    console.log('Error while mapping data', error);
    throw error;
  }
};

////////////////////////////////////////////////////////////////
//////////////////////    POSITION    //////////////////////////
////////////////////////////////////////////////////////////////

export const mapSinglePositionToInterface = (
  response: any,
  depositCollateral?: DepositCollateral[] | undefined,
): Position | undefined => {
  if (response === null) return undefined;
  try {
    return {
      id: response.id,
      market: response.market ? mapSingleMarketToInterface(response.market) : undefined,
      user: response.user ? mapSubgraphResponseToWalletInterface(response.user) : undefined,
      isLong: response.isLong,
      positionCollateral: response.positionCollateral,
      positionSize: response.positionSize,
      avgPrice: response.avgPrice,
      formattedAvgPrice: formatEther(response.avgPrice ?? '0'),
      status: response.status,
      txHash: response.txHash,
      liquidationTxHash: response.liquidationTxHash,
      closingPrice: response.closingPrice,
      formattedClosingPrice: formatEther(response.closingPrice ?? '0'),
      realizedPnl: response.realizedPnl,
      realizedFee: response.realizedFee,
      netRealizedPnl: response.netRealizedPnl,
      createdTimestamp: response.createdTimestamp,
      lastRefresh: response.lastRefresh,
      lastRefreshISO: response.lastRefreshISO,
      canBeLiquidated: response.canBeLiquidated,
      accruedBorrowingFees: response.accruedBorrowingFees,
      depositCollateral: depositCollateral,
      formattedRealizedFee: formatEther(response.realizedFee ?? '0'),
      snxAccount: {
        id: response.snxAccount.id,
        accountId: response.snxAccount.accountId,
      },
    };
  } catch (error) {
    console.log('Error while mapping data', error);
    throw error;
  }
};

export const mapPositionsArrayToInterface = (
  response: any,
  collateralDepositResponse: Record<string, DepositCollateral[]>,
): Position[] | undefined => {
  if (response === null) return undefined;

  try {
    return response.positions.map((position: any) => {
      const depositedCollateral = collateralDepositResponse[position?.snxAccount?.id || ''];
      return mapSinglePositionToInterface(position, depositedCollateral);
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
  if (response === null) return undefined;

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
  if (response === null) return undefined;

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
  if (response === null) return undefined;

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

export const mapSingleDepoistCollateral = (collateralDepositsResponse: any): DepositCollateral | undefined => {
  if (collateralDepositsResponse === null) return undefined;
  try {
    return {
      id: collateralDepositsResponse.id,
      depositedAmount: collateralDepositsResponse.depositedAmount,
      collateralName: collateralDepositsResponse.collateralName,
      collateralSymbol: collateralDepositsResponse.collateralSymbol,
      collateralDecimals:
        collateralDepositsResponse.collateralDecimals !== '0' ? collateralDepositsResponse.collateralDecimals : '18',
      collateralAddress: collateralDepositsResponse.collateralAddress,
      formattedDepositedAmount: formatUnits(
        collateralDepositsResponse.depositedAmount,
        collateralDepositsResponse.collateralDecimals !== '0'
          ? Number(collateralDepositsResponse.collateralDecimals)
          : 18, // Ensuring `collateralDecimals` is a number
      ),
      snxAccount: {
        id: collateralDepositsResponse?.snxAccount?.id,
        accountId: collateralDepositsResponse?.snxAccount?.accountId,
      },
    };
  } catch (error) {
    console.log('Error while mapping data', error);
    throw error;
  }
};
