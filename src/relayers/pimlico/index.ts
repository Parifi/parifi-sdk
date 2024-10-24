import 'dotenv/config';
import { RelayerConfig, RpcConfig, SubgraphConfig } from '../../interfaces';
import {  executeTxUsingPimlico, getPimlicoSmartAccountClient } from './utils';
import { SmartAccount } from 'permissionless/accounts';
import { Chain, Hex, Transport } from 'viem';
import { EntryPoint } from 'permissionless/types/entrypoint';
import { SmartAccountClient } from 'permissionless';
import { getPositionsToRefresh, getPublicSubgraphEndpoint } from '../../subgraph';
import { getPythClient } from '../../pyth/pyth';
import { generatePrivateKey } from 'viem/accounts';

import { contracts as parifiContracts } from '@parifi/references';
import { getSubgraphHelperInstance } from '../../utils/subgraph-helper';

export class Pimlico {
  /// Pimlico Class variables
  public isInitialized: boolean;
  private smartAccountClient: SmartAccountClient<EntryPoint, Transport, Chain, SmartAccount<EntryPoint>>;

  constructor(
    private pimlicoConfig: RelayerConfig['pimlicoConfig'],
    private rpcConfig: RpcConfig,
    private subgraphConfig: SubgraphConfig,
  ) {
    this.isInitialized = false;
    this.smartAccountClient = {} as SmartAccountClient<EntryPoint, Transport, Chain, SmartAccount<EntryPoint>>;
  }

  ////////////////////////////////////////////////////////////////
  //////////////////////    INITIALIZER    ///////////////////////
  ////////////////////////////////////////////////////////////////
  async initPimlico() {
    if (this.isInitialized) {
      console.log('Pimlico relayer already initialized');
      return;
    }

    if (this.pimlicoConfig?.apiKey === undefined || this.rpcConfig.rpcEndpointUrl === undefined) {
      console.log('Invalid config for Pimlico');
      return;
    }

    /// Create Smart account for user address EOA
    const privateKey =
      ((process.env.PRIVATE_KEY as Hex) || this.pimlicoConfig.password) ??
      (() => {
        const pk = generatePrivateKey();
        this.pimlicoConfig.password = pk;
        return pk;
      })();

    this.smartAccountClient = await getPimlicoSmartAccountClient(this.pimlicoConfig, this.rpcConfig, privateKey);

    // Set the Pimlico Relayer as initialized
    this.isInitialized = true;
  }

  ////////////////////////////////////////////////////////////////
  ////////////////////    PUBLIC FUNCTIONS    ////////////////////
  ////////////////////////////////////////////////////////////////
  public executeTxUsingPimlico = async (targetContractAddress: string, txData: string) => {
    return await executeTxUsingPimlico(this.smartAccountClient, targetContractAddress, txData);
  };

  // Batch settle orders using Pimlico for OrderIds
  // public batchSettleOrdersUsingPimlico = async (orderIds: string[]): Promise<{ txHash: string }> => {
  //   const chainId = this.rpcConfig.chainId;
  //   const subgraphEndpoint = this.subgraphConfig.subgraphEndpoint ?? getPublicSubgraphEndpoint(chainId);

  //   const pythClient = await getPythClient();

  //   // Get Settle orders transaction data for execution
  //   const { txData } = await getBatchSettleTxData(chainId, subgraphEndpoint, pythClient, orderIds);

  //   const parifiUtilsAddress = parifiContracts[chainId].ParifiUtils.address;

  //   return await executeTxUsingPimlico(this.smartAccountClient, parifiUtilsAddress, txData);
  // };

  // Batch settle orders using Pimlico for OrderIds
  // public batchLiquidatePositionsUsingPimlico = async (positionIds: string[]): Promise<{ txHash: string }> => {
  //   const chainId = this.rpcConfig.chainId;
  //   const subgraphEndpoint = this.subgraphConfig.subgraphEndpoint ?? getPublicSubgraphEndpoint(chainId);

  //   const pythClient = await getPythClient();

  //   // Get Settle orders transaction data for execution
  //   const { txData } = await getBatchLiquidateTxData(chainId, subgraphEndpoint, pythClient, positionIds);

  //   const parifiUtilsAddress = parifiContracts[chainId].ParifiUtils.address;

  //   return await executeTxUsingPimlico(this.smartAccountClient, parifiUtilsAddress, txData);
  // };

  // Batch settle orders using Pimlico for OrderIds
  // public batchSettleAndRefreshUsingPimlico = async (orderIds: string[]): Promise<{ txHash: string }> => {
  //   const chainId = this.rpcConfig.chainId;
  //   const subgraphEndpoint = this.subgraphConfig.subgraphEndpoint ?? getPublicSubgraphEndpoint(chainId);

  //   const pythClient = await getPythClient();

  //   // Get Settle orders transaction data for execution
  //   const targetContract1 = parifiContracts[chainId].ParifiUtils.address;
  //   const { txData: txData1 } = await getBatchSettleTxData(chainId, subgraphEndpoint, pythClient, orderIds);

  //   // Tx data to refresh positions
  //   // @todo Need to fix the references library to allow chainId as ArbSepolia has some issues
  //   const targetContract2 = parifiContracts[42161].SubgraphHelper.address;
  //   const { txData: txData2 } = await getPositionRefreshTxData(chainId, subgraphEndpoint);

  //   return await executeBatchTxsUsingPimlico(
  //     this.smartAccountClient,
  //     [targetContract1, targetContract2],
  //     [txData1, txData2],
  //   );
  // };
}
