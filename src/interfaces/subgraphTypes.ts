//// NOTE: All fields from the subgraph interfaces have their type as string
//// and are marked as optional. This is because the logic to fetch these data might
//// differ based on the requirement or function, and only required fields are fetched
//// with queries to keep it concise and avoid fetching unnecessary data.

////////////////////////////////////////////////////////////////
////////////////////    ENUMS     //////////////////////////////
////////////////////////////////////////////////////////////////
export enum OrderType {
  OPEN_NEW_POSITION = 'OPEN_NEW_POSITION',
  CLOSE_POSITION = 'CLOSE_POSITION',
  INCREASE_POSITION = 'INCREASE_POSITION',
  DECREASE_POSITION = 'DECREASE_POSITION',
  CANCEL_ORDER = 'CANCEL_ORDER',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  CANCELLED = 'CANCELLED',
  SETTLED = 'SETTLED',
  INVALID = 'INVALID',
}

export enum PositionStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  LIQUIDATED = 'LIQUIDATED',
}
export enum SnxAccountType {
  /** Core Proxy Account */
  CORE = 'CORE',

  /** Perps Market Proxy Account */
  PERP = 'PERP',
}

////////////////////////////////////////////////////////////////
//////////////////////    ACCOUNT   ////////////////////////////
////////////////////////////////////////////////////////////////

export interface Wallet {
  /** User wallet address */
  id?: string;

  /** User positions */
  positions?: Position[];

  /** User orders */
  orders?: Order[];

  /** Total count of orders */
  totalOrdersCount?: string;

  /** Total count of positions created by user - open and closed positions */
  totalPositionsCount?: string;

  /** Total count of open user positions */
  openPositionCount?: string;

  /** Count of total profitable positions */
  countProfitablePositions?: string;

  /** Count of total positions with loss */
  countLossPositions?: string;

  /** Count of liquidated positions */
  countLiquidatedPositions?: string;

  /** Total Realized P&L from Positions in USD */
  totalRealizedPnlPositions?: string;
  /** Total Volume in USD */
  totalVolumeInUsd?: string;

  /** Total Volume Longs  */
  totalVolumeInUsdLongs?: string;

  /** Total Volume Shorts*/
  totalVolumeInUsdShorts?: string;

  /** Total Borrowing Fees accrued across all positions */
  totalAccruedBorrowingFeesInUsd?: string;
}
////////////////////////////////////////////////////////////////
////////////////////// SNX ACCOUNT //////////////////////////
////////////////////////////////////////////////////////////////
export interface SnxAccount {
  /** CORE/PERP + Account ID */
  id?: string;

  /** CORE / PERP */
  type?: SnxAccountType;

  /** Account ID */
  accountId?: string;

  /** Owner wallet address */
  owner?: Wallet;

  /** Count of total orders by this Account ID */
  totalOrdersCount?: string;

  /** Count of total positions by this Account ID */
  totalPositionsCount?: string;

  /** SNX Account orders */
  orders?: Order[];
}

////////////////////////////////////////////////////////////////
//////////////////////    MARKET    ////////////////////////////
////////////////////////////////////////////////////////////////

export interface Market {
  /** Unique identifier for the market */
  id?: string;

  /** Name of the market */
  name?: string;

  /** Symbol representing the market */
  symbol?: string;

  /** Total size of the market */
  size?: string;

  /** Skew value of the market */
  skew?: string;

  /** Current funding rate of the market */
  currentFundingRate?: string;

  /** Current funding velocity of the market */
  currentFundingVelocity?: string;

  /** Feed ID for price oracle */
  feedId?: string;

  /** Maximum funding velocity allowed for the market */
  maxFundingVelocity?: string;

  /** Skew scale of the market */
  skewScale?: string;

  /** Fee charged for market maker transactions */
  makerFee?: string;

  /** Fee charged for market taker transactions */
  takerFee?: string;

  maxMarketValue?: string;

  maxOpenInterest?: string;

  interestRate?: string;
}

////////////////////////////////////////////////////////////////
//////////////////////    ORDERS    ////////////////////////////
////////////////////////////////////////////////////////////////
// settlementReward, referralFees, partnerAddressts
export interface Order {
  id?: string;
  market?: Market;
  user?: Wallet;
  isLimitOrder?: boolean;
  deadline?: string;
  accceptablePrice?: string;
  expectedPriceTime?: string;
  settlementTime?: string;
  trackingCode?: string;
  deltaCollateral?: string;
  deltaSize?: string;
  deltaSizeUsd?: string;
  executionPrice?: string;
  executionFee?: string;
  referralFees?: string;
  txHash?: string;
  createdTimestamp?: string;
  status?: OrderStatus;
  settledTxHash?: string;
  settledTimestamp?: string;
  settledTimestampISO?: string;
  settledBy?: Wallet;
  positionId?: Position;
  formattedDeltaSize?: string;
}

