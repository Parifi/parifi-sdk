import { PriceFeedSnapshot, PythData } from '../interfaces/subgraphTypes';
import { CollateralDeposit, Market, Order, Position, SnxAccount, Token, Wallet } from '../interfaces/sdkTypes';

////////////////////////////////////////////////////////////////
//////////////////////    Wallet   ////////////////////////////
////////////////////////////////////////////////////////////////

export const mapResponseToWallet = (response: any): Wallet | undefined => {
  if (!response) return undefined;
  try {
    return {
      id: response?.id,
      // snxAccounts: mapSnxAccountsArray(response.snxAccounts)
    };
  } catch (error) {
    console.log('Error while mapping data', error);
    return undefined;
  }
};

export const mapResponseToWalletArray = (response: any): Wallet[] | undefined => {
  if (!response) return undefined;
  try {
    return response.map((account: any) => {
      return mapResponseToWallet(account);
    });
  } catch (error) {
    console.log('Error while mapping data', error);
    return undefined;
  }
};

////////////////////////////////////////////////////////////////
//////////////////////    SNX Account   ////////////////////////
////////////////////////////////////////////////////////////////

export const mapResponseToSnxAccount = (response: any): SnxAccount | undefined => {
  if (!response) return undefined;

  try {
    return {
      id: response?.id,
      type: response?.type,
      accountId: response?.accountId,
      owner: response?.owner ?? mapResponseToWallet(response?.owner),
      totalOrdersCount: response?.totalOrdersCount,
      totalPositionsCount: response?.totalPositionsCount,
      openPositionCount: response?.openPositionCount,
      countProfitablePositions: response?.countProfitablePositions,
      countLossPositions: response?.countLossPositions,
      countLiquidatedPositions: response?.countLiquidatedPositions,
      totalRealizedPnlPositions: response?.totalRealizedPnlPositions,
      totalVolumeInUsd: response?.totalVolumeInUsd,
      totalVolumeInUsdLongs: response?.totalVolumeInUsdLongs,
      totalVolumeInUsdShorts: response?.totalVolumeInUsdShorts,
      totalAccruedBorrowingFeesInUsd: response?.totalAccruedBorrowingFeesInUsd,
      integratorFeesGenerated: response?.integratorFeesGenerated,
      orders: response?.orders ? mapResponseToOrderArray(response?.orders) : [],
      positions: response?.positions ? mapResponseToPositionArray(response?.positions) : [],
      collateralDeposits: response?.collateralDeposits
        ? mapResponseToCollateralDepositArray(response?.collateralDeposits)
        : [],
    };
  } catch (error) {
    console.log('Error while mapping data', error);
    return undefined;
  }
};

export const mapResponseToSnxAccountArray = (response: any): SnxAccount[] | undefined => {
  if (!response) return undefined;
  try {
    return response.map((snxAccount: any) => {
      return mapResponseToSnxAccount(snxAccount);
    });
  } catch (error) {
    console.log('Error while mapping data', error);
    return undefined;
  }
};

////////////////////////////////////////////////////////////////
//////////////////////    MARKET    ////////////////////////////
////////////////////////////////////////////////////////////////

export const mapResponseToMarket = (response: any): Market | undefined => {
  if (!response) return undefined;
  if (response?.marketName === '' || response?.marketSymbol === '') return undefined;
  try {
    return {
      id: response?.id ?? '',
      marketName: response?.marketName ?? '',
      marketSymbol: response?.marketSymbol ?? '',
      feedId: response?.feedId ?? '',
      marketPrice: response?.marketPrice ?? '0',
      size: response?.size ?? '0',
      skew: response?.skew ?? '0',
      maxOpenInterest: response?.maxOpenInterest ?? '0',
      maxMarketValue: response?.maxMarketValue ?? '0',
      interestRate: response?.interestRate ?? '0',
      currentFundingRate: response?.currentFundingRate ?? '0',
      currentFundingVelocity: response?.currentFundingVelocity ?? '0',
      indexPrice: response?.indexPrice ?? '0',
      skewScale: response?.skewScale ?? '0',
      maxFundingVelocity: response?.maxFundingVelocity ?? '0',
      makerFee: response?.makerFee ?? '0',
      takerFee: response?.takerFee ?? '0',
      initialMarginRatioD18: response?.initialMarginRatioD18 ?? '0',
      minimumPositionMargin: response?.minimumPositionMargin ?? '0',
      maintenanceMarginRatioD18: response?.maintenanceMarginRatioD18 ?? '0',
      minimumInitialMarginRatioD18: response?.minimumInitialMarginRatioD18 ?? '0',
    };
  } catch (error) {
    console.log('Error while mapping data', error);
    return undefined;
  }
};

export const mapResponseToMarketArray = (response: any): (Market | undefined)[] | undefined => {
  if (!response) return undefined;
  try {
    return response.map((market: any) => {
      return mapResponseToMarket(market);
    });
  } catch (error) {
    console.log('Error while mapping data', error);
    return undefined;
  }
};

////////////////////////////////////////////////////////////////
//////////////////////    ORDERS    ////////////////////////////
////////////////////////////////////////////////////////////////

