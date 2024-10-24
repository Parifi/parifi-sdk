import { request } from 'graphql-request';
import {
  fetchCollateralForOrderUsingAccountId,
  fetchOrdersByIdQuery,
  fetchOrdersByUserQuery,
  fetchPendingOrdersQuery,
  fetchPositionIdsForOrderIds,
  fetchPriceIdsFromOrderIdsQuery,
} from './subgraphQueries';
import {
  mapDespositCollateralArrayToInterface,
  mapOrderArrayToPriceid,
  mapOrdersArrayToInterface,
  mapSingleOrderToInterface,
} from '../../common/subgraphMapper';
import { aggregateDepositsBySnxAccountId, EMPTY_BYTES32, getUniqueValuesFromArray } from '../../common';
import { NotFoundError } from '../../error/not-found.error';
import { Order } from '../../interfaces/sdkTypes';

// Get all order by a user address
export const getAllOrdersByUserAddress = async (
  subgraphEndpoint: string,
  userAddress: string,
  count: number = 10,
  skip: number = 0,
): Promise<Order[]> => {
  try {
    const subgraphResponse: any = await request(subgraphEndpoint, fetchOrdersByUserQuery(userAddress, count, skip));
    if (!subgraphResponse) throw new Error('Error While Fechting All Order By user Address');
    const accountIdArray = subgraphResponse?.orders?.map((order: Order) => {
      return order?.snxAccount?.id;
    });
    const collateralSubgraphResponse: any = await request(
      subgraphEndpoint,
      fetchCollateralForOrderUsingAccountId(accountIdArray),
    );
    const collateralDeposit = mapDespositCollateralArrayToInterface(collateralSubgraphResponse);
    // console.log(collateralDeposit);
    const uniqueAccountIdCollateralMapping = aggregateDepositsBySnxAccountId(collateralDeposit);
    // console.log(uniqueAccountIdCollateralMapping);

    if (!subgraphResponse) throw new Error('While While Fechting All Order By user Address');
    const orders = mapOrdersArrayToInterface(subgraphResponse, uniqueAccountIdCollateralMapping);
    if (!orders) throw new NotFoundError('Orders not found');
    return orders;
  } catch (error) {
    throw error;
  }
};

// Get all pending orders that are not yet settled/cancelled or expired
export const getAllPendingOrders = async (
  subgraphEndpoint: string,
  timestamp: number = Math.floor(Date.now() / 1000),
  count: number = 10,
  skip: number = 0,
): Promise<Order[]> => {
  try {
    const subgraphResponse: any = await request(subgraphEndpoint, fetchPendingOrdersQuery(timestamp, count, skip));

    if (!subgraphResponse) throw new Error('Error While Fechting All Order By user Address');
    const accountIdArray = subgraphResponse?.orders?.map((order: Order) => {
      return order?.snxAccount?.id;
    });
    const collateralSubgraphResponse: any = await request(
      subgraphEndpoint,
      fetchCollateralForOrderUsingAccountId(accountIdArray),
    );
    const collateralDeposit = mapDespositCollateralArrayToInterface(collateralSubgraphResponse);
    const uniqueAccountIdCollateralMapping = aggregateDepositsBySnxAccountId(collateralDeposit);
    // console.log(uniqueAccountIdCollateralMapping);

    if (!subgraphResponse) throw new Error('While While Fechting All Order By user Address');
    const orders = mapOrdersArrayToInterface(subgraphResponse, uniqueAccountIdCollateralMapping);
    if (orders) {
      return orders;
    }
    throw new NotFoundError('Orders not found');
  } catch (error) {
    throw error;
  }
};

// Get order from subgraph by order ID
export const getOrderById = async (subgraphEndpoint: string, orderId: string): Promise<Order> => {
  try {
    const formattedOrderId = orderId;
    let subgraphResponse: any = await request(subgraphEndpoint, fetchOrdersByIdQuery(formattedOrderId));
    if (!subgraphResponse.order) throw new Error('Error While Fechting Order By Id');
    const collateralSubgraphResponse: any = await request(
      subgraphEndpoint,
      fetchCollateralForOrderUsingAccountId(subgraphResponse?.order?.snxAccount?.id || ''),
    );
    const collateralDeposit = mapDespositCollateralArrayToInterface(collateralSubgraphResponse);
    const uniqueAccountIdCollateralMapping = aggregateDepositsBySnxAccountId(collateralDeposit);

    if (!subgraphResponse) throw new Error('While While Fechting All Order By user Address');
    const order = mapSingleOrderToInterface(
      subgraphResponse.order,
      uniqueAccountIdCollateralMapping[subgraphResponse.order.snxAccount.id],
    );
    if (order && order.id === orderId) {
      return order;
    }
    throw new NotFoundError('Order does not exist');
  } catch (error) {
    throw error;
  }
};

// Get all price IDs of tokens related to the orders ids
export const getPythPriceIdsForOrderIds = async (subgraphEndpoint: string, orderIds: string[]): Promise<string[]> => {
  try {
    let subgraphResponse: any = await request(subgraphEndpoint, fetchPriceIdsFromOrderIdsQuery(orderIds));
    if (!subgraphResponse) throw new Error('Error While Fechting Pyth Price Ids For Order Ids');
    const priceIds: string[] = mapOrderArrayToPriceid(subgraphResponse) || [];
    const uniquePriceIds = getUniqueValuesFromArray(priceIds);
    // Remove empty (0x00) price ids for orders where the Pyth data is not set
    return uniquePriceIds.filter((id) => id !== EMPTY_BYTES32);
  } catch (error) {
    console.log('Error mapping price ids');
    throw error;
  }
};

// Returns the position id related to the order id. If the order ID or position Id does not exists
// EMPTY_BYTES32 (0x0000) is returned
export const getPositionIdsFromOrderIds = async (
  subgraphEndpoint: string,
  orderIds: string[],
): Promise<{ orderId: string; positionId: string }[]> => {
  let result: { orderId: string; positionId: string }[] = [];

  // Interface for subgraph response
  interface ApiResponse {
    orders: Array<{
      id: string;
      position: {
        id: string;
      } | null;
    }>;
  }

  try {
    const subgraphResponse: ApiResponse = await request(subgraphEndpoint, fetchPositionIdsForOrderIds(orderIds));

    orderIds.forEach((id) => {
      let pid: string = EMPTY_BYTES32;
      if (subgraphResponse.orders.length !== 0) {
        const res = subgraphResponse.orders.find((order) => order.id === id);
        if (res) {
          pid = res.position?.id ?? EMPTY_BYTES32;
        }
      }
      result.push({ orderId: id, positionId: pid });
    });
  } catch (error) {
    throw error;
  }
  console.log(result);
  return result;
};
