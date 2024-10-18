import { Chain } from '@parifi/references';

export const publicSubgraphEndpoints: { [key in Chain]: string } = {
  [Chain.ARBITRUM_SEPOLIA]: process.env.SUBGRAPH_URL_ARB_SEPOLIA || '',
  [Chain.ARBITRUM_MAINNET]: 'https://api.studio.thegraph.com/query/68480/parifi-arbitrum/version/latest',
};

export const getPublicSubgraphEndpoint = (chainId: Chain) => {
  return publicSubgraphEndpoints[chainId];
};
