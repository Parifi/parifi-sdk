import request from 'graphql-request';
import { fetchProtocolTradeInfo } from './subgraphQueries';
import { ProtocolStats } from '../../interfaces';

// Returns the protocol stats
export const getProtocolStats = async (subgraphEndpoint: string): Promise<ProtocolStats> => {
  const subgraphResponse: any = await request(subgraphEndpoint, fetchProtocolTradeInfo());
  return subgraphResponse.protocolData;
};
