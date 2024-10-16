import request from 'graphql-request';
import { fetchUserPortfolioInfo } from './subgraphQueries';
import {
  collateralDepositsPortfolioData,
  PorfolioDataSubgrph,
  PortfolioWallet,
  positiosPortolfio,
  PriceObject,
} from '../../interfaces';
import { ARB_SEPOLIA_MARKET_COLLATERAL_PYTH_ID, collateralMappingWithRegularSymbol } from '../../common';
import { formatEther } from 'ethers';

// Get all order by a user address
export const getPortfolioDataByUsersAddress = async (
  subgraphEndpoint: string,
  usersAddress: string[],
  collateralPrice: { id: string; price: number }[],
) => {
  try {
    const subgraphResponse: PorfolioDataSubgrph = await request(subgraphEndpoint, fetchUserPortfolioInfo(usersAddress));
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
    let toataldepositedCollateral = 0;
    let totalUnrealizedPnl = 0;
    let totalRealizedPnl = 0;
    subgraphResponse.snxAccounts.forEach((data) => {
      const { openPositions, otherPositions } = splitPositionsByStatus(data.positions);
      const depositedCollateral = getDepositedCollateralBySnxAccount(data.collateralDeposits[0], collateralPrice);
      const unrealizedPnL = getUnRealizedPnlBySnxAccount(openPositions[0], collateralPrice);
      const realizedPnl = getRealizedPnlBySnxAccount(otherPositions[0]);
      toataldepositedCollateral += depositedCollateral;
      totalUnrealizedPnl += unrealizedPnL;
      totalRealizedPnl += realizedPnl;
    });

    return {
      depositedCollateral: toataldepositedCollateral.toFixed(6),
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

  const pythId = ARB_SEPOLIA_MARKET_COLLATERAL_PYTH_ID.get(collateralSymbol?.toUpperCase() || '');

  // Check if pythId exists before trying to access collateralPrice
  const price = pythId ? collateralPrice.find((p) => p.id === pythId.slice(2))?.price || 0 : 0;

  //   console.log('price: ', collateralSymbol, pythId, price);

  // Multiply by price and add to totalCollateral
  totalCollateral = Number(depositedAmount) * price;

  return totalCollateral;
};

const getUnRealizedPnlBySnxAccount = (
  openPositionsArray: positiosPortolfio,
  collateralPrice: { id: string; price: number }[],
) => {
  let totalUnrealizedPnl = 0;
  if (!openPositionsArray) return totalUnrealizedPnl;
  const size = formatEther(openPositionsArray.positionSize ?? '0');
  const avgPrice = formatEther(openPositionsArray.avgPrice ?? '0');
  const pythId = ARB_SEPOLIA_MARKET_COLLATERAL_PYTH_ID.get(openPositionsArray.market.marketSymbol?.toUpperCase() ?? '');
  const price = pythId ? collateralPrice.find((p) => p.id === pythId.slice(2))?.price || 0 : 0;
  //   console.log('currentMarketPrice', price);
  const unrealizedPnL = (price - Number(avgPrice)) * Number(size);
  totalUnrealizedPnl += unrealizedPnL;

  return totalUnrealizedPnl;
};

const getRealizedPnlBySnxAccount = (closedPositionsArray: positiosPortolfio) => {
  let totalRealizedPnl = 0;
  if (!closedPositionsArray) return totalRealizedPnl;

  const realizedPnl =
    Number(closedPositionsArray.realizedPnl ?? '0') - Number(formatEther(closedPositionsArray.realizedFee ?? '0'));
  totalRealizedPnl += realizedPnl;

  return totalRealizedPnl;
};

const splitPositionsByStatus = (
  positions: positiosPortolfio[],
): { openPositions: positiosPortolfio[]; otherPositions: positiosPortolfio[] } => {
  const openPositions: positiosPortolfio[] = [];
  const otherPositions: positiosPortolfio[] = [];

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
    price: Number(obj.price.price) / 10 ** 8,
  }));
}
