import { request } from 'graphql-request';
import {
  fetchAllOpenPositionsWithTime,
  fetchAllPositionHistoryWithTime,
  fetchPositionByIdQuery,
  fetchPositionsBySnxAccount,
  fetchPositionsByUserQuery,
  fetchPositionsByUserQueryAndStatus,
  fetchUserOpenPositionsWithTime,
  fetchUserPositionHistory,
  fetchUserPositionHistoryWithTime,
} from './subgraphQueries';

import { NotFoundError } from '../../error/not-found.error';
import { Position, SnxAccount } from '../../interfaces/sdkTypes';
import {
  mapResponseToPosition,
  mapResponseToSnxAccount,
  mapResponseToSnxAccountArray,
} from '../../common/subgraphMapper';

// Get all positions by user address
export const getAllPositionsByUserAddress = async (
  subgraphEndpoint: string,
  userAddress: string,
  count: number = 10,
  skip: number = 0,
): Promise<SnxAccount[]> => {
  try {
    const subgraphResponse: any = await request(subgraphEndpoint, fetchPositionsByUserQuery(userAddress, count, skip));
    const snxAccounts = mapResponseToSnxAccountArray(subgraphResponse?.snxAccounts);
    return snxAccounts ?? [];
  } catch (error) {
    console.error('Error fetching positions:', error);
    return [];
  }
};

// Get open positions by user address
export const getOpenPositionsByUserAddress = async (
  subgraphEndpoint: string,
  userAddress: string,
  count: number = 10,
  skip: number = 0,
): Promise<SnxAccount[]> => {
  try {
    const subgraphResponse: any = await request(
      subgraphEndpoint,
      fetchPositionsByUserQueryAndStatus(userAddress, 'OPEN', count, skip),
    );
    const snxAccounts = mapResponseToSnxAccountArray(subgraphResponse?.snxAccounts);
    return snxAccounts ?? [];
  } catch (error) {
    console.error('Error fetching positions:', error);
    return [];
  }
};

// Get open positions by user address
export const getClosedPositionsByUserAddress = async (
  subgraphEndpoint: string,
  userAddress: string,
  count: number = 10,
  skip: number = 0,
): Promise<SnxAccount[]> => {
  try {
    const subgraphResponse: any = await request(
      subgraphEndpoint,
      fetchPositionsByUserQueryAndStatus(userAddress, 'CLOSED', count, skip),
    );
    const snxAccounts = mapResponseToSnxAccountArray(subgraphResponse?.snxAccounts);
    return snxAccounts ?? [];
  } catch (error) {
    console.error('Error fetching positions:', error);
    return [];
  }
};

// Get LIQUIDATED positions by user address
export const getLiquidatedPositionsByUserAddress = async (
  subgraphEndpoint: string,
  userAddress: string,
  count: number = 10,
  skip: number = 0,
): Promise<SnxAccount[]> => {
  try {
    const subgraphResponse: any = await request(
      subgraphEndpoint,
      fetchPositionsByUserQueryAndStatus(userAddress, 'LIQUIDATED', count, skip),
    );
    const snxAccounts = mapResponseToSnxAccountArray(subgraphResponse?.snxAccounts);
    return snxAccounts ?? [];
  } catch (error) {
    console.error('Error fetching positions:', error);
    return [];
  }
};

// Get position from subgraph by position ID
export const getPositionById = async (subgraphEndpoint: string, positionId: string): Promise<Position> => {
  try {
    let subgraphResponse: any = await request(subgraphEndpoint, fetchPositionByIdQuery(positionId));

    console.log('subgraph response:', subgraphResponse);
    const position = mapResponseToPosition(subgraphResponse?.position);
    if (position) return position;
    throw new NotFoundError('Position id not found');
  } catch (error) {
    console.error('Error fetching position:', error);
    throw new NotFoundError('Position id not found');
  }
};

