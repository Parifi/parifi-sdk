import { gql } from 'graphql-request';

// Fetches all positions by a user (Both open and closed)
export const fetchPositionsByUserQuery = (userAddress: string, count: number = 20, skip: number = 0) =>
  gql`
    {
    snxAccounts(
      first: ${count}
      skip: ${skip}
      where: { owner: "${userAddress}", type: PERP }) {
      id
      accountId
      owner {
        id
      }
      collateralDeposits {
        id
        collateralName
        collateralSymbol
        collateralDecimals
        collateralAddress
        currentDepositedAmount
        totalAmountDeposited
        totalAmountWithdrawn
        totalAmountLiquidated
      }
      positions(where: {status_in: [OPEN, CLOSED, LIQUIDATED]}) {
        id
        market {
          id
          marketName
          marketSymbol
          feedId
        }
        positionSize
        avgPrice
        avgPriceDec
        isLong
        createdTimestamp
        status
        txHash
        liquidationTxHash
        closingPrice
        realizedPositionPnl
        realizedPnlAfterFees
        totalFeesPaid
        createdTimestamp
        lastRefresh
        lastRefreshISO
        canBeLiquidated
    }
    }
  }`;

// Fetches positions for a user address by status
export const fetchPositionsByUserQueryAndStatus = (
  userAddress: string,
  status: string,
  count: number = 20,
  skip: number = 0,
) =>
  gql`
    {
    snxAccounts(
      first: ${count}
      skip: ${skip}
      where: { owner: "${userAddress}", type: PERP }
    ) {
      id
      accountId
      owner {
        id
      }
      collateralDeposits {
        id
        collateralName
        collateralSymbol
        collateralDecimals
        collateralAddress
        currentDepositedAmount
        totalAmountDeposited
        totalAmountWithdrawn
        totalAmountLiquidated
      }
      positions(where: {status: ${status} }) {
        id
        market {
          id
          marketName
          marketSymbol
          feedId
        }
        positionSize
        avgPrice
        avgPriceDec
        isLong
        createdTimestamp
        status
        txHash
        liquidationTxHash
        closingPrice
        realizedPositionPnl
        realizedPnlAfterFees
        totalFeesPaid
        createdTimestamp
        lastRefresh
        lastRefreshISO
        canBeLiquidated
    }
    }
  }`;

// Fetches open positions for a user address
export const fetchOpenPositionsByUser = (userAddress: string, count: number = 20, skip: number = 0) =>
  gql`
    {
    snxAccounts(
      first: ${count}
      skip: ${skip}
      where: {
        owner: "${userAddress}",
        type: PERP,
        openPositionCount_gt: 0
      }
    ) {
      id
      accountId
      owner {
        id
      }
      collateralDeposits {
        id
        collateralName
        collateralSymbol
        collateralDecimals
        collateralAddress
        currentDepositedAmount
        totalAmountDeposited
        totalAmountWithdrawn
        totalAmountLiquidated
      }
      positions(where: {status: OPEN }) {
        id
        market {
          id
          marketName
          marketSymbol
          feedId
        }
        positionSize
        avgPrice
        avgPriceDec
        isLong
        createdTimestamp
        status
        txHash
        liquidationTxHash
        closingPrice
        realizedPositionPnl
        realizedPnlAfterFees
        totalFeesPaid
        createdTimestamp
        lastRefresh
        lastRefreshISO
        canBeLiquidated
      }
    }
  }`;

// Fetches positions for a user address by status
export const fetchUserPositionHistory = (userAddress: string, count: number = 20, skip: number = 0) =>
  gql`
    {
    snxAccounts(
      first: ${count}
      skip: ${skip}
      where: { owner: "${userAddress}", type: PERP }
    ) {
      id
      accountId
      owner {
        id
      }
      collateralDeposits {
        id
        collateralName
        collateralSymbol
        collateralDecimals
        collateralAddress
        currentDepositedAmount
        totalAmountDeposited
        totalAmountWithdrawn
        totalAmountLiquidated
      }
      positions(where: {status_in: [CLOSED, LIQUIDATED]}) {
        id
        market {
          id
          marketName
          marketSymbol
          feedId
        }
        positionSize
        avgPrice
        avgPriceDec
        isLong
        createdTimestamp
        status
        txHash
        liquidationTxHash
        closingPrice
        realizedPositionPnl
        realizedPnlAfterFees
        totalFeesPaid
        createdTimestamp
        lastRefresh
        lastRefreshISO
        canBeLiquidated
    }
    }
  }`;

