import { request, gql } from "graphql-request";

const protocolQuery = gql`
  query ProtocolQuery($address: String!) {
    account(id: $address) {
      id
      depositCount
      liquidateCount
      openPositionCount
      closedPositionCount
      repayCount
      borrowCount
      liquidationCount

      borrows {
        id
        amount
        amountUSD
        asset {
          name
          symbol
          decimals
        }
      }

      liquidations {
        id
        amount
        amountUSD
        asset {
          name
          symbol
          decimals
        }
      }

      repays {
        id
        amount
        amountUSD
        asset {
          name
          symbol
          decimals
        }
      }
    }
  }
`;

const dexQuery = gql`
  query DexQuery($address: String!) {
    account(id: $address) {
      positions {
        id
        cumulativeDepositUSD
        cumulativeRewardUSD
        cumulativeWithdrawUSD
        pool {
          id
          protocol {
            name
            activeLiquidityUSD
            totalLiquidityUSD
          }
          name
          symbol
        }
      }

      positionCount
    }
  }
`;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const executeQuery = async (
  id: string,
  address: string,
  type: "dex" | "protocol"
) => {
  for (let i = 0; i < 2; i++) {
    try {
      const url = `https://gateway-arbitrum.network.thegraph.com/api/${process.env.SUBGRAPH_API_KEY}/subgraphs/id/${id}`;
      if (type === "dex") {
        const data = await request(url, dexQuery, { address });
        return data;
      } else {
        const data = await request(url, protocolQuery, { address });
        return data;
      }
    } catch (e) {
      sleep(2000);
    }
  }
  return 0;
};
