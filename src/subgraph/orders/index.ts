import { request } from 'graphql-request';
import { Chain } from '../../common/chain';
import { Order, getSubgraphEndpoint } from '../common';
import {
  fetchOrdersByIdQuery,
  fetchOrdersByUserQuery,
  fetchPendingOrdersQuery,
  fetchPriceIdsFromOrderIdsQuery,
} from './subgraphQueries';
import { mapOrdersArrayToInterface, mapSingleOrderToInterface } from '../common/mapper';
import { EMPTY_BYTES32, getUniqueValuesFromArray } from '../../common';

// Get all order by a user address
export const getAllOrdersByUserAddress = async (
  chainId: Chain,
  userAddress: string,
  subgraphEndpoint: string | undefined,
  count: number = 10,
): Promise<Order[]> => {
  try {
    if(!subgraphEndpoint){
      const subgraphEndpoint = getSubgraphEndpoint(chainId);
    }
    const subgraphResponse = await request(subgraphEndpoint, fetchOrdersByUserQuery(userAddress, count));
    const orders = mapOrdersArrayToInterface(subgraphResponse);
    if (!orders) throw new NotFoundError('Orders not found');
    return orders;
  } catch (error) {
    throw error;
  }
};

// Get all pending orders that are not yet settled/cancelled or expired
export const getAllPendingOrders = async (
  chainId: Chain,
  subgraphEndpoint: string | undefined,
  timestamp: number = Math.floor(Date.now() / 1000),
  count: number = 10,
): Promise<Order[]> => {
  try {
    if(!subgraphEndpoint){
      const subgraphEndpoint = getSubgraphEndpoint(chainId);
    }
    const subgraphResponse = await request(subgraphEndpoint, fetchPendingOrdersQuery(timestamp, count));

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
export const getOrderById = async (chainId: Chain, orderId: string,subgraphEndpoint: string | undefined): Promise<Order> => {
  try {
    if(!subgraphEndpoint){
      const subgraphEndpoint = getSubgraphEndpoint(chainId);
    }
    const formattedOrderId = orderId.toLowerCase();

    const subgraphResponse: any = await request(subgraphEndpoint, fetchOrdersByIdQuery(formattedOrderId));
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
export const getPythPriceIdsForOrderIds = async (chainId: Chain, orderIds: string[],subgraphEndpoint: string | undefined): Promise<string[]> => {
  try {
    if(!subgraphEndpoint){
      const subgraphEndpoint = getSubgraphEndpoint(chainId);
    }
  const formattedOrderIds: string[] = orderIds.map((orderId) => orderId.toLowerCase());

  const subgraphResponse: any = await request(subgraphEndpoint, fetchPriceIdsFromOrderIdsQuery(formattedOrderIds));
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
