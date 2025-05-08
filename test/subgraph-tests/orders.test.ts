import { getParifiSdkInstanceForTesting } from '..';
import { status, TEST_ORDER_ID1, TEST_USER_1 } from '../common/constants';

describe('Order fetching logic from subgraph', () => {
  it('should return correct order and user user Address', async () => {
    const parifiSdk = await getParifiSdkInstanceForTesting();
    const orderData = await parifiSdk.subgraph.getAllOrdersByUserAddress(TEST_USER_1, 3, 0);
    expect(orderData.length).not.toBe(0);
  });

  it('should return an order using the order Id', async () => {
    const parifiSdk = await getParifiSdkInstanceForTesting();
    const order = await parifiSdk.subgraph.getOrderById(TEST_ORDER_ID1);
    expect(order.id).toBe(TEST_ORDER_ID1);
    expect(order.status).toBe(status.SETTLED);
  });

  it.only('should return an settled order count for a user', async () => {
    const parifiSdk = await getParifiSdkInstanceForTesting();
    const address = '0x680f7cF1C802F5C1C5A93e3657AAA3a1152ccd44';
    const startTime = 1744771331;
    const endTime = 1745223131;
    const orderCount = await parifiSdk.subgraph.getSettledOrdersCountBasedOnTimeStampByUserAddress(
      address,
      50,
      0,
      startTime,
      endTime,
    );
    console.log(orderCount);
    expect(orderCount).toBe(2);
  });
});
