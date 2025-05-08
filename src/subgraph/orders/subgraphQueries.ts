import { gql } from 'graphql-request';

// Fetch all orders by `userAddress`
export const fetchOrdersByUserQuery = (userAddress: string, count: number = 50, skip: number = 0) =>
  gql`{
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
      orders {
        id
        market {
          id
          marketName
          marketSymbol
          feedId
        }
        expirationTime
        deltaSize
        executionPrice
        isLimitOrder
        status
        createdTimestamp
        txHash
        partnerAddress
        collectedFees
        settledTxHash
        settledTimestamp
        deltaSizeUsd
        acceptablePrice
        settledBy {
          id
        }
      }
    }
  }
`;

// Fetch all orders by `userAddress`
export const fetchSettledOrdersCountBasedOnTimeStampByUserQuery = (
  userAddress: string,
  count: number = 50,
  skip: number = 0,
  startTimeStamp: number, // unix timestamp
  endTimeStamp: number, //unix timestamp
) =>
  gql`{
    snxAccounts(
      first: ${count}
      skip: ${skip}
      where: { owner: "${userAddress}", type: PERP }) {
      id
      accountId
      owner {
        id
      }
       orders(
      where: {status: SETTLED, createdTimestamp_gt: ${startTimeStamp}, createdTimestamp_lt: ${endTimeStamp}}
    ) {
        id
      }
    }
  }
`;

export const fetchOrdersByIdQuery = (orderId: string) =>
  gql`
  {
    order(id: "${orderId}") {
    id
    market {
      id
      marketName
      marketSymbol
      feedId
    }
    expirationTime
    deltaSize
    executionPrice
    isLimitOrder
    status
    createdTimestamp
    txHash
    partnerAddress
    collectedFees
    settledTxHash
    settledTimestamp
    deltaSizeUsd
    acceptablePrice
    settledBy {
      id
    }
    snxAccount {
      id
      accountId
    }
  }
}
`;
