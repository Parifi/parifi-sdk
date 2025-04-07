import request from 'graphql-request';
import { fetchProtocolTradeInfo } from './subgraphQueries';

export interface ProtocolStats {
  orderTotalFees: string;
  totalVolume: string;
  totalActivePositions: string;
  activeUsersCount: string;
  orderCount: string;
}

// Returns the protocol stats
export const getProtocolStats = async (subgraphEndpoint: string): Promise<ProtocolStats> => {
  const subgraphResponse: any = await request(subgraphEndpoint, fetchProtocolTradeInfo());
  return subgraphResponse.protocolData;
};
