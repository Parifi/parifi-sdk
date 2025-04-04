import { getParifiSdkInstanceForTesting } from '..';

describe('Position fetching logic from subgraph', () => {
  it('should return all positions for a user Address', async () => {
    const parifiSdk = await getParifiSdkInstanceForTesting();
    const userAddress = '0x2f22928335ed7e472c18e1e487593c0ac40e9ca8';
    const positionData = await parifiSdk.subgraph.getAllPositionsByUserAddress(userAddress, 3, 0);
    // console.log('Positions data: ', JSON.stringify(positionData));
    expect(positionData.length).not.toBe(0);
  });

  it('should return positions for a snx account id', async () => {
    const parifiSdk = await getParifiSdkInstanceForTesting();

    {
      // It should return position data just with the snx account id
      const snxAccountId = '10209728236255228114';
      const positionData = await parifiSdk.subgraph.getUserPositionsBySnxAccount(snxAccountId);
      expect(positionData?.accountId).toEqual(snxAccountId);
    }

    {
      // It should return position data just with the formatted snx account id
      // e.g PERP-1400686614607063115
      const snxAccountId = 'PERP-1400686614607063115';
      const positionData = await parifiSdk.subgraph.getUserPositionsBySnxAccount(snxAccountId);
      expect(positionData?.id).toEqual(snxAccountId);
    }
  });

  it('should return only closed positions for a snx account id', async () => {
    const parifiSdk = await getParifiSdkInstanceForTesting();
    const ownerAddress = '0x93a6cf9c7f23624d67356b637eb69345006412e0';

    const positionData = await parifiSdk.subgraph.getOpenPositionsByUserAddress(ownerAddress);
    console.log('Position data:::', positionData);
    expect(positionData.length).toEqual(2);
  });
  it('should return only open positions of this timeframe', async () => {
    const parifiSdk = await getParifiSdkInstanceForTesting();
    const startTime = 1735689600;
    const endTime = 2035689600;
    const positionData = await parifiSdk.subgraph.getAllOpenPositionsWithTime(startTime, endTime);
    console.log('Position data:::', positionData);
    expect(positionData.length).toEqual(6);
  });
  it.only('should return only closed positions of this timeframe', async () => {
    const parifiSdk = await getParifiSdkInstanceForTesting();
    const startTime = 1743710952;
    const endTime = 1743763152;
    const positionData = await parifiSdk.subgraph.getAllPositionHistoryWithTime(startTime, endTime);
    console.log('Position data:::', positionData);
    expect(positionData.length).toEqual(6);
  });
});
