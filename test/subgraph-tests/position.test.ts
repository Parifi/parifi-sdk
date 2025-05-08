import { getParifiSdkInstanceForTesting } from '..';
import { TEST_USER_1, TEST_USER_2 } from '../common/constants';

describe('Position fetching logic from subgraph', () => {
  it('should return all positions for a user Address', async () => {
    const parifiSdk = await getParifiSdkInstanceForTesting();
    const userAddress = TEST_USER_1;
    const positionData = await parifiSdk.subgraph.getAllPositionsByUserAddress(userAddress, 3, 0);
    expect(positionData.length).not.toBe(0);
  });

  it('should return only closed positions for a snx account id', async () => {
    const parifiSdk = await getParifiSdkInstanceForTesting();
    const ownerAddress = TEST_USER_2;

    const positionData = await parifiSdk.subgraph.getOpenPositionsByUserAddress(ownerAddress);
    expect(positionData.length).toBeGreaterThan(0);
  });

  it('should return only open positions of this timeframe', async () => {
    const parifiSdk = await getParifiSdkInstanceForTesting();
    const startTime = 1735689600;
    const endTime = 2035689600;
    const positionData = await parifiSdk.subgraph.getAllOpenPositionsWithTime(startTime, endTime);
    expect(positionData.length).toEqual(6);
  });

  it('should return only closed positions of this timeframe', async () => {
    const parifiSdk = await getParifiSdkInstanceForTesting();
    const startTime = 1743710952;
    const endTime = 1743763152;
    const positionData = await parifiSdk.subgraph.getAllPositionHistoryWithTime(startTime, endTime);
    expect(positionData.length).toEqual(6);
  });

  it('should return positions for a snx account id', async () => {
    const parifiSdk = await getParifiSdkInstanceForTesting();

    // It should return position data just with the snx account id
    const snxAccountId = '12868688093503149326';
    const lastRefresh = 1741189060;
    const positionData = await parifiSdk.subgraph.getUserLiquidatedPositionsBySnxAccount(snxAccountId, lastRefresh);
    console.log(positionData?.collateralDeposits?.[0]?.totalAmountLiquidated);
    expect(positionData?.positions?.length).toEqual(1);
  });
});
