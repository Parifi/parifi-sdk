import { getParifiSdkInstanceForTesting } from '..';
import { TEST_MARKET_ID1 } from '../common/constants';

describe('Market fetching logic from subgraph', () => {
  it('should return correct market details', async () => {
    const parifiSdk = await getParifiSdkInstanceForTesting();
    const markets = await parifiSdk.subgraph.getAllMarketsFromSubgraph();
    expect(markets.length).toBeGreaterThan(80);
  });

  it('should return correct market details', async () => {
    const parifiSdk = await getParifiSdkInstanceForTesting();
    const marketId = TEST_MARKET_ID1;
    const market = await parifiSdk.subgraph.getMarketById(marketId);
    expect(market.id).toBe(marketId);
    expect(market.marketName).toBe('Ethereum');
    expect(market.marketSymbol).toBe('ETH');
  });
});
