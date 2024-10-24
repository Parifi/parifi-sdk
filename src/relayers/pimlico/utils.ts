import 'dotenv/config';
import { arbitrum } from 'viem/chains';
import { ENTRYPOINT_ADDRESS_V07, SmartAccountClient, createSmartAccountClient } from 'permissionless';
import { RelayerI, RpcConfig } from '../../interfaces';
import { SmartAccount, privateKeyToSimpleSmartAccount } from 'permissionless/accounts';
import { Chain, Hex, Transport, createPublicClient, http } from 'viem';

import { createPimlicoBundlerClient, createPimlicoPaymasterClient } from 'permissionless/clients/pimlico';

import { EntryPoint } from 'permissionless/types/entrypoint';
import { FACTORY_ADDRESS_SIMPLE_ACCOUNT } from '../../common';

export const getPimlicoSmartAccountClient = async (
  pimlicoConfig: RelayerI,
  rpcConfig: RpcConfig,
  privateKey: `0x${string}`,
): Promise<SmartAccountClient<EntryPoint, Transport, Chain, SmartAccount<EntryPoint>>> => {
  const apiKey = pimlicoConfig.apiKey ?? '';
  const viemChain = getViemChainById(rpcConfig.chainId as number);
  const chainId = rpcConfig.chainId as number;

  /// Create Paymaster Client
  const paymasterUrl = `https://api.pimlico.io/v2/${chainId}/rpc?apikey=${apiKey}`;
  const publicClient = createPublicClient({
    transport: http(rpcConfig.rpcEndpointUrl),
  });

  const paymasterClient = createPimlicoPaymasterClient({
    transport: http(paymasterUrl),
    entryPoint: ENTRYPOINT_ADDRESS_V07,
  });

  const account = await privateKeyToSimpleSmartAccount(publicClient, {
    privateKey,
    entryPoint: ENTRYPOINT_ADDRESS_V07,
    factoryAddress: FACTORY_ADDRESS_SIMPLE_ACCOUNT,
  });

  /// Create Bundler client
  const bundlerUrl = `https://api.pimlico.io/v2/${chainId}/rpc?apikey=${apiKey}`;
  const bundlerClient = createPimlicoBundlerClient({
    transport: http(bundlerUrl),
    entryPoint: ENTRYPOINT_ADDRESS_V07,
  });

  /// Create Smart account client
  const smartAccountClient = createSmartAccountClient({
    account,
    entryPoint: ENTRYPOINT_ADDRESS_V07,
    chain: viemChain,
    bundlerTransport: http(bundlerUrl),
    middleware: {
      gasPrice: async () => {
        return (await bundlerClient.getUserOperationGasPrice()).fast;
      },
      sponsorUserOperation: paymasterClient.sponsorUserOperation,
    },
  }) as SmartAccountClient<EntryPoint, Transport, Chain, SmartAccount<EntryPoint>>;

  return smartAccountClient;
};

export const executeTxUsingPimlico = async (
  smartAccountClient: SmartAccountClient<EntryPoint, Transport, Chain, SmartAccount<EntryPoint>>,
  targetContractAddress: string,
  txData: string,
): Promise<{ txHash: string }> => {
  const txHash = await smartAccountClient.sendTransaction({
    to: targetContractAddress as Hex,
    value: 0n,
    data: txData as Hex,
  });
  return { txHash };
};

export const executeBatchTxsUsingPimlico = async (
  smartAccountClient: SmartAccountClient<EntryPoint, Transport, Chain, SmartAccount<EntryPoint>>,
  targetContractAddresses: string[],
  txDatas: string[],
): Promise<{ txHash: string }> => {
  const batchTxDatas = [];

  if (targetContractAddresses.length != txDatas.length) {
    throw new Error('Target contract and data lengths do not match');
  }

  for (let index = 0; index < targetContractAddresses.length; index++) {
    batchTxDatas.push({
      to: targetContractAddresses[index] as Hex,
      value: 0n,
      data: txDatas[index] as Hex,
    });
  }

  const txHash = await smartAccountClient.sendTransactions({
    transactions: batchTxDatas,
  });
  return { txHash };
};

/**
 * Gets the chain object for the given chain id.
 * @param chainId - Chain id of the target EVM chain.
 * @returns Viem's chain object.
 */
export const getViemChainById = (chainId: number) => {
  if (chainId === 42161) {
    return arbitrum;
  }
};