export const mapResponseToOrder = (response: any): Order | undefined => {
  if (!response) return undefined;
  try {
    return {
      id: response?.id,
      market: response?.market ?? mapResponseToMarket(response?.market),
      snxAccountId: response?.snxAccount?.id,
      isLimitOrder: response?.isLimitOrder,
      acceptablePrice: response?.acceptablePrice,
      commitmentTime: response?.commitmentTime,
      expectedPriceTime: response?.expectedPriceTime,
      settlementTime: response?.settlementTime,
      expirationTime: response?.expirationTime,
      trackingCode: response?.trackingCode,
      deltaSize: response?.deltaSize,
      deltaSizeUsd: response?.deltaSizeUsd,
      executionPrice: response?.executionPrice,
      collectedFees: response?.collectedFees,
      settlementReward: response?.settlementReward,
      referralFees: response?.referralFees,
      partnerAddress: response?.partnerAddress,
      txHash: response?.txHash,
      createdTimestamp: response?.createdTimestamp,
      status: response?.status,
      settledTxHash: response?.settledTxHash,
      settledTimestamp: response?.settledTimestamp,
      settledTimestampISO: response?.settledTimestampISO,
      settledBy: response?.settledBy ?? mapResponseToWallet(response?.settledBy),
    };
  } catch (error) {
    console.log('Error while mapping data', error);
    return undefined;
  }
};

export const mapResponseToOrderArray = (response: any): Order[] | undefined => {
  if (!response) return undefined;
  try {
    return response.map((order: any) => {
      return mapResponseToOrder(order);
    });
  } catch (error) {
    console.log('Error while mapping data', error);
    return undefined;
  }
};

////////////////////////////////////////////////////////////////
////////////////////    Collaterals   //////////////////////////
////////////////////////////////////////////////////////////////

function mapResponseToCollateralDeposit(response: any): CollateralDeposit | undefined {
  if (!response) return undefined;
  try {
    return {
      id: response?.id,
      snxAccountId: response?.snxAccountId,
      collateralId: response?.collateralId,
      collateralName: response?.collateralName,
      collateralSymbol: response?.collateralSymbol,
      collateralDecimals: response?.collateralDecimals,
      collateralAddress: response?.collateralAddress,
      currentDepositedAmount: response?.currentDepositedAmount,
      totalAmountDeposited: response?.totalAmountDeposited,
      totalAmountWithdrawn: response?.totalAmountWithdrawn,
      totalAmountLiquidated: response?.totalAmountLiquidated,
    };
  } catch (error) {
    console.log('Error while mapping data', error);
    return undefined;
  }
}

export const mapResponseToCollateralDepositArray = (response: any): CollateralDeposit[] | undefined => {
  if (!response) return undefined;
  try {
    return response.map((deposit: any) => {
      return mapResponseToCollateralDeposit(deposit);
    });
  } catch (error) {
    console.log('Error while mapping data', error);
    return undefined;
  }
};

////////////////////////////////////////////////////////////////
//////////////////////    POSITION    //////////////////////////
////////////////////////////////////////////////////////////////

export const mapResponseToPosition = (response: any): Position | undefined => {
  if (!response) return undefined;
  try {
    return {
      id: response?.id,
      market: response?.market ?? mapResponseToMarket(response?.market),
      snxAccountId: response?.snxAccountId,
      isLong: response?.isLong,
      positionSize: response?.positionSize,
      avgPrice: response?.avgPrice,
      avgPriceDec: response?.avgPriceDec,
      status: response?.status,
      txHash: response?.txHash,
      liquidationTxHash: response?.liquidationTxHash,
      closingPrice: response?.closingPrice,
      realizedPnl: response?.realizedPositionPnl,
      realizedFee: response?.realizedFee,
      netRealizedPnl: response?.realizedPnlAfterFees,
      createdTimestamp: response?.createdTimestamp,
      lastRefresh: response?.lastRefresh,
      lastRefreshISO: response?.lastRefreshISO,
      accruedBorrowingFees: response?.accruedBorrowingFees,
      canBeLiquidated: response?.canBeLiquidated,
    };
  } catch (error) {
    console.log('Error while mapping data', error);
    return undefined;
  }
};

export const mapResponseToPositionArray = (response: any): Position[] | undefined => {
  if (!response) return undefined;

  try {
    return response.map((position: any) => {
      return mapResponseToPosition(position);
    });
  } catch (error) {
    console.log('Error while mapping data', error);
    return undefined;
  }
};

////////////////////////////////////////////////////////////////
//////////////////////    TOKEN    /////////////////////////////
////////////////////////////////////////////////////////////////

export const mapResponseToToken = (response: any): Token | undefined => {
  if (!response) return undefined;

  try {
    return {
      id: response?.id,
      name: response?.name,
      symbol: response?.symbol,
      decimals: response?.decimals,
      pyth: response?.pyth ? mapResponseToPythData(response?.pyth) : undefined,
      lastPriceUSD: response?.lastPriceUSD,
      lastPriceTimestamp: response?.lastPriceTimestamp,
    };
  } catch (error) {
    console.log('Error while mapping data', error);
    return undefined;
  }
};

////////////////////////////////////////////////////////////////
////////////////////////    PYTH    ////////////////////////////
////////////////////////////////////////////////////////////////

export const mapResponseToPriceFeedSnapshot = (response: any): PriceFeedSnapshot | undefined => {
  if (!response) return undefined;

  try {
    return {
      id: response?.id,
      priceId: response?.priceId,
      publishTime: response?.publishTime,
      price: response?.price,
      confidence: response?.confidence,
    };
  } catch (error) {
    console.log('Error while mapping data', error);
    return undefined;
  }
};

export const mapResponseToPythData = (response: any): PythData | undefined => {
  if (!response) return undefined;

  try {
    return {
      id: response?.id,
      marketId: response?.marketId,
      tokenAddress: response?.tokenAddress,
      price: response?.price,
      lastUpdatedTimestamp: response?.lastUpdatedTimestamp,
    };
  } catch (error) {
    console.log('Error while mapping data', error);
    return undefined;
  }
};
