import { Chain } from '@parifi/references';

export const publicSubgraphEndpoints: { [key in Chain]: string } = {

  [Chain.ARBITRUM_SEPOLIA]: 'https://subgraph.satsuma-prod.com/ac10c1d41dcb/parifis-team--3804602/parifi-snx-sepolia/api',
  [Chain.ARBITRUM_MAINNET]:
    'https://api.studio.thegraph.com/query/68480/parifi-arbitrum/version/latest',

};

export const getPublicSubgraphEndpoint = (chainId: Chain) => {
  return publicSubgraphEndpoints[chainId];
};
