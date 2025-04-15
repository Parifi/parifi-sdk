import { gql } from 'graphql-request';

export const fetchProtocolTradeInfo = () => gql`
  {
    protocolData(id: "1") {
      userCount
      activeUsersCount
      orderCount
      settledCount
      positionCount
      totalActivePositions
      referralFeesReceived
      totalVolume
      orderTotalFees
    }
  }
`;
