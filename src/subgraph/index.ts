import {
  getAllOrdersByUserAddress,
  getAllPendingOrders,
  getOrderById,
  getPositionIdsFromOrderIds,
  getPythPriceIdsForOrderIds,
} from './orders';
import { PythConfig, RpcConfig, SubgraphConfig } from '../interfaces/classConfigs';
import {
  getAllPositionsByUserAddress,
  getClosedPositionsByUserAddress,
  getLiquidatedPositionsByUserAddress,
  getOpenPositionsByUserAddress,
  getPositionById,
  getPositionsHistory,
  getPositionsToLiquidate,
  getPositionsToRefresh,
  getPythPriceIdsForPositionIds,
  getTotalDepositedCollateralInUsd,
  getTotalUnrealizedPnlInUsd,
} from './positions';
import { getPortfolioDataByUsersAddress, transformPriceArray } from './portfolio';
import { getAllMarketsFromSubgraph, getMarketById } from './markets';
import { Chain } from '@parifi/references';
import request, { GraphQLClient } from 'graphql-request';
import { getPublicSubgraphEndpoint } from './common';
import { Pyth } from '../pyth';
import Decimal from 'decimal.js';
import {
  getAccountByAddress,
  getLeaderboardUserData,
  getPortfolioDataForUsers,
  getRealizedPnlForUser,
} from './accounts';
import {
  LeaderboardUserData,
  Market,
  Order,
  Position,
  ReferralRewardsInUsd,
  UserPortfolioData,
} from '../interfaces/sdkTypes';
import { getExecutionFee } from './protocol';
import { PriceObject } from '../interfaces';

export * from './common';
export * from './markets';
export * from './orders';
export * from './positions';

export class Subgraph {
  // The rpcConfig and subgraphConfig objects that are passed to the class will only
  // be used for the creation of the required fields for initialization
  // @todo Add authentication to Graph QL Client in a separate PR
  // Use the below graphQLClient for all requests to the subgraph
  public graphQLClient: GraphQLClient;
  public pyth: Pyth;

  constructor(
    private rpcConfig: RpcConfig,
    private subgraphConfig: SubgraphConfig,
    pythConfig: PythConfig,
  ) {
    this.pyth = new Pyth(pythConfig);
    // Initialize the Graph QL Client using the config received
    if (subgraphConfig.subgraphEndpoint) {
      this.graphQLClient = new GraphQLClient(subgraphConfig.subgraphEndpoint);
    } else {
      this.graphQLClient = new GraphQLClient(getPublicSubgraphEndpoint(rpcConfig.chainId));
    }
  }
  async init() {
    await this.pyth.initPyth();
  }

  // Returns the configured subgraph endpoint if set, otherwise returns public subgraph endpoint
  public getSubgraphEndpoint(chainId: Chain): string {
    if (this.subgraphConfig.subgraphEndpoint) {
      return this.subgraphConfig.subgraphEndpoint;
    }
    return getPublicSubgraphEndpoint(chainId);
  }

  // Execute the provided subgraph query using the configured subgraph endpoint and configuration values
  public async executeSubgraphQuery(query: string): Promise<any> {
    const subgraphEndpoint = this.getSubgraphEndpoint(this.rpcConfig.chainId);
    try {
      const subgraphResponse = await request(subgraphEndpoint, query);
      return subgraphResponse;
    } catch (error) {
      throw error;
    }
  }

  ////////////////////////////////////////////////////////////////
  //////////////////////    ACCOUNT    ///////////////////////////
  ////////////////////////////////////////////////////////////////
  public async getRealizedPnlForUser(userAddress: string): Promise<{
    totalRealizedPnlPositions: Decimal;
    totalRealizedPnlVaults: Decimal;
  }> {
    const subgraphEndpoint = this.getSubgraphEndpoint(this.rpcConfig.chainId);
    return await getRealizedPnlForUser(subgraphEndpoint, userAddress);
  }

  /// Returns the current USD value of user portfolio data
  public async getPortfolioDataForUsers(userAddresses: string[]): Promise<{
    portfolioData: UserPortfolioData[];
  }> {
    const subgraphEndpoint = this.getSubgraphEndpoint(this.rpcConfig.chainId);
    return await getPortfolioDataForUsers(subgraphEndpoint, userAddresses);
  }

  public async getLeaderboardUserData(userAddresses: string[]): Promise<LeaderboardUserData[]> {
    const subgraphEndpoint = this.getSubgraphEndpoint(this.rpcConfig.chainId);
    return await getLeaderboardUserData(subgraphEndpoint, userAddresses);
  }

  ////////////////////////////////////////////////////////////////
  //////////////////////    ORDERS    ////////////////////////////
  ////////////////////////////////////////////////////////////////
  public async getAllOrdersByUserAddress(userAddress: string, count: number, skip: number): Promise<Order[]> {
    const subgraphEndpoint = this.getSubgraphEndpoint(this.rpcConfig.chainId);
    return await getAllOrdersByUserAddress(subgraphEndpoint, userAddress, count, skip);
  }

  public async getAllPendingOrders(timestamp: number, count: number, skip: number): Promise<Order[]> {
    const subgraphEndpoint = this.getSubgraphEndpoint(this.rpcConfig.chainId);
    return await getAllPendingOrders(subgraphEndpoint, timestamp, count, skip);
  }

  public async getOrderById(orderId: string): Promise<Order> {
    const subgraphEndpoint = this.getSubgraphEndpoint(this.rpcConfig.chainId);

    return await getOrderById(subgraphEndpoint, orderId);
  }
  public async getUserByAddress(userAddress: string): Promise<any> {
    const subgraphEndpoint = this.getSubgraphEndpoint(this.rpcConfig.chainId);
    return await getAccountByAddress(subgraphEndpoint, userAddress);
  }
  public async getPythPriceIdsForOrderIds(orderIds: string[]): Promise<string[]> {
    const subgraphEndpoint = this.getSubgraphEndpoint(this.rpcConfig.chainId);
    return await getPythPriceIdsForOrderIds(subgraphEndpoint, orderIds);
  }

