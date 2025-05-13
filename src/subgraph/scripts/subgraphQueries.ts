import { gql } from 'graphql-request';

// Fetch all orders by `userAddress`
export const fetchIntegratorFeesWithTimestampQuery = (
  startTimeStamp: number, // unix timestamp
  endTimeStamp: number, //unix timestamp
) =>
  gql`{
    snxAccounts(
      first: 1000
      where: { type: PERP, totalOrdersCount_gt: 0 }) {
      id
      integratorFeesGenerated
      accountId
      owner {
        id
      }
      orders(
        where: {
          status: SETTLED,
          createdTimestamp_gt: ${startTimeStamp},
          createdTimestamp_lt: ${endTimeStamp}
        }
    ) {
        id
        referralFees
        collectedFees
      }
    }
  }
`;
