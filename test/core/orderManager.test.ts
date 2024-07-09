import { ethers } from 'ethers';
import { getParifiSdkInstanceForTesting } from '..';
import { TEST_MARKET_ID1, TEST_OPEN_POSITION, TEST_POSITION_ID1, TEST_SETTLE_ORDER_ID } from '../common/constants';
import {
  DECIMAL_ZERO,
  OrderStatus,
  PRECISION_MULTIPLIER,
  getCurrentTimestampInSeconds,
  getNormalizedPriceByIdFromPriceIdArray,
} from '../../src';
import Decimal from 'decimal.js';

describe('Order Manager tests', () => {
  it('should liquidate a single position', async () => {
    const parifiSdk = await getParifiSdkInstanceForTesting();

    let positionId: string;
    const positionsToLiquidate = await parifiSdk.subgraph.getPositionsToLiquidate();
    console.log('positionsToLiquidate', positionsToLiquidate);

    // Get the first position id to liquidate
    if (positionsToLiquidate.length > 0) {
      positionId = positionsToLiquidate[0];

      const { gelatoTaskId } = await parifiSdk.core.liquidatePositionUsingGelato(positionId);
      console.log('taskId', gelatoTaskId);

      const taskStatus = await parifiSdk.relayer.gelato.checkGelatoTaskStatus(gelatoTaskId);
      console.log('taskStatus', taskStatus);
    }
  });

  it('should settle single order using wallet', async () => {
    const parifiSdk = await getParifiSdkInstanceForTesting();

    const orderIds = [TEST_SETTLE_ORDER_ID];

    const order = await parifiSdk.subgraph.getOrderById(TEST_SETTLE_ORDER_ID);
    if (order.status === OrderStatus.PENDING) {
      console.log('Order already settled: ', TEST_SETTLE_ORDER_ID);
      return;
    }

    const orderDeadline = Number(order.deadline);
    if (orderDeadline < getCurrentTimestampInSeconds() && orderDeadline != 0) {
      console.log('Order expired, cannot be settled');
      return;
    }

    const priceIds = await parifiSdk.subgraph.getPythPriceIdsForOrderIds(orderIds);

    const collateralPriceIds = parifiSdk.pyth.getPriceIdsForCollaterals();

    const priceUpdateData = await parifiSdk.pyth.getVaaPriceUpdateData(priceIds.concat(collateralPriceIds));

    const provider = new ethers.JsonRpcProvider(process.env.RPC_ARBITRUM);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY ?? '', provider);
    const tx = await parifiSdk.core.batchSettleOrdersUsingWallet(orderIds, priceUpdateData, wallet);
    console.log(tx);
  });

  it('should return valid liquidation price', async () => {
    const parifiSdk = await getParifiSdkInstanceForTesting();
    const position = await parifiSdk.subgraph.getPositionById(TEST_OPEN_POSITION);
    const market = await parifiSdk.subgraph.getMarketById(position.market?.id ?? TEST_MARKET_ID1);

    const normalizedPrice = await parifiSdk.pyth.getLatestPricesNormalized([
      market.depositToken?.pyth?.id ?? '0x',
      market.pyth?.id ?? '0x',
    ]);

    const normalizedCollateralPrice = normalizedPrice.find(
      (p) => p.priceId === market.depositToken?.pyth?.id,
    )?.normalizedPrice;

    const normalizedMarketPrice =
      normalizedPrice.find((p) => p.priceId === market.pyth?.id)?.normalizedPrice ?? DECIMAL_ZERO;

    const positionLeverage = await parifiSdk.core.calculatePositionLeverage(
      position,
      market,
      normalizedMarketPrice ?? DECIMAL_ZERO,
      normalizedCollateralPrice ?? DECIMAL_ZERO,
    );

    const liquidationPrice = await parifiSdk.core.getLiquidationPrice(
      position,
      market,
      normalizedMarketPrice ?? DECIMAL_ZERO,
      normalizedCollateralPrice ?? DECIMAL_ZERO,
    );

    if (new Decimal(positionLeverage.leverage ?? 0).lessThan(PRECISION_MULTIPLIER)) {
      expect(liquidationPrice.isZero());
    }

    console.log('liquidationPrice', liquidationPrice);
    if (position.isLong) {
      expect(liquidationPrice.toNumber()).toBeLessThan(Number(position.avgPrice));
    } else {
      expect(liquidationPrice.toNumber()).toBeGreaterThan(Number(position.avgPrice));
    }
  });
});
