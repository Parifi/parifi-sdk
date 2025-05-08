import Decimal from 'decimal.js';
import { request } from 'graphql-request';
import {
  checkExistingUser,
  depositedCollateralForSnxAccountsQuery,
  fetchAccountByWalletAddress,
  fetchIntegratorFees,
  fetchLeaderboardUserData,
  fetchRealizedPnlData,
} from './subgraphQueries';
import { convertWeiToEther, DECIMAL_ZERO } from '../../common';
import { CollateralDeposit, LeaderboardUserData } from '../../interfaces/sdkTypes';

export interface depositedCollateralAccountIdResponse {
  owner: {
    id: string;
  };
  accountId: string;
  collateralDeposits: CollateralDeposit[];
}

/// Returns the Realized PNL for positions and vaults for a user address
export const getRealizedPnlForUser = async (
  subgraphEndpoint: string,
  userAddress: string,
): Promise<{
  totalRealizedPnlPositions: Decimal;
  totalRealizedPnlVaults: Decimal;
}> => {
  try {
    // Interface to map fetched data
    interface RealizedPnlSubgraphResponse {
      account: {
        id: string;
        totalRealizedPnlPositions: string;
        totalRealizedPnlVaults: string;
      };
    }

    const query = fetchRealizedPnlData(userAddress);
    const subgraphResponse = await request(subgraphEndpoint, query);
    const realizedPnlResponse: RealizedPnlSubgraphResponse = subgraphResponse as unknown as RealizedPnlSubgraphResponse;

    if (realizedPnlResponse === null || realizedPnlResponse.account === null) {
      console.log('Users Realized Pnl data not found');
      return { totalRealizedPnlPositions: DECIMAL_ZERO, totalRealizedPnlVaults: DECIMAL_ZERO };
    }
    const totalRealizedPnlPositions = new Decimal(realizedPnlResponse.account.totalRealizedPnlPositions);
    const totalRealizedPnlVaults = new Decimal(realizedPnlResponse.account.totalRealizedPnlVaults);
    return { totalRealizedPnlPositions, totalRealizedPnlVaults };
  } catch (error) {
    throw error;
  }
};

// Returns the leaderboard page details for a user address
export const getLeaderboardUserData = async (
  subgraphEndpoint: string,
  userAddresses: string[],
): Promise<LeaderboardUserData[]> => {
  const subgraphResponse: {
    accounts: LeaderboardUserData[];
  } = await request(subgraphEndpoint, fetchLeaderboardUserData(userAddresses));

  const leaderboardUserData: LeaderboardUserData[] = subgraphResponse.accounts as LeaderboardUserData[];
  return leaderboardUserData;
};

export const getAccountByAddress = async (subgraphEndpoint: string, userAddresses: string) => {
  const subgraphResponse: any = await request(subgraphEndpoint, fetchAccountByWalletAddress(userAddresses));
  if (!subgraphResponse) throw new Error('Error while fetching account data');
  return subgraphResponse?.wallet;
};

export const getFeesByAddress = async (
  subgraphEndpoint: string,
  userAddresses: string[],
): Promise<Map<string, number>> => {
  // Temp interface to map subgraph response
  interface SNXAccountResponse {
    id: string;
    accountId: string;
    owner: { id: string };
    integratorFeesGenerated: string;
  }

  const feesByAddress = new Map<string, number>();

  const subgraphResponse: any = await request(subgraphEndpoint, fetchIntegratorFees(userAddresses));
  if (!subgraphResponse) throw new Error('Error while fetching account data');

  const snxAccounts: SNXAccountResponse[] = subgraphResponse?.snxAccounts;
  snxAccounts.forEach((account) => {
    const userFees = feesByAddress.get(account.owner.id);
    if (userFees) {
      // Multiple SNX accounts exist for the wallet address, add fees to previous values
      const totalFees = userFees + convertWeiToEther(account.integratorFeesGenerated);
      feesByAddress.set(account.owner.id, totalFees);
    } else {
      feesByAddress.set(account.owner.id, convertWeiToEther(account.integratorFeesGenerated));
    }
  });
  return feesByAddress;
};

export const checkIfExistingUser = async (subgraphEndpoint: string, userAddress: string) => {
  interface SNXAccountResponse {
    id: string;
    accountId: string;
    totalOrdersCount: string;
  }

  const subgraphResponse: any = await request(subgraphEndpoint, checkExistingUser(userAddress));
  if (!subgraphResponse) throw new Error('Error while fetching account data');

  // A wallet can have multiple SNX accounts
  // The function returns true if it has any one snxAccount with past orders
  const snxAccounts: SNXAccountResponse[] = subgraphResponse?.snxAccounts;
  let isExisting = false;
  for (let index = 0; index < snxAccounts.length; index++) {
    if (Number(snxAccounts[index].totalOrdersCount) > 0) {
      isExisting = true;
      break;
    }
  }

  return isExisting;
};

export const depositedCollateralForSnxAccounts = async (subgraphEndpoint: string, accountIds: string[]) => {
  const subgraphResponse: any = await request(subgraphEndpoint, depositedCollateralForSnxAccountsQuery(accountIds));
  if (!subgraphResponse) throw new Error('Error while fetching account data');
  const snxAccounts: depositedCollateralAccountIdResponse[] = subgraphResponse?.snxAccounts;
  return snxAccounts;
};
