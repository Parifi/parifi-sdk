import { StandardMerkleTree } from '@openzeppelin/merkle-tree';
import { encodeFunctionData } from 'viem';
import { REWARD_DISTRIBUTOR_ABI, REWARD_DISTRIBUTOR_ADDRESSES, SUPPORTED_CHAINS } from '../common/constants';

export type RewardList = Record<string, Record<number, { address: string; amount: string }[]>>;

export class RewardDistribution {
  rewards: RewardList;

  constructor(_rewards: RewardList) {
    this.rewards = _rewards;
  }
  /**
   * Gets the reward contract address and ABI for a specific token.
   * @param tokenSymbol The symbol of the token.
   * @returns The reward contract address and ABI.
   */
  async getRewardContract(tokenSymbol: string) {
    tokenSymbol = tokenSymbol.toLowerCase();

    const rewardContract = REWARD_DISTRIBUTOR_ADDRESSES[SUPPORTED_CHAINS.BASE][tokenSymbol];

    if (!rewardContract) {
      throw new Error(`No reward contract found for token ${tokenSymbol}`);
    }

    return {
      address: rewardContract,
      abi: REWARD_DISTRIBUTOR_ABI,
    };
  }

  /**
   * Gets the Merkle tree for a specific token and round.
   * @param tokenSymbol The symbol of the token.
   * @param round The round number.
   * @returns The Merkle tree for the specified token and round.
   */
  async getTree(tokenSymbol: string, round: number) {
    tokenSymbol = tokenSymbol.toLowerCase();
    const treeData = this.rewards?.[tokenSymbol]?.[round];

    if (!treeData) {
      throw new Error(`No rewards found for token ${tokenSymbol}`);
    }

    const tree = StandardMerkleTree.of(
      treeData.map((u) => [u.address, u.amount]),
      ['address', 'uint256'],
    );

    return tree;
  }

  async getUserData(user: string, tokenSymbol: string, round: number) {
    const tree = await this.getTree(tokenSymbol, round);
    const indexOf = tree.dump().values.findIndex((data) => data.value.at(0) === user);
    const userData = tree
      .dump()
      .values.find((data) => data.value.at(0)?.toLowerCase() === user.toLowerCase())
      ?.value?.reduce(
        (acc, curr, index) => {
          console.log('=== acc, curr', acc, curr);
          const keys: ['address', 'amount'] = ['address', 'amount'];
          const key: 'address' | 'amount' = keys[index];

          if (!key) return acc;

          acc[key] = curr;

          return acc;
        },
        {} as { address: string; amount: string },
      );

    return { userData, indexOf, tree };
  }

  /**
   * Claims rewards for a user in multiple rounds.
   * @param user The address of the user.
   * @param rounds The array of round numbers.
   * @param tokenSymbol The symbol of the token.
   * @returns An array of transactions to be sent.
   */

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

    return txs.flat();
  }

  /**
   * Claims the reward for a user in a specific round.
   * @param user The address of the user.
   * @param round The round number.
   * @param tokenSymbol The symbol of the token.
   * @returns An array of transactions to be sent.
   */

  async claimReward({ user, round, tokenSymbol }: { user: string; tokenSymbol: string; round: number }) {
    tokenSymbol = tokenSymbol.toLowerCase();

    const { userData, indexOf, tree } = await this.getUserData(user, tokenSymbol, round);
    if (!userData || !userData?.address) throw new Error(`User ${user} not found in the tree`);

    const proof = tree.getProof(indexOf);

    return [
      {
        tx: {
          to: REWARD_DISTRIBUTOR_ADDRESSES[SUPPORTED_CHAINS.BASE][tokenSymbol],
          data: encodeFunctionData({
            abi: REWARD_DISTRIBUTOR_ABI,
            functionName: 'claimReward',
            args: [round, userData.amount, proof],
          }),
          value: '0',
        },
        amount: userData.amount,
      },
    ];
  }
}