////////////////////////////////////////////////////////////////
//////////////////////    POSITION    //////////////////////////
////////////////////////////////////////////////////////////////

export interface Position {
  /** Position ID - Generated using POS + Account ID + Market ID */
  id?: string; // GraphQL's ID is mapped to string

  /** Market details for the position */
  market?: Market;
  /** User address */
  user?: Wallet /** Account ID that holds the position */;
  account?: SnxAccount;
  /** True if it is a LONG position */
  isLong?: boolean;
  /** Collateral amount deposited backing this position */
  positionCollateral?: string;
  /** Size of the position */
  positionSize?: string;

  /** Average price of the position */
  avgPrice?: string;
  /** Average price of the position in decimals */
  avgPriceDec?: string;
  /** Orders related to this position */
  orders?: Order[];
  /** Position status */
  status?: PositionStatus;
  /** Creation transaction hash */
  txHash?: string;

  /** Liquidation transaction hash */
  liquidationTxHash?: string;

  /** Closing Price of the position. In case of liquidation, this is the liquidation price */
  closingPrice?: string;

  /** Realized PNL in USD (decimals) */
  realizedPnl?: string;

  /** Realized PNL in collateral */
  realizedPnlCollateral?: string;
  /** Amount of opening, closing  */
  realizedFee?: string;

  /** Net Realized PNL in USD (decimal) */
  netRealizedPnl?: string;

  /** Timestamp when position was created */
  createdTimestamp?: string;

  /** Last position updated timestamp */
  lastRefresh?: string;

  /** Last position updated timestamp in string */
  lastRefreshISO?: string;

  /** Accrued borrowing fees till last refresh */
  accruedBorrowingFees?: string;

  /** True if the position can be liquidated */
  canBeLiquidated?: boolean;
}

////////////////////////////////////////////////////////////////
//////////////////////    TOKEN    /////////////////////////////
////////////////////////////////////////////////////////////////
export interface Token {
  // //" Smart contract address of the token "
  id?: string;

  // //" Token name "
  name?: string;

  // //" Token Symbol "
  symbol?: string;

  // //" The string of decimal places for token "
  decimals?: string;

  // //" Reference to Pyth and price data "
  pyth?: PythData;

  // //" To store price snapshots of the token on price updates from Pyth  "
  lastPriceUSD?: string;

  // //" Timestamp of lastPriceUsd "
  lastPriceTimestamp?: string;
}

////////////////////////////////////////////////////////////////
////////////////////////    PYTH    ////////////////////////////
////////////////////////////////////////////////////////////////

// Pyth price data interface for prices received from Pyth
export interface PythPrice {
  price: string;

  conf: string;

  expo: number;

  publish_time: number;
}

// Interface for response received for Pyth Price data
export interface PythPriceResponse {
  // Pyth Price ID
  id: string;

  price: PythPrice;

  ema_price: PythPrice;
}

// " The entity saves all the price feed updates on-chain (by Parifi) "
export interface PriceFeedSnapshot {
  //" Price ID + Timestamp "
  id?: string;

  //" Pyth network price ID "
  priceId?: string;

  //" Publish Timestamp "
  publishTime?: string;

  //" Price "
  price?: string;

  //" Price confidence "
  confidence?: string;
}

// " Pyth Feeds for Parifi market IDs/Token addresses "
export interface PythData {
  // " Pyth Price ID for market/token "
  id?: string;

  // " Market ID "
  marketId?: string;

  // " Token Address "
  tokenAddress?: string;

  // " Price "
  price?: string;

  // " Last updated timestamp "
  lastUpdatedTimestamp?: string;
}

export interface BatchExecute {
  id: string;
  priceUpdateData: string[];
}

export interface collateralDepositsPortfolioData {
  depositedAmount: string;
  collateralSymbol: string;
  collateralName: string;
  collateralDecimals: string;
}

export interface positionsPortolfio {
  status: string;
  market: {
    marketSymbol: string;
  };
  positionSize: string;
  avgPrice: string;
  realizedPnl: string;
  realizedFee: string;
}

export interface PortfolioWallet {
  id: string; // Wallet ID
  snxAccounts: Array<{
    collateralDeposits: collateralDepositsPortfolioData[];
    positions: positionsPortolfio[];
  }>;
}
export interface PorfolioDataSubgraph {
  wallets: PortfolioWallet[]; // Array of Wallet objects
}

export type PriceObject = {
  id: string;
  price: {
    price: string;
    conf: string;
    expo: number;
    publish_time: number;
  };
  ema_price: {
    price: string;
    conf: string;
    expo: number;
    publish_time: number;
  };
};