// Get all positions by user address
export const getUserPositionsHistory = async (
  subgraphEndpoint: string,
  userAddress: string,
  count: number = 100,
  skip: number = 0,
): Promise<SnxAccount[]> => {
  try {
    const subgraphResponse: any = await request(subgraphEndpoint, fetchUserPositionHistory(userAddress, count, skip));
    const snxAccounts = mapResponseToSnxAccountArray(subgraphResponse?.snxAccounts);
    return snxAccounts ?? [];
  } catch (error) {
    console.error('Error fetching positions:', error);
    return [];
  }
};

// Get positions history by user address
export const getUserPositionHistoryWithTime = async (
  subgraphEndpoint: string,
  userAddress: string,
  startTime: number,
  endTime: number,
  count: number = 100,
  skip: number = 0,
): Promise<SnxAccount[]> => {
  try {
    const subgraphResponse: any = await request(
      subgraphEndpoint,
      fetchUserPositionHistoryWithTime(userAddress, startTime, endTime, count, skip),
    );
    const snxAccounts = mapResponseToSnxAccountArray(subgraphResponse?.snxAccounts);
    return snxAccounts ?? [];
  } catch (error) {
    console.error('Error fetching positions:', error);
    return [];
  }
};

// Get all open positions by user address
export const getUserOpenPositionsWithTime = async (
  subgraphEndpoint: string,
  userAddress: string,
  startTime: number,
  endTime: number,
  count: number = 10,
  skip: number = 0,
): Promise<SnxAccount[]> => {
  try {
    const subgraphResponse: any = await request(
      subgraphEndpoint,
      fetchUserOpenPositionsWithTime(userAddress, startTime, endTime, count, skip),
    );
    const snxAccounts = mapResponseToSnxAccountArray(subgraphResponse?.snxAccounts);
    return snxAccounts ?? [];
  } catch (error) {
    console.error('Error fetching positions:', error);
    return [];
  }
};

// Get positions by SNX Account id
export const getUserPositionsBySnxAccount = async (
  subgraphEndpoint: string,
  snxAccountId: string,
): Promise<SnxAccount | undefined> => {
  let formattedSnxAccountId = snxAccountId;
  try {
    if (!snxAccountId.includes('PERP')) {
      formattedSnxAccountId = 'PERP-'.concat(snxAccountId);
    }
    const subgraphResponse: any = await request(subgraphEndpoint, fetchPositionsBySnxAccount(formattedSnxAccountId));
    const snxAccount = mapResponseToSnxAccount(subgraphResponse?.snxAccount);
    return snxAccount;
  } catch (error) {
    console.error('Error fetching positions:', error);
    return undefined;
  }
};

// Get all open positions for all users
export const getAllOpenPositionsWithTime = async (
  subgraphEndpoint: string,
  startTime: number,
  endTime: number,
  count: number = 10,
  skip: number = 0,
): Promise<SnxAccount[]> => {
  try {
    const subgraphResponse: any = await request(
      subgraphEndpoint,
      fetchAllOpenPositionsWithTime(startTime, endTime, count, skip),
    );
    const snxAccounts = mapResponseToSnxAccountArray(subgraphResponse?.snxAccounts);
    return snxAccounts ?? [];
  } catch (error) {
    console.error('Error fetching positions:', error);
    return [];
  }
};

// Get positions history by user address
export const getAllPositionHistoryWithTime = async (
  subgraphEndpoint: string,
  startTime: number,
  endTime: number,
  count: number = 100,
  skip: number = 0,
): Promise<SnxAccount[]> => {
  try {
    const subgraphResponse: any = await request(
      subgraphEndpoint,
      fetchAllPositionHistoryWithTime(startTime, endTime, count, skip),
    );
    const snxAccounts = mapResponseToSnxAccountArray(subgraphResponse?.snxAccounts);
    return snxAccounts ?? [];
  } catch (error) {
    console.error('Error fetching positions:', error);
    return [];
  }
};
