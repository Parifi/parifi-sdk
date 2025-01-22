import { PythConfig, RpcConfig, SubgraphConfig } from '../interfaces/classConfigs';

import { getPortfolioStats, transformPriceArray } from './portfolio';
import { getAllMarketsFromSubgraph, getMarketById } from './markets';
import { Chain } from '@parifi/references';
import request, { GraphQLClient } from 'graphql-request';
import { getPublicSubgraphEndpoint } from './common';
import { Pyth } from '../pyth';
import Decimal from 'decimal.js';
import {
  checkIfExistingUser,
  getAccountByAddress,
  getFeesByAddress,
  getLeaderboardUserData,
  getRealizedPnlForUser,
} from './accounts';
import { LeaderboardUserData, Market, Order, Position } from '../interfaces/sdkTypes';
import { PriceObject, SnxAccount } from '../interfaces';
import { getProtocolStats } from './protocol';
import { getAllOrdersByUserAddress, getOrderById } from './orders';
import {
  getAllOpenPositionsWithTime,
  getAllPositionHistoryWithTime,
  getAllPositionsByUserAddress,
  getClosedPositionsByUserAddress,
  getLiquidatedPositionsByUserAddress,
  getOpenPositionsByUserAddress,
  getPositionById,
  getUserOpenPositionsWithTime,
  getUserPositionHistoryWithTime,
  getUserPositionsBySnxAccount,
  getUserPositionsHistory,
} from './positions';

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

  public async getPortfolioStats(
    userAddress: string,
    priceData: { id: string; price: number }[],
  ): Promise<{
    collateralValueInUsd: Decimal;
    unrealizedPnl: Decimal;
    realizedPnl: Decimal;
  }> {
    const subgraphEndpoint = this.getSubgraphEndpoint(this.rpcConfig.chainId);
    return await getPortfolioStats(subgraphEndpoint, userAddress, priceData);
  }

  public async getLeaderboardUserData(userAddresses: string[]): Promise<LeaderboardUserData[]> {
    const subgraphEndpoint = this.getSubgraphEndpoint(this.rpcConfig.chainId);
    return await getLeaderboardUserData(subgraphEndpoint, userAddresses);
  }

  public async getFeesByAddress(userAddresses: string[]) {
    const subgraphEndpoint = this.getSubgraphEndpoint(this.rpcConfig.chainId);
    return await getFeesByAddress(subgraphEndpoint, userAddresses);
  }

  public async checkIfExistingUser(userAddress: string) {
    const subgraphEndpoint = this.getSubgraphEndpoint(this.rpcConfig.chainId);
    return await checkIfExistingUser(subgraphEndpoint, userAddress);
  }

  public transformPriceArray(priceArray: PriceObject[]): { id: string; price: number }[] {
    return transformPriceArray(priceArray);
  }

  ////////////////////////////////////////////////////////////////
  //////////////////////    ORDERS    ////////////////////////////
  ////////////////////////////////////////////////////////////////
  public async getAllOrdersByUserAddress(userAddress: string, count: number, skip: number): Promise<SnxAccount[]> {
    const subgraphEndpoint = this.getSubgraphEndpoint(this.rpcConfig.chainId);
    return await getAllOrdersByUserAddress(subgraphEndpoint, userAddress, count, skip);
  }

  public async getOrderById(orderId: string): Promise<Order> {
    const subgraphEndpoint = this.getSubgraphEndpoint(this.rpcConfig.chainId);
    return await getOrderById(subgraphEndpoint, orderId);
  }

  public async getUserByAddress(userAddress: string): Promise<any> {
    const subgraphEndpoint = this.getSubgraphEndpoint(this.rpcConfig.chainId);
    return await getAccountByAddress(subgraphEndpoint, userAddress);
  }

  ////////////////////////////////////////////////////////////////
  //////////////////////    POSITION    //////////////////////////
  ////////////////////////////////////////////////////////////////
  public async getAllPositionsByUserAddress(
    userAddress: string,
    count: number = 10,
    skip: number = 0,
  ): Promise<SnxAccount[]> {
    const subgraphEndpoint = this.getSubgraphEndpoint(this.rpcConfig.chainId);
    return await getAllPositionsByUserAddress(subgraphEndpoint, userAddress, count, skip);
  }

  public async getOpenPositionsByUserAddress(
    userAddress: string,
    count: number = 10,
    skip: number = 0,
  ): Promise<SnxAccount[]> {
    const subgraphEndpoint = this.getSubgraphEndpoint(this.rpcConfig.chainId);
    return await getOpenPositionsByUserAddress(subgraphEndpoint, userAddress, count, skip);
  }

  public async getClosedPositionsByUserAddress(
    userAddress: string,
    count: number = 10,
    skip: number = 0,
  ): Promise<SnxAccount[]> {
    const subgraphEndpoint = this.getSubgraphEndpoint(this.rpcConfig.chainId);
    return await getClosedPositionsByUserAddress(subgraphEndpoint, userAddress, count, skip);
  }

  public async getLiquidatedPositionsByUserAddress(
    userAddress: string,
    count: number = 10,
    skip: number = 0,
  ): Promise<SnxAccount[]> {
    const subgraphEndpoint = this.getSubgraphEndpoint(this.rpcConfig.chainId);
    return await getLiquidatedPositionsByUserAddress(subgraphEndpoint, userAddress, count, skip);
  }

  public async getPositionById(positionId: string): Promise<Position> {
    const subgraphEndpoint = this.getSubgraphEndpoint(this.rpcConfig.chainId);
    return await getPositionById(subgraphEndpoint, positionId);
  }

  public async getUserPositionsHistory(
    userAddress: string,
    count: number = 100,
    skip: number = 0,
  ): Promise<SnxAccount[]> {
    const subgraphEndpoint = this.getSubgraphEndpoint(this.rpcConfig.chainId);
    return await getUserPositionsHistory(subgraphEndpoint, userAddress, count, skip);
  }

  // Get all positions by user address
  public async getUserPositionHistoryWithTime(
    userAddress: string,
    startTime: number,
    endTime: number,
    count: number = 100,
    skip: number = 0,
  ): Promise<SnxAccount[]> {
    const subgraphEndpoint = this.getSubgraphEndpoint(this.rpcConfig.chainId);
    return await getUserPositionHistoryWithTime(subgraphEndpoint, userAddress, startTime, endTime, count, skip);
  }

  // Get open positions by user address
  public async getUserOpenPositionsWithTime(
    userAddress: string,
    startTime: number,
    endTime: number,
    count: number = 10,
    skip: number = 0,
  ): Promise<SnxAccount[]> {
    const subgraphEndpoint = this.getSubgraphEndpoint(this.rpcConfig.chainId);
    return await getUserOpenPositionsWithTime(subgraphEndpoint, userAddress, startTime, endTime, count, skip);
  }

  // Get open positions by user address
  public async getUserPositionsBySnxAccount(snxAccountId: string): Promise<SnxAccount | undefined> {
    const subgraphEndpoint = this.getSubgraphEndpoint(this.rpcConfig.chainId);
    return await getUserPositionsBySnxAccount(subgraphEndpoint, snxAccountId);
  }

  // Get all closed/liquidated positions with time filter
  public async getAllPositionHistoryWithTime(
    startTime: number,
    endTime: number,
    count: number = 100,
    skip: number = 0,
  ): Promise<SnxAccount[]> {
    const subgraphEndpoint = this.getSubgraphEndpoint(this.rpcConfig.chainId);
    return await getAllPositionHistoryWithTime(subgraphEndpoint, startTime, endTime, count, skip);
  }

  // Get all open positions with time filter
  public async getAllOpenPositionsWithTime(
    startTime: number,
    endTime: number,
    count: number = 10,
    skip: number = 0,
  ): Promise<SnxAccount[]> {
    const subgraphEndpoint = this.getSubgraphEndpoint(this.rpcConfig.chainId);
    return await getAllOpenPositionsWithTime(subgraphEndpoint, startTime, endTime, count, skip);
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

  public getProtocolStats() {
    const subgraphEndpoint = this.getSubgraphEndpoint(this.rpcConfig.chainId);
    return getProtocolStats(subgraphEndpoint);
  }
}
