import { P } from '@parifi/synthetix-sdk-ts/dist/index-BTlMb-Ja';
import { getParifiSdkInstanceForTesting } from '..';
import { ARB_SEPOLIA_MARKET_COLLATERAL_PYTH_ID } from '../../src';

describe('Portfolio data fetching logic from subgraph', () => {
  it('should return  portfolio data', async () => {
    const userAddress = [
      '0x0000000000000000000000000000000000000000',
      '0x14a574faf59023792372251501337fd2bdb75986',
      '0x000000091e379eda0a6f8ec0d945ecac32628538',
      '0x092772cdef109fed26052e79b952ac5404f1ed21',
      '0x11e82bbd9477f62562c88b140d2d309030707303',
      '0xc96cfb18c39dc02fba229b6ea698b1ad5576df4c',
    ];
    const parifiSdk = await getParifiSdkInstanceForTesting();
    const priceIdArray: string[] = Array.from(ARB_SEPOLIA_MARKET_COLLATERAL_PYTH_ID.values());
    const data = await parifiSdk.pyth.getLatestPricesFromPyth(priceIdArray);
    const data1 = parifiSdk.subgraph.transformPriceArray(data);
    // console.log(data1);
    console.log('----------------------------------------------------------------');
    const data2 = await parifiSdk.subgraph.getPortfolioDataByUsersAddress(userAddress, data1);
    console.log('----------------------------------------------------------------');
    console.log(data2);
    console.log('----------------------------------------------------------------');
  });
});
