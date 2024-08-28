import { RollupState, STF } from "@stackr/stackr-js/execution";
import { ethers, keccak256, toUtf8Bytes } from "ethers";
import MerkleTree from "merkletreejs";

export type StateVariable = Record<string, number>

// class MerkleTreeTransport {
//   public merkleTree: MerkleTree;
//   public leaves: Account[];

//   constructor(leaves: Account[]) {
//     this.merkleTree = this.createTree(leaves);
//     this.leaves = leaves;
//   }

//   createTree(leaves: Account[]) {
//     const hashedLeaves = leaves.map((leaf: Account) => {
//       return ethers.solidityPackedKeccak256(
//         ["address", "uint"],
//         [leaf.address, leaf.reputation]
//       );
//     });
//     return new MerkleTree(hashedLeaves);
//   }
// }

interface StateTransport {
  records: StateVariable
}

export type ReputationActionInput = {
  type: "calculate-reputation";
  address: string;
  reputation: number;
};

export class ReputationRollup extends RollupState<
  StateVariable,
  StateTransport
> {
  constructor(count: StateVariable) {
    super(count);
  }

  createTransport(state: StateVariable): StateTransport {
    return { records: state }
  }

  getState(): StateVariable {
    return this.transport.records;
  }

  calculateRoot(): ethers.BytesLike {
    let hexString = '';

    for (const key in this.transport.records) {
        if (this.transport.records.hasOwnProperty(key)) {
            const value = this.transport.records[key];
            hexString += value.toString(16);
        }
    }

    return keccak256(toUtf8Bytes(hexString));
  }
}

export const reputationSTF: STF<ReputationRollup, ReputationActionInput> = {
  identifier: "reputationSTF",

  apply(inputs: ReputationActionInput, state: ReputationRollup): void {
    let newState = state.getState();

    if (inputs.address in newState) {
      newState[inputs.address] += inputs.reputation;
    } else {
      newState[inputs.address] = inputs.reputation;
    }

    // const index = newState.leaves.findIndex(
    //   (leaf: Account) => leaf.address === inputs.address
    // );
    // if (index === -1) {
    //   newState.leaves.push({
    //     address: inputs.address,
    //     reputation: inputs.reputation,
    //   });
    // } else {
    //   newState.leaves[index].reputation += inputs.reputation;
    // }

    // console.log({ inputs, state: JSON.stringify(state.getState().records), records: newState });

    state.transport.records = newState;
  },
};
