import { gql } from 'graphql-request';

export const fetchProtocolTradeInfo = () => gql`
  {
    protocolData(id: "1") {
      orderTotalFees
      totalVolume
      totalActivePositions
      activeUsersCount
      orderCount
    }
  }
`;