  public async getPositionIdsFromOrderIds(orderIds: string[]): Promise<{ orderId: string; positionId: string }[]> {
    const subgraphEndpoint = this.getSubgraphEndpoint(this.rpcConfig.chainId);
    return await getPositionIdsFromOrderIds(subgraphEndpoint, orderIds);
  }

  ////////////////////////////////////////////////////////////////
  //////////////////////    POSITION    //////////////////////////
  ////////////////////////////////////////////////////////////////
  public async getAllPositionsByUserAddress(
    userAddress: string,
    count: number = 20,
    skip?: number,
  ): Promise<Position[]> {
    const subgraphEndpoint = this.getSubgraphEndpoint(this.rpcConfig.chainId);
    return await getAllPositionsByUserAddress(subgraphEndpoint, userAddress, count, skip);
  }

  // @todo Add function to get multiple positions in a single call

  public async getPositionById(positionId: string): Promise<Position> {
    const subgraphEndpoint = this.getSubgraphEndpoint(this.rpcConfig.chainId);
    return getPositionById(subgraphEndpoint, positionId);
  }

  public async getOpenPositionsByUserAddress(
    userAddress: string,
    count: number = 20,
    skip?: number,
  ): Promise<Position[]> {
    const subgraphEndpoint = this.getSubgraphEndpoint(this.rpcConfig.chainId);
    return await getOpenPositionsByUserAddress(subgraphEndpoint, userAddress, count, skip);
  }

  public async getClosedPositionsByUserAddress(
    userAddress: string,
    count: number = 20,
    skip?: number,
  ): Promise<Position[]> {
    const subgraphEndpoint = this.getSubgraphEndpoint(this.rpcConfig.chainId);
    return await getClosedPositionsByUserAddress(subgraphEndpoint, userAddress, count, skip);
  }

  public async getLiquidatedPositionsByUserAddress(
    userAddress: string,
    count: number = 20,
    skip?: number,
  ): Promise<Position[]> {
    const subgraphEndpoint = this.getSubgraphEndpoint(this.rpcConfig.chainId);
    return await getLiquidatedPositionsByUserAddress(subgraphEndpoint, userAddress, count, skip);
  }

  public async getPythPriceIdsForPositionIds(positionIds: string[]): Promise<string[]> {
    const subgraphEndpoint = this.getSubgraphEndpoint(this.rpcConfig.chainId);
    return await getPythPriceIdsForPositionIds(subgraphEndpoint, positionIds);
  }

  public async getPositionsToRefresh(count: number = 20): Promise<string[]> {
    const subgraphEndpoint = this.getSubgraphEndpoint(this.rpcConfig.chainId);
    return await getPositionsToRefresh(subgraphEndpoint, count);
  }

  public async getPositionsToLiquidate(count: number = 10): Promise<string[]> {
    const subgraphEndpoint = this.getSubgraphEndpoint(this.rpcConfig.chainId);
    return await getPositionsToLiquidate(subgraphEndpoint, count);
  }

  public async getTotalDepositedCollateralInUsd(userAddress: string): Promise<Decimal> {
    const subgraphEndpoint = this.getSubgraphEndpoint(this.rpcConfig.chainId);
    return await getTotalDepositedCollateralInUsd(subgraphEndpoint, userAddress);
  }

  public async getTotalUnrealizedPnlInUsd(userAddress: string): Promise<Decimal> {
    const subgraphEndpoint = this.getSubgraphEndpoint(this.rpcConfig.chainId);
    return await getTotalUnrealizedPnlInUsd(subgraphEndpoint, userAddress);
  }

  public async getPositionsHistory(userAddress: string, count: number = 100, skip: number = 0): Promise<Position[]> {
    const subgraphEndpoint = this.getSubgraphEndpoint(this.rpcConfig.chainId);
    return await getPositionsHistory(subgraphEndpoint, userAddress, count, skip);
  }
  ////////////////////////////////////////////////////////////////
  //////////////////////    MARKET    ////////////////////////////
  ////////////////////////////////////////////////////////////////

  public async getAllMarketsFromSubgraph(): Promise<Market[]> {
    const subgraphEndpoint = this.getSubgraphEndpoint(this.rpcConfig.chainId);
    return getAllMarketsFromSubgraph(subgraphEndpoint);
  }

  public async getMarketById(marketId: string): Promise<Market> {
    const subgraphEndpoint = this.getSubgraphEndpoint(this.rpcConfig.chainId);
    return getMarketById(subgraphEndpoint, marketId);
  }

  ////////////////////////////////////////////////////////////////
  /////////////////////    PROTOCOL    ///////////////////////////
  ////////////////////////////////////////////////////////////////
  public async getExecutionFee(): Promise<{ executionFeeEth: Decimal; executionFeeUsdc: Decimal }> {
    const subgraphEndpoint = this.getSubgraphEndpoint(this.rpcConfig.chainId);
    return getExecutionFee(subgraphEndpoint);
  }

  public async getPortfolioDataByUsersAddress(
    userAddresses: string[],
    collateralPrice: { id: string; price: number }[],
  ) {
    const subgraphEndpoint = this.getSubgraphEndpoint(this.rpcConfig.chainId);
    return getPortfolioDataByUsersAddress(subgraphEndpoint, userAddresses, collateralPrice);
  }

  public transformPriceArray(priceArray: PriceObject[]): { id: string; price: number }[] {
    return transformPriceArray(priceArray);
  }
}
