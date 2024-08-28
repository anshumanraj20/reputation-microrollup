import { ethers } from "ethers";
import { stackrConfig } from "../stackr.config";
import { ActionSchema } from "@stackr/stackr-js";

const actionSchemaType = {
  type: "String",
  address: "Address",
  reputation: "Uint",
};

const actionInput = new ActionSchema(
  "calculate-reputation",
  actionSchemaType
);

const submitToRollup = async () => {
  const wallet = new ethers.Wallet("0xbf316464e169d0b013243acc7abca4e02f4c6b8b6170086041af16c6e6d580a7");

  const data = {
    type: "calculate-reputation",
    address: wallet.address,
    reputation: 0,
  };

  const sign = await wallet.signTypedData(
    stackrConfig.domain,
    actionInput.EIP712TypedData.types,
    data
  );

  console.log(actionInput.EIP712TypedData.types)

  const payload = JSON.stringify({
    msgSender: wallet.address,
    signature: sign,
    payload: data,
  });

  console.log(payload);

  const res = await fetch("http://localhost:3000/", {
    method: "POST",
    body: payload,
    headers: {
      "Content-Type": "application/json",
    },
  });

  const json = await res.json();
  console.log(json);
};

const viewRollupState = async () => {
  const res = await fetch("http://localhost:3000/", {
    method: "GET",
  });

  const json = await res.json();
  console.log(json);
};

const run = async () => {
  await submitToRollup();
  await viewRollupState();
}

// for(let i = 0; i < 10; i++) {
  await run();
// } 
