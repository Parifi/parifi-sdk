import { request } from "graphql-request";
import { Chain } from "../../common/chain";
import { getSubgraphEndpoint } from "../common";
import { fetchAllMarketsDataQuery } from "./subgraphQueries";
import { mapMarketsArrayToInterface } from "../common/mapper";

export const getAllMarketsFromSubgraph = async (chainId: Chain) => {
    const subgraphEndpoint = getSubgraphEndpoint(chainId);
    console.log("subgraphEndpoint", subgraphEndpoint);

    const subgraphResponse = await request(
        subgraphEndpoint,
        fetchAllMarketsDataQuery
    );

    return mapMarketsArrayToInterface(subgraphResponse)
}