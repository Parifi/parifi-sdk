import { Chain } from '@parifi/references';
import { getParifiSdkInstanceForTesting } from '..';
import { OrderStatus, SUBGRAPH_HELPER_ADDRESS } from '../../src';
import { getSubgraphHelperInstance } from '../../src/core/subgraph-helper';
import { TEST_SETTLE_ORDER_ID } from '../common/constants';

describe('Pimlico test cases', () => {
  it.skip('should initialize Pimlico and send a sample tx', async () => {
    const parifiSdk = await getParifiSdkInstanceForTesting();

    const targetContractAddress = '0x58d24685a6982CbEE9d43f3e915B4A6EA12bB3c6';
    const txData = '0x123456789';
    const { txHash } = await parifiSdk.relayer.pimlico.executeTxUsingPimlico(targetContractAddress, txData);

    console.log(`User operation included: https://arbiscan.io/tx/${txHash}`);
  });

  it.skip('should settle orders using Pimlico', async () => {
    const parifiSdk = await getParifiSdkInstanceForTesting();

    const orderDetails = await parifiSdk.subgraph.getOrderById(TEST_SETTLE_ORDER_ID);
    if (orderDetails.status == OrderStatus.SETTLED) {
      return;
    }
    const orderIds = [TEST_SETTLE_ORDER_ID];

    const { txHash } = await parifiSdk.relayer.pimlico.batchSettleOrdersUsingPimlico(orderIds);

    console.log(`User operation included: https://arbiscan.io/tx/${txHash}`);
  });

  it.skip('should refresh positions using Pimlico', async () => {
    const parifiSdk = await getParifiSdkInstanceForTesting();

    const positionsToRefresh = await parifiSdk.subgraph.getPositionsToRefresh(50);
    console.log('positionsToRefresh', positionsToRefresh);

    const subgraphHelper = getSubgraphHelperInstance(Chain.ARBITRUM_MAINNET);
    const { data: encodedTxData } = await subgraphHelper.triggerPositionUpdate.populateTransaction(positionsToRefresh);

    const { txHash } = await parifiSdk.relayer.pimlico.executeTxUsingPimlico(SUBGRAPH_HELPER_ADDRESS, encodedTxData);
    console.log(`Tx submitted: https://arbiscan.io/tx/${txHash}`);
  });

  it('should liquidate positions using Pimlico', async () => {
    const parifiSdk = await getParifiSdkInstanceForTesting();

    const positionIds = await parifiSdk.subgraph.getPositionsToLiquidate();
    if (positionIds.length !== 0) {
      const { txHash } = await parifiSdk.relayer.pimlico.batchLiquidatePositionsUsingPimlico(positionIds);
      console.log(`User operation included: https://arbiscan.io/tx/${txHash}`);
    } else {
      console.log('No positions available for liquidation');
    }
  });
});
