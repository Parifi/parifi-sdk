import Decimal from 'decimal.js';
import { BatchExecute, Order, getAllPendingOrders } from '../../subgraph';
import { Chain, DECIMAL_ZERO, DEFAULT_BATCH_COUNT, PRECISION_MULTIPLIER } from '../../common';
import { getLatestPricesFromPyth, getVaaPriceUpdateData, normalizePythPriceForParifi } from '../../pyth';
import { AxiosInstance } from 'axios';
import { getParifiUtilsInstance } from '../parifi-utils';
import { executeTxUsingGelato } from '../../gelato';
import { contracts as parifiContracts } from '@parifi/references';

// Returns true if the price of market is within the range configured in order struct
// The function can be used to check if a pending order can be settled or not
export const checkIfOrderCanBeSettled = (order: Order, normalizedMarketPrice: Decimal): boolean => {
  const isLimitOrder = order.isLimitOrder;
  const triggerAbove = order.triggerAbove;
  const isLong = order.isLong;
  // Return false if any of the fields is undefined
  if (isLimitOrder === undefined || triggerAbove === undefined || isLong === undefined) {
    return false;
  }

  // Return false if any of the fields is undefined
  if (order.expectedPrice === undefined || order.maxSlippage === undefined) {
    return false;
  }
  const expectedPrice = new Decimal(order.expectedPrice);
  const maxSlippage = new Decimal(order.maxSlippage);

  if (isLimitOrder) {
    // If its a limit order, check if the limit price is reached, either above or below
    // depending on the triggerAbove flag
    if (
      (triggerAbove && normalizedMarketPrice < expectedPrice) ||
      (!triggerAbove && normalizedMarketPrice > expectedPrice)
    ) {
      return false;
    }
  } else {
    // Market Orders
    // Check if current market price is within slippage range
    if (expectedPrice != DECIMAL_ZERO) {
      const upperLimit = expectedPrice.mul(PRECISION_MULTIPLIER.add(maxSlippage)).div(PRECISION_MULTIPLIER);
      const lowerLimit = expectedPrice.mul(PRECISION_MULTIPLIER.sub(maxSlippage)).div(PRECISION_MULTIPLIER);

      if ((isLong && normalizedMarketPrice > upperLimit) || (!isLong && normalizedMarketPrice < lowerLimit)) {
        return false;
      }
    }
  }
  return true;
};

export const batchSettlePendingOrdersUsingGelato = async (
  chainId: Chain,
  gelatoKey: string,
  pythClient: AxiosInstance,
): Promise<{ ordersCount: number }> => {
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const pendingOrders = await getAllPendingOrders(chainId, currentTimestamp, DEFAULT_BATCH_COUNT);
  if (pendingOrders.length == 0) return { ordersCount: 0 };

  const priceIds: string[] = [];

  // Populate the price ids array to fetch price update data
  pendingOrders.forEach((order) => {
    if (order.market?.pyth?.id) {
      priceIds.push(order.market.pyth.id);
    }
  });

  // Get Price update data and latest prices from Pyth
  const priceUpdateData = await getVaaPriceUpdateData(priceIds, pythClient);
  const pythLatestPrices = await getLatestPricesFromPyth(priceIds, pythClient);

  // Populate batched orders for settlement for orders that can be settled
  const batchedOrders: BatchExecute[] = [];

  pendingOrders.forEach((order) => {
    if (order.id) {
      // Pyth returns price id without '0x' at the start, hence the price id from order
      // needs to be formatted
      const orderPriceId = order.market?.pyth?.id ?? '0x';
      const formattedPriceId = orderPriceId.startsWith('0x') ? orderPriceId.substring(2) : orderPriceId;

      const assetPrice = pythLatestPrices.find((pythPrice) => pythPrice.id === formattedPriceId);
      const normalizedMarketPrice = normalizePythPriceForParifi(
        parseInt(assetPrice?.price.price ?? '0'),
        assetPrice?.price.expo ?? 0,
      );

      if (checkIfOrderCanBeSettled(order, normalizedMarketPrice)) {
        batchedOrders.push({
          id: order.id,
          priceUpdateData: priceUpdateData,
        });
        // We need these console logs for feedback to Tenderly actions and other scripts
        console.log('Order ID available for settlement:', order.id);
      } else {
        console.log('Order ID not available for settlement because of price mismatch:', order.id);
      }
    }
  });

  // Encode transaction data
  if (batchedOrders.length != 0) {
    const parifiUtils = getParifiUtilsInstance(chainId);
    const { data: encodedTxData } = await parifiUtils.batchSettleOrders.populateTransaction(batchedOrders);

    const taskId = await executeTxUsingGelato(
      parifiContracts[chainId].ParifiUtils.address,
      chainId,
      gelatoKey,
      encodedTxData,
    );
    // We need these console logs for feedback to Tenderly actions and other scripts
    console.log('Task ID:', taskId);
  }
  return { ordersCount: batchedOrders.length };
};