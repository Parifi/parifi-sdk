import 'dotenv/config';
import { Chain } from '@parifi/references';
import { ParifiSdk } from '../../src';
import { PythConfig, RelayerConfig, RelayerI, RpcConfig } from '../../src/interfaces/classConfigs';
import { getParifiSdkInstanceForTesting } from '..';
import { TEST_PRICE_ID_1 } from '../common/constants';

const rpcConfig: RpcConfig = {
  chainId: Chain.ARBITRUM_MAINNET,
};

const pythConfig: PythConfig = {
  pythEndpoint: process.env.PYTH_SERVICE_ENDPOINT,
  username: process.env.PYTH_SERVICE_USERNAME,
  password: process.env.PYTH_SERVICE_PASSWORD,
  isStable: true,
};

const gelatoConfig: RelayerI = {
  apiKey: process.env.GELATO_KEY || '',
};

const relayerConfig: RelayerConfig = {
  gelatoConfig: gelatoConfig,
};

describe('Pyth tests', () => {
  it('should return price update data from public endpoint', async () => {
    // SDK is initialized without any fields for Pyth config, so public endpoints are used
    const sdkWithPublicPyth = new ParifiSdk(rpcConfig, {}, relayerConfig, pythConfig);
    await sdkWithPublicPyth.init();

    const priceUpdateData = await sdkWithPublicPyth.pyth.getVaaPriceUpdateData([TEST_PRICE_ID_1]);
    expect(priceUpdateData).not.toBeNull();
  });

  it('should return price update data from dedicated endpoint with authentication', async () => {
    const parifiSdk = await getParifiSdkInstanceForTesting();

    // Parifi SDK uses authentication using the above Pyth config
    const priceUpdateData = await parifiSdk.pyth.getVaaPriceUpdateData([TEST_PRICE_ID_1]);
    expect(priceUpdateData).not.toBeNull();
  });
});