export const fetchPositionByIdQuery = (positionId: string) =>
  gql`
    {
        position(
            id: "${positionId}"
        ) {
            id
            market {
              id,
              marketName,
              marketSymbol,
              feedId 
            }
            snxAccount{
              id
              accountId
            }
            isLong
            positionSize
            avgPrice
            avgPriceDec
            status
            txHash
            liquidationTxHash
            closingPrice
            realizedPositionPnl
            realizedPnlAfterFees
            totalFeesPaid
            createdTimestamp
            lastRefresh
            lastRefreshISO
            canBeLiquidated
        }
    }`;

export const fetchPositionsToLiquidateQuery = (count: number) => gql`
  {
    positions(where: { status: OPEN, canBeLiquidated: true }, first: ${count}, orderBy: positionSize, orderDirection: desc) {
      id
    }
  }
`;

// Fetches positions for a user address by status
export const fetchUserPositionHistoryWithTime = (
  userAddress: string,
  startTimestamp: number,
  endTimestamp: number,
  count: number = 20,
  skip: number = 0,
) =>
  gql`
    {
    snxAccounts(
      first: ${count}
      skip: ${skip}
      where: {
        owner: "${userAddress}",
        type: PERP
      }
    ) {
      id
      accountId
      owner {
        id
      }
      collateralDeposits {
        id
        collateralName
        collateralSymbol
        collateralDecimals
        collateralAddress
        currentDepositedAmount
        totalAmountDeposited
        totalAmountWithdrawn
        totalAmountLiquidated
      }
      positions( where: {
          status_in: [CLOSED, LIQUIDATED],
          createdTimestamp_gte: ${startTimestamp}
          createdTimestamp_lte: ${endTimestamp}
      }) {
        id
        market {
          id
          marketName
          marketSymbol
          feedId
        }
        positionSize
        positionCollateral
        avgPrice
        avgPriceDec
        isLong
        createdTimestamp
        status
        txHash
        liquidationTxHash
        closingPrice
        realizedPositionPnl
        realizedPnlAfterFees
        totalFeesPaid
        createdTimestamp
        lastRefresh
        lastRefreshISO
        canBeLiquidated
    }
    }
  }`;

// Fetches positions for a user address by status
export const fetchUserOpenPositionsWithTime = (
  userAddress: string,
  startTimestamp: number,
  endTimestamp: number,
  count: number = 20,
  skip: number = 0,
) =>
  gql`
    {
    snxAccounts(
      first: ${count}
      skip: ${skip}
      where: {
        owner: "${userAddress}",
        type: PERP,
        positions_: {
          status: OPEN,
          createdTimestamp_gte: ${startTimestamp}
          createdTimestamp_lte: ${endTimestamp}
          }
      }
    ) {
      id
      accountId
      owner {
        id
      }
      collateralDeposits {
        id
        collateralName
        collateralSymbol
        collateralDecimals
        collateralAddress
        currentDepositedAmount
        totalAmountDeposited
        totalAmountWithdrawn
        totalAmountLiquidated
      }
      positions {
        id
        market {
          id
          marketName
          marketSymbol
          feedId
        }
        positionSize
        avgPrice
        avgPriceDec
        isLong
        createdTimestamp
        status
        txHash
        liquidationTxHash
        closingPrice
        realizedPositionPnl
        realizedPnlAfterFees
        totalFeesPaid
        createdTimestamp
        lastRefresh
        lastRefreshISO
        canBeLiquidated
    }
    }
  }`;

