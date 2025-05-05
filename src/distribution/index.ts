import { StandardMerkleTree } from '@openzeppelin/merkle-tree';
import { encodeFunctionData, getContract } from 'viem';
import {
  REWARD_DISTRIBUTOR_ABI,
  REWARD_DISTRIBUTOR_ADDRESSES,
  SUPPORTED_CHAINS,
  USERS_REWARDS,
} from '../common/distributionData';

export class RewardDistribution {
  async getTree(tokenSymbol: string, round: number) {
    tokenSymbol = tokenSymbol.toLowerCase();
    const treeData = USERS_REWARDS?.[tokenSymbol]?.[round];

    if (!treeData) {
      throw new Error(`No rewards found for token ${tokenSymbol}`);
    }

    const tree = StandardMerkleTree.of(
      treeData.map((u) => [u.address, u.amount]),
      ['address', 'uint256'],
    );

    return tree;
  }

  async claimRewards({ user, rounds, tokenSymbol }: { user: string; rounds: number[]; tokenSymbol: string }) {
    const txs = [];
    for (const round of rounds) {
      try {
        const tx = await this.claimReward({ user, round, tokenSymbol });
        txs.push(tx);
      } catch (error) {
        console.error(`Error claiming rewards for ${user} in round ${round}:`, error);
      }
    }

    return txs;
  }

  async claimReward({ user, round, tokenSymbol }: { user: string; tokenSymbol: string; round: number }) {
    tokenSymbol = tokenSymbol.toLowerCase();

    const tree = await this.getTree(tokenSymbol, round);
    const indexOf = tree.dump().values.findIndex((data) => data.value.at(0) === user);
    const userData = tree
      .dump()
      .values.find((data) => data.value.at(0) === user)
      ?.value?.reduce(
        (acc, curr, index) => {
          const keys: ['address', 'amount'] = ['address', 'amount'];
          const key: 'address' | 'amount' = keys[index];

          if (!key) return acc;

          // @ts-expect-error correct type
          acc[key] = curr.at(index);

          return acc;
        },
        {} as { address: string; amount: string },
      );

    if (!userData || !userData?.address) throw new Error(`User ${user} not found in the tree`);

    const proof = tree.getProof(indexOf);

    return [
      {
        to: REWARD_DISTRIBUTOR_ADDRESSES[SUPPORTED_CHAINS.BASE][tokenSymbol],
        data: encodeFunctionData({
          abi: REWARD_DISTRIBUTOR_ABI,
          functionName: 'claimReward',
          args: [round, userData.amount, proof],
        }),
        value: '0',
      },
    ];
  }
}
