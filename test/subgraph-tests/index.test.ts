import { ParifiSdk } from '../../src';
import { gql } from 'graphql-request';
import { getParifiSdkInstanceForTesting } from '..';
import { TEST_USER_1 } from '../common/constants';

describe('Query fetching logic from subgraph', () => {
  let parifiSdk: ParifiSdk | undefined = undefined;

  beforeAll(async () => {
    parifiSdk = await getParifiSdkInstanceForTesting();
  });

  it('should return results for fetching any valid query data', async () => {
    if (!parifiSdk) throw new Error('Parifi SDK not initialized');
    /// Subgraph query to get selective fields from positions
    const query = gql`
      {
        positions {
          id
          isLong
          lastRefresh
        }
      }
    `;

    const response = await parifiSdk.subgraph.executeSubgraphQuery(query);
    expect(response.positions.length).toBeGreaterThan(0);
  });

  it('should return user estimated rewards for a period of time', async () => {
    if (!parifiSdk) throw new Error('Parifi SDK not initialized');

    const totalRewards = 50000; // 50k esPRF
    const userAddress = TEST_USER_1;

    // Default to one week before current time
    const startTimestamp = Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000);
    const endTimestamp = Math.floor(Date.now() / 1000);

    const userRewards = await parifiSdk.subgraph.getEstimatedRewardsForUser(
      userAddress,
      totalRewards,
      startTimestamp,
      endTimestamp,
    );
    console.log('User rewards : ', userRewards);
    expect(userRewards).toBeGreaterThan(0);
  });
});
