import { gql } from 'graphql-request';

export const fetchPositionsByUserQuery = (userAddress: string, count: number = 10, skip: number = 0) =>
  gql`
    {
        positions(
            first: ${count}
            skip: ${skip}
            orderBy: createdTimestamp
            orderDirection: desc
            where: {user: "${userAddress}"}
        ) {
            id
            market {
            id
            }
            user {
            id
            }
            positionSize
            positionCollateral
            avgPrice
            avgPriceDec
            isLong
            createdTimestamp
            lastCumulativeFee
            status
            txHash
            liquidationTxHash
            closingPrice
            realizedPnl
            realizedPnlCollateral
            realizedFee
            realizedFeeCollateral
            netRealizedPnl
            createdTimestamp
            lastRefresh
            lastRefreshISO
            
        }
    }`;

export const fetchPositionByIdQuery = (positionId: string) =>
  gql`
    {
        position(
            id: "${positionId}"
        ) {
            id
            market {
                id
            }
            user {
                id
            }
            isLong
            positionCollateral
            positionSize
            avgPrice
            avgPriceDec
            avgPricePrev
            lastCumulativeFee
            status
            txHash
            liquidationTxHash
            closingPrice
            realizedPnl
            realizedPnlCollateral
            realizedFee
            realizedFeeCollateral
            netRealizedPnl
            createdTimestamp
            lastRefresh
            lastRefreshISO            
        }
    }`;
