import { gql } from 'graphql-request';

// The `fetchRealizedPnlData` query fetches the realized PnL for a user address
// for vaults and positions
export const fetchRealizedPnlData = (userAddress: string) => gql`
  {
    account(id: "${userAddress.toLowerCase()}") {
      id
      totalRealizedPnlPositions
      totalRealizedPnlVaults
    }
  }
`;

/// Fetch Portfolio total for a set of addresses
/// Portfolio total consists of
/// 1. Realized PNL from positions and vaults - user.totalRealizedPnlPositions, user.totalRealizedPnlVaults
/// 2. Unrealized PNL from positions - positions.netUnrealizedPnlInUsd
/// 3. Deposited liquidity in vaults -
/// 4. Deposited collateral of all open positions - positions.positionCollateral
export const fetchPortfolioData = (userAddresses: string[]) => gql`
{
  accounts(where: {id_in: [${userAddresses.map((id) => `"${id.toLowerCase()}"`).join(', ')}]}) {
    id
    totalRealizedPnlPositions
    totalRealizedPnlVaults
  }
  positions(
    first: 1000
    orderBy: positionCollateral
    orderDirection: desc
    where: {
      user_in: [${userAddresses.map((id) => `"${id.toLowerCase()}"`).join(', ')}], 
      status: OPEN
      }
  ) {
    id
    user {
      id
    }
    netUnrealizedPnlInUsd
    positionCollateral
    market {
      depositToken {
        decimals
        pyth {
          id
          price
        }
      }
    }
  }
  vaultPositions(
    first: 1000
    orderBy: sharesBalance
    orderDirection: desc
    where: {user_in: [${userAddresses.map((id) => `"${id.toLowerCase()}"`).join(', ')}]}
  ) {
    user {
      id
    }
    vault {
      id
      assetsPerShare
      sharesPerAsset
      depositToken {
        decimals
        pyth {
          id
          price
        }
      }
    }
    sharesBalance
  }
}
`;

export const fetchReferralRewardsInUsd = (userAddresses: string[]) => gql`
{
  accounts(
    orderBy: totalReferralRewardsInUsd
    orderDirection: desc
    where: {id_in: [${userAddresses.map((id) => `"${id}"`).join(', ')}]}
  ) {
    id
    totalReferralRewardsInUsd
    unclaimedReferralRewardsUsdc
    unclaimedReferralRewardsWeth
  }
}`;

export const fetchTopAccountsByReferralFees = (count: number = 20, skip: number = 0) => gql`
{
  accounts(
    first: ${count}
    skip: ${skip}
    orderBy: totalReferralRewardsInUsd
    orderDirection: desc
  ) {
    id
    totalReferralRewardsInUsd
    unclaimedReferralRewardsUsdc
    unclaimedReferralRewardsWeth
  }
}`;
export const fetchAccountByWalletAddress = (walletAddress: string) =>
  gql`
  {
    wallet(id: "${walletAddress}") {
      id
    }
  }
`;

// Fetch account specific data for a user address for Leaderboard view
export const fetchLeaderboardUserData = (userAddresses: string[]) => gql`
{
  accounts(
    where: {id_in: [${userAddresses.map((id) => `"${id}"`).join(', ')}]}
  ) {
    id
    totalOrdersCount
    totalPositionsCount
    countProfitablePositions
    countLossPositions
    countLiquidatedPositions
    totalVolumeInUsd
    totalVolumeInUsdLongs
    totalVolumeInUsdShorts
    totalRealizedPnlPositions
    totalAccruedBorrowingFeesInUsd 
  }
}`;

export const fetchIntegratorFees = (userAddresses: string[]) => gql`
  {
    snxAccounts(where:
    {
      owner_in: [${userAddresses.map((id) => `"${id}"`).join(', ')}],
      type: PERP
    }) {
      id
      accountId
      owner {
        id
      }
      integratorFeesGenerated
    }
  }
`;

export const checkExistingUser = (userAddress: string) => gql`
  {
  snxAccounts(
    where: {
      owner: "${userAddress}",
      type: PERP,
    }
  ) {
    id
    accountId
		totalOrdersCount
  }
}
`;

export const depositedCollateralForSnxAccountsQuery = (accountIds: string[]) => gql`
{
  snxAccounts
  (where :{
    accountId_in : [${accountIds.map((id) => `"${id}"`).join(', ')}]
  })
  {
    accountId
    collateralDeposits{
      totalAmountDeposited
      totalAmountWithdrawn
      totalAmountLiquidated
      collateralName
      collateralSymbol
      collateralDecimals
    }
  }
}
`;
