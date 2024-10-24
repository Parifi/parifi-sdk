import { getParifiSdkInstanceForTesting } from '..';
import { status, TEST_ORDER_ID1, TEST_SETTLE_ORDER_ID, TEST_USER_ADDRESS } from '../common/constants';

describe('Order fetching logic from subgraph', () => {
  it('should return correct order and user user Address', async () => {
    const parifiSdk = await getParifiSdkInstanceForTesting();
    const userAddress = TEST_USER_ADDRESS;
    const orderData = await parifiSdk.subgraph.getAllOrdersByUserAddress(userAddress, 100, 0);
    expect(orderData[0]?.user?.id).toBe(userAddress);
  });

  it('should return expired order for the order Id', async () => {
    const parifiSdk = await getParifiSdkInstanceForTesting();
    const orderId = TEST_ORDER_ID1;
    const order = await parifiSdk.subgraph.getOrderById(orderId);
    expect(order.id).toBe(orderId);
    expect(order.status).toBe(status.EXPIRED);
  });
  it('should return settle order for the order Id', async () => {
    const parifiSdk = await getParifiSdkInstanceForTesting();
    const orderId = TEST_SETTLE_ORDER_ID;
    const order = await parifiSdk.subgraph.getOrderById(orderId);
    expect(order.id).toBe(orderId);
    expect(order.status).toBe(status.SETTLED);
  });
});
