import { getParifiSdkInstanceForTesting } from '..';
import { status, TEST_POSITION_ID1, TEST_USER_ADDRESS, TEST_USER_ADDRESS_CLOSED_POS } from '../common/constants';

describe('Order fetching logic from subgraph', () => {
  it('should return correct user position details', async () => {
    const parifiSdk = await getParifiSdkInstanceForTesting();
    const userAddress = TEST_USER_ADDRESS;
    const orderData = await parifiSdk.subgraph.getOpenPositionsByUserAddress(userAddress, 100, 0);
    expect(orderData[0]?.user?.id).toBe(userAddress);
  });

  it('should return position details by status: CLOSED', async () => {
    const positionId = TEST_POSITION_ID1;
    const parifiSdk = await getParifiSdkInstanceForTesting();
    const position = await parifiSdk.subgraph.getPositionById(positionId);
    expect(position.id).toBe(positionId);
    expect(position.status).toBe(status.CLOSED);
  });

  it('should return position details by User address', async () => {
    const userAddress = TEST_USER_ADDRESS_CLOSED_POS;
    const parifiSdk = await getParifiSdkInstanceForTesting();
    const position = await parifiSdk.subgraph.getClosedPositionsByUserAddress(userAddress);
    expect(position[0]?.user?.id).toBe(userAddress);
  });
});
