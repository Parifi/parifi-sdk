import { getParifiSdkInstanceForTesting } from '..';

describe('Protocol stats', () => {
  it('should return protocol stats data', async () => {
    const parifiSdk = await getParifiSdkInstanceForTesting();
    const protocolData = await parifiSdk.subgraph.getProtocolStats();
    console.log('Protocol stats: ', protocolData);
  });
});
