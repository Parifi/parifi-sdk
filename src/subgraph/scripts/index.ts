import request from 'graphql-request';
import { fetchIntegratorFeesWithTimestampQuery } from './subgraphQueries';
import { Decimal } from 'decimal.js';
import { WAD } from '../../common';

export const getEstimatedRewardsForUser = async (
  subgraphEndpoint: string,
  userAddress: string,
  totalRewardsForPeriod: number,
  startTimestamp: number,
  endTimestamp: number,
): Promise<number> => {
  interface FeeDetailsInterface {
    id: string;
    integratorFeesGenerated: string;
    accountId: string;
    owner: { id: string };
    orders: {
      id: string;
      referralFees: string;
      collectedFees: string;
    }[];
  }

  const response: any = await request(
    subgraphEndpoint,
    fetchIntegratorFeesWithTimestampQuery(startTimestamp, endTimestamp),
  );
  const feeDetails: FeeDetailsInterface[] = response?.snxAccounts ?? [];

  let totalFeesForPeriod = 0;
  let userFeesForPeriod = 0;
  feeDetails.forEach((account) => {
    account.orders.forEach((order) => {
      const formattedFees = new Decimal(order.referralFees).div(WAD);
      if (account.owner.id == userAddress) {
        userFeesForPeriod += Number(formattedFees.toString());
      }
      totalFeesForPeriod += Number(formattedFees.toString());
    });
  });

  if (totalFeesForPeriod === 0) {
    return 0;
  }
  const estimatedUserRewards = (userFeesForPeriod * totalRewardsForPeriod) / totalFeesForPeriod;
  return estimatedUserRewards;
};
