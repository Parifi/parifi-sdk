import request from 'graphql-request';
import { fetchUserPortfolioInfo } from './subgraphQueries';
import {
  collateralDepositsPortfolioData,
  PorfolioDataSubgraph,
  PortfolioWallet,
  positionsPortolfio,
  PriceObject,
} from '../../interfaces';
import { SYMBOL_TO_PYTH_FEED, collateralMappingWithRegularSymbol } from '../../common';
import { formatEther } from 'ethers';

// Get all order by a user address
export const getPortfolioDataByUsersAddress = async (
  subgraphEndpoint: string,
  usersAddress: string[],
  collateralPrice: { id: string; price: number }[],
) => {
  try {
    const subgraphResponse: PorfolioDataSubgraph = await request(
      subgraphEndpoint,
      fetchUserPortfolioInfo(usersAddress),
    );
    // console.log(subgraphResponse);
    const portfolioData = await Promise.all(
      subgraphResponse.wallets?.map(async (data) => {
        const { depositedCollateral, unrealizedPnl, realizedPnl } = getPortfolioDataForUser(data, collateralPrice);
        // console.log(
        //   'id :' + data.id,
        //   `Deposited collateral: ${depositedCollateral}, Unrealized PNL: ${unrealizedPnl}, Realized PNL: ${realizedPnl}`,
        // );

        return {
          userAddress: data.id,
          depositedCollateral,
          unrealizedPnl,
          realizedPnl,
        };
      }) || [], // Fallback to an empty array if wallets is undefined
    );

    return portfolioData;
  } catch (error) {
    throw error;
  }
};

export const getPortfolioDataForUser = (
  subgraphResponse: PortfolioWallet,
  collateralPrice: { id: string; price: number }[],
) => {
  try {
    let totaldepositedCollateral = 0;
    let totalUnrealizedPnl = 0;
    let totalRealizedPnl = 0;
    subgraphResponse.snxAccounts.forEach((data) => {
      let depositedCollateral;
      let unrealizedPnL;
      let realizedPnl;

      const { openPositions, otherPositions } = splitPositionsByStatus(data.positions);
      if (data.collateralDeposits.length) {
        depositedCollateral = getDepositedCollateralBySnxAccount(data.collateralDeposits[0], collateralPrice);
      } else {
        depositedCollateral = 0; // No deposited collateral, assume 0
      }
      if (openPositions.length) {
        unrealizedPnL = getUnRealizedPnlBySnxAccount(openPositions[0], collateralPrice);
      } else {
        unrealizedPnL = 0; // No open positions, assume 0
      }
      if (otherPositions.length) {
        realizedPnl = getRealizedPnlBySnxAccount(otherPositions[0]);
      } else {
        realizedPnl = 0; // No other positions, assume 0
      }
      totaldepositedCollateral += depositedCollateral;
      totalUnrealizedPnl += unrealizedPnL;
      totalRealizedPnl += realizedPnl;
    });

    return {
      depositedCollateral: totaldepositedCollateral.toFixed(6),
      unrealizedPnl: totalUnrealizedPnl.toFixed(6),
      realizedPnl: totalRealizedPnl.toFixed(6),
    };
  } catch (error) {
    throw error;
  }
};

const getDepositedCollateralBySnxAccount = (
  collateralDeposits: collateralDepositsPortfolioData,
  collateralPrice: { id: string; price: number }[],
) => {
  let totalCollateral = 0;
  if (!collateralDeposits) return totalCollateral;

  const depositedAmount = formatEther(collateralDeposits.depositedAmount ?? '0');

  const collateralSymbol =
    collateralMappingWithRegularSymbol.get(collateralDeposits.collateralSymbol?.toLowerCase() || '') ||
    collateralDeposits.collateralSymbol?.toLowerCase();

  const pythId = SYMBOL_TO_PYTH_FEED.get(collateralSymbol?.toUpperCase() || '');

  // Check if pythId exists before trying to access collateralPrice
  const price = pythId ? collateralPrice.find((p) => p.id === pythId.slice(2))?.price || 0 : 0;

  //   console.log('price: ', collateralSymbol, pythId, price);

  // Multiply by price and add to totalCollateral
  totalCollateral = Number(depositedAmount) * price;

  return totalCollateral;
};

const getUnRealizedPnlBySnxAccount = (
  openPositionsArray: positionsPortolfio,
  collateralPrice: { id: string; price: number }[],
) => {
  let totalUnrealizedPnl = 0;
  if (!openPositionsArray) return totalUnrealizedPnl;
  const size = formatEther(openPositionsArray.positionSize ?? '0');
  const avgPrice = formatEther(openPositionsArray.avgPrice ?? '0');
  const pythId = SYMBOL_TO_PYTH_FEED.get(openPositionsArray.market.marketSymbol?.toUpperCase() ?? '');
  const price = pythId ? collateralPrice.find((p) => p.id === pythId.slice(2))?.price || 0 : 0;
  //   console.log('currentMarketPrice', price);
  const unrealizedPnL = (price - Number(avgPrice)) * Number(size);
  totalUnrealizedPnl += unrealizedPnL;

  return totalUnrealizedPnl;
};

const getRealizedPnlBySnxAccount = (closedPositionsArray: positionsPortolfio) => {
  let totalRealizedPnl = 0;
  if (!closedPositionsArray) return totalRealizedPnl;

  const realizedPnl =
    Number(closedPositionsArray.realizedPnl ?? '0') - Number(formatEther(closedPositionsArray.realizedFee ?? '0'));
  totalRealizedPnl += realizedPnl;

  return totalRealizedPnl;
};

const splitPositionsByStatus = (
  positions: positionsPortolfio[],
): { openPositions: positionsPortolfio[]; otherPositions: positionsPortolfio[] } => {
  const openPositions: positionsPortolfio[] = [];
  const otherPositions: positionsPortolfio[] = [];

  positions.forEach((position) => {
    if (position.status === 'OPEN') {
      openPositions.push(position);
    } else {
      otherPositions.push(position);
    }
  });

  return { openPositions, otherPositions };
};

export function transformPriceArray(priceArray: PriceObject[]): { id: string; price: number }[] {
  return priceArray.map((obj) => ({
    id: obj.id,
    price: Number(obj.price.price) / 10 ** obj.price.expo,
  }));
}
