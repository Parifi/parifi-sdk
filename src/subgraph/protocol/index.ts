import request from 'graphql-request';
import { fetchProtocolTradeInfo } from './subgraphQueries';

export interface ProtocolStats {
  userCount: string;
  activeUsersCount: string;
  orderCount: string;
  settledCount: string;
  positionCount: string;
  totalActivePositions: string;
  referralFeesReceived: string;
  totalVolume: string;
  orderTotalFees: string;
}

// Returns the protocol stats
export const getProtocolStats = async (subgraphEndpoint: string): Promise<ProtocolStats> => {
  const subgraphResponse: any = await request(subgraphEndpoint, fetchProtocolTradeInfo());
  return subgraphResponse.protocolData;
};
