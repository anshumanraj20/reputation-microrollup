import { config } from "./config";
import { executeQuery } from "./subgraph";

function calculateTotals(data: any) {
  // Total Borrowed Amount
  const totalBorrowed = data.account.borrows.reduce(
    (sum: number, borrow: any) => sum + parseFloat(borrow.amountUSD),
    0
  );

  // Total Repaid Amount
  const totalRepaid = data.account.repays.reduce(
    (sum: number, repay: any) => sum + parseFloat(repay.amountUSD),
    0
  );

  // Number of Open and Closed Positions
  const openPositions = data.account.openPositionCount;
  const closedPositions = data.account.closedPositionCount;

  // Liquidation Count
  const liquidationCount = data.account.liquidations.length;

  return {
    totalBorrowed,
    totalRepaid,
    openPositions,
    closedPositions,
    liquidationCount,
  };
}

const scaleTo1000 = (number: number) => {
  if (number <= 0) {
    return 0;
  }

  // Apply a logarithmic scale
  const scaledNumber = Math.log(number);

  // Normalize to the range 0 - 1000
  // Adjust the multiplier (1000 / Math.log(maxInput)) as needed
  return Math.min(1000, scaledNumber * (1000 / Math.log(10000000)));
};

const parseProtocolData = (data: any): number => {
  if (!data || data.account === null) return 0;

  const {
    totalBorrowed,
    totalRepaid,
    openPositions,
    closedPositions,
    liquidationCount,
  } = calculateTotals(data);
  // Assign weights to each parameter
  const weights = {
    delta: 0.3,
    gamma: 0.8,
    lambda: 1,
  };

  // Calculate the weighted sum
  const delta = totalBorrowed - totalRepaid;
  const gamma =
    openPositions + closedPositions === 0
      ? 0
      : closedPositions / (openPositions + closedPositions);
  const lambda = liquidationCount ** 2;

  const score = Math.abs(
    weights.gamma * gamma - weights.delta * delta - weights.lambda * lambda
  );

  // Scale the score to the range of 0 to 1000
  const scaledScore = scaleTo1000(score);

  console.log({ score, scaledScore });

  // Return the creditworthiness score
  return scaledScore;
};

export const getReputation = async (address: string) => {
  const whitelistAddressesForDemo = process.env.WHITELIST_ADDRESSES?.split(",");
  if (whitelistAddressesForDemo?.indexOf(address) !== -1) {
    return Math.floor(Math.random() * 1000);
  }

  let total = 0;
  for (const protocol in config.protocol) {
    const chains = config.protocol[protocol as keyof typeof config.protocol];
    for (const chain in chains) {
      const id = chains[chain as keyof typeof chains];
      const data = await executeQuery(id, address, "protocol");
      const score = parseProtocolData(data);
      total += score;
    }
  }
  return Math.floor(total);
};

