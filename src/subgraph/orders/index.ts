import { request } from 'graphql-request';
import { Order } from '../../interfaces/subgraphTypes';
import {
  fetchOrdersByIdQuery,
  fetchOrdersByUserQuery,
  fetchPendingOrdersQuery,
  fetchPriceIdsFromOrderIdsQuery,
} from './subgraphQueries';
import { mapOrdersArrayToInterface, mapSingleOrderToInterface } from '../../common/subgraphMapper';
import { EMPTY_BYTES32, getPriceIdsForCollaterals, getUniqueValuesFromArray } from '../../common';
import { NotFoundError } from '../../error/not-found.error';

// Get all order by a user address
export const getAllOrdersByUserAddress = async (
  subgraphEndpoint: string,
  userAddress: string,
  count: number = 10,
  skip: number = 0,
): Promise<Order[]> => {
  try {
    const subgraphResponse: any = await request(subgraphEndpoint, fetchOrdersByUserQuery(userAddress, count, skip));
    const orders = mapOrdersArrayToInterface(subgraphResponse);
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
    const orders = mapOrdersArrayToInterface(subgraphResponse);
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
    const formattedOrderId = orderId.toLowerCase();
    let subgraphResponse: any = await request(subgraphEndpoint, fetchOrdersByIdQuery(formattedOrderId));
    const order = mapSingleOrderToInterface(subgraphResponse.order);
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
    const formattedOrderIds: string[] = orderIds.map((orderId) => orderId.toLowerCase());
    let subgraphResponse: any = await request(subgraphEndpoint, fetchPriceIdsFromOrderIdsQuery(formattedOrderIds));

    const priceIds: string[] = [];

    const orders: Order[] = mapOrdersArrayToInterface(subgraphResponse) || [];
    if (orders.length != 0) {
      orders.map((order) => {
        if (order.market?.pyth?.id) {
          priceIds.push(order.market?.pyth?.id);
        }
      });
    }
    const uniquePriceIds = getUniqueValuesFromArray(priceIds);

    // Remove empty (0x00) price ids for orders where the Pyth data is not set
    return uniquePriceIds.filter((id) => id !== EMPTY_BYTES32);
  } catch (error) {
    console.log('Error mapping price ids');
    throw error;
  }
};