export const fetchLiquidatedPositionsBySnxAccount = (snxAccountId: string, lastRefresh: number) =>
  gql`
    {
    snxAccount(id: "${snxAccountId}"
    ) {
      id
      accountId
      owner {
        id
      }
      collateralDeposits {
        id
        collateralName
        collateralSymbol
        collateralDecimals
        collateralAddress
        currentDepositedAmount
        totalAmountDeposited
        totalAmountWithdrawn
        totalAmountLiquidated
      }
      positions(where: { status: LIQUIDATED, lastRefresh_gt: ${lastRefresh} }) {
        id
        market {
          id
          marketName
          marketSymbol
          feedId
        }
        positionSize
        avgPrice
        avgPriceDec
        isLong
        createdTimestamp
        status
        txHash
        liquidationTxHash
        closingPrice
        realizedPositionPnl
        realizedPnlAfterFees
        totalFeesPaid
        createdTimestamp
        lastRefresh
        lastRefreshISO
        canBeLiquidated
    }
    }
  }`;

export const fetchCrossMarginPositionsBySnxAccount = (snxAccountId: string, lastRefresh: number) => gql`
  {
    snxAccount(id: "${snxAccountId}") {
      accountId
      collateralDeposits {
        totalAmountLiquidated
      }
      positions(where: { status: LIQUIDATED, lastRefresh_gt: ${lastRefresh} }) {
        lastRefresh
      }
    }
  }
`;

// Fetches positions for a user address by status
export const fetchAllOpenPositionsWithTime = (
  startTimestamp: number,
  endTimestamp: number,
  count: number = 20,
  skip: number = 0,
) =>
  gql`
    {
    snxAccounts(
      first: ${count}
      skip: ${skip}
      where: { 
      type: PERP
      openPositionCount_gt:0
      }
    ) {
      id
      accountId
      owner {
        id
      }
      collateralDeposits {
        id
        collateralName
        collateralSymbol
        collateralDecimals
        collateralAddress
        currentDepositedAmount
        totalAmountDeposited
        totalAmountWithdrawn
        totalAmountLiquidated
      }
      positions(where: {
          status: OPEN,
          createdTimestamp_gte: ${startTimestamp}
          createdTimestamp_lte: ${endTimestamp}
          }) 
      {
        id
        market {
          id
          marketName
          marketSymbol
          feedId
        }
        positionSize
        avgPrice
        avgPriceDec
        isLong
        createdTimestamp
        status
        txHash
        liquidationTxHash
        closingPrice
        realizedPositionPnl
        realizedPnlAfterFees
        totalFeesPaid
        createdTimestamp
        lastRefresh
        lastRefreshISO
        canBeLiquidated
    }
    }
  }`;

// Fetches positions for a user address by status
export const fetchAllPositionHistoryWithTime = (
  startTimestamp: number,
  endTimestamp: number,
  count: number = 20,
  skip: number = 0,
) =>
  gql`
    {
    snxAccounts(
      first: ${count}
      skip: ${skip}
      where: {
        type: PERP
        totalPositionsCount_gt :0
      }
    ) {
      id
      accountId
      owner {
        id
      }
      collateralDeposits {
        id
        collateralName
        collateralSymbol
        collateralDecimals
        collateralAddress
        currentDepositedAmount
        totalAmountDeposited
        totalAmountWithdrawn
        totalAmountLiquidated
      }
      positions(where: {
          status_in: [CLOSED, LIQUIDATED],
          createdTimestamp_gte: ${startTimestamp}
          createdTimestamp_lte: ${endTimestamp}
      }) {
        id
        market {
          id
          marketName
          marketSymbol
          feedId
        }
        positionSize
        avgPrice
        avgPriceDec
        isLong
        createdTimestamp
        status
        txHash
        liquidationTxHash
        closingPrice
        realizedPositionPnl
        realizedPnlAfterFees
        totalFeesPaid
        createdTimestamp
        lastRefresh
        lastRefreshISO
        canBeLiquidated
    }
    }
  }`;
