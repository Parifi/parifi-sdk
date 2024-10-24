import { gql } from 'graphql-request';

// Fetch all orders by `userAddress`
export const fetchOrdersByUserQuery = (userAddress: string, count: number = 10, skip: number = 0) =>
  gql`
    {
  orders(
    first: ${count}
    skip: ${skip}
    where: {user: "${userAddress.toLowerCase()}"}
    orderBy: createdTimestamp
    orderDirection: desc
  ) {
    id
    market {
      id
      marketName
      marketSymbol
      feedId
    }
    user {
      id
    }
    expirationTime
    deltaSize
    deltaCollateral
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
    position {
      id
      positionSize
    }
    snxAccount {
      id
    }
  }  
}`;

export const fetchPendingOrdersQuery = (
  currentTimestamp: number = Math.floor(Date.now() / 1000),
  count: number,
  skip: number = 0,
) =>
  gql`
  {
  orders(
    where: {status: PENDING ,expirationTime_gt:"${currentTimestamp}"}
    first: ${count}
    skip: ${skip}
    orderBy: createdTimestamp
    orderDirection: desc
  ) {
    id
    market {
      id
      marketName
      marketSymbol
      feedId
    }
    user {
      id
    }
    expirationTime
    deltaSize
    deltaCollateral
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
    position {
      id
      positionSize
    }
    snxAccount {
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
    user {
      id
    }
    expirationTime
    deltaSize
    deltaCollateral
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
    position {
      id
      positionSize
    }
    snxAccount {
      id
      accountId
    }
  }
}
`;

export const fetchPriceIdsFromOrderIdsQuery = (orderIds: string[]) =>
  gql`
  {
    orders(
      where: {
        id_in: [${orderIds.map((id) => `"${id}"`).join(', ')}]
      }
    ) {
      id
      market {
        id,marketName,marketSymbol,feedId 
    }
    }
  }
`;

export const fetchPartnerRewards = (partnerAddress: string, count: number = 20, skip: number = 0) => gql`
  {
    referrals(
      first: ${count}
      skip: ${skip}
      orderBy: timestamp
      orderDirection: desc
      where: { partner: "${partnerAddress.toLowerCase()}" }
    ) {
      id
      partner { id }
      referredUser { id }
      sizeInUsd
      timestamp
      txHash
      rewardToken { id symbol decimals }
      referralRewardsInUsd
      referralRewardsInToken
    }
  }
`;

export const fetchPositionIdsForOrderIds = (orderIds: string[]) => gql`
{
  orders(
    where: {
      id_in: [${orderIds.map((id) => `"${id.toLowerCase()}"`).join(', ')}]
    }
  ) {
    id
    position { id }
  }
}
`;

export const fetchCollateralForOrderUsingAccountId = (accountId: string | string[]) => gql`
{
  collateralDeposits(where:{
    snxAccount_in: [${(Array.isArray(accountId) ? accountId : [accountId]).map((id) => `"${id}"`).join(', ')}]
  }) {
    id
    depositedAmount
    collateralName
    collateralSymbol
    collateralDecimals
    collateralAddress
    snxAccount {
      id
      accountId
    }
  }
}
`;
