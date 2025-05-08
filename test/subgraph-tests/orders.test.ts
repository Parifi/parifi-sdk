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
});
