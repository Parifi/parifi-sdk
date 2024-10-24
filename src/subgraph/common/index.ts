import { Chain } from '@parifi/references';
import dotenv from 'dotenv';
dotenv.config();
export const publicSubgraphEndpoints: { [key in Chain]: string } = {
  [Chain.ARBITRUM_SEPOLIA]: process.env.SUBGRAPH_ENDPOINT || '',
  [Chain.ARBITRUM_MAINNET]: 'https://api.studio.thegraph.com/query/68480/parifi-arbitrum/version/latest',
};

export const getPublicSubgraphEndpoint = (chainId: Chain) => {
  return publicSubgraphEndpoints[chainId];
};
