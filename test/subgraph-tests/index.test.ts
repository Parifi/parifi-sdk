import { RpcConfig } from '@parifi/synthetix-sdk-ts/dist/interface/classConfigs';
import { ParifiSdk } from '../../src';
import { gql } from 'graphql-request';
import { Chain } from '@parifi/references';
import { getParifiSdkInstanceForTesting } from '..';
const rpcConfig: RpcConfig = {
  chainId: Chain.ARBITRUM_SEPOLIA,
};

const parifiSdk = new ParifiSdk(rpcConfig, {}, {}, {});

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
        positions{
          id
          isLong
          lastRefresh
        }
      }
    `;

    const response = await parifiSdk.subgraph.executeSubgraphQuery(query);
    expect(response.positions.length).toBeGreaterThan(0);
  });
});
