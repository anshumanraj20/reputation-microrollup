import { ActionSchema, ConfirmationEvents, FIFOStrategy, MicroRollup } from "@stackr/stackr-js";
import bodyParser from "body-parser";
import express, { Request, Response } from "express";
import { stackrConfig } from "../stackr.config";
import { ReputationRollup, reputationSTF } from "./state";
import { StateMachine } from "@stackr/stackr-js/execution";
import * as genesisState from "../genesis-state.json";

import cors from 'cors';

const reputationFsm = new StateMachine({
  state: new ReputationRollup(genesisState.state),
  stf: reputationSTF,
});

export const actionSchemaType = {
  type: "String",
  address: "Address",
  reputation: "Uint",
};

export const actionInput = new ActionSchema(
  "calculate-reputation",
  actionSchemaType
);

const buildStrategy = new FIFOStrategy();

const rollup = async () => {
  const { state, actions, events } = await MicroRollup({
    config: stackrConfig,
    useState: reputationFsm,
    useAction: actionInput,
    useBuilder: { strategy: buildStrategy, autorun: true },
    useSyncer: { autorun: true },
  });

  events.confirmation.onEvent(ConfirmationEvents.C2_CONFIRMATION, (data) => {
    // TODO: Send the state root to the L1 contract
  })

  return { state, actions };
};


const app = express();
app.use(bodyParser.json());

// Use CORS for all routes
app.use(cors());

const { actions, state } = await rollup();

app.get("/", (req: Request, res: Response) => {
  res.send({ leaves: state.get().state.getState().leaves });
});

app.post("/getReputation", async (req: Request, res: Response) => {
  // const reputation = await getReputation(req.body.address);
  console.log(req.body)
  res.status(201).send({ reputation: Math.floor(Math.random() * 1000) });
})

app.post("/", async (req: Request, res: Response) => {
  const schema = actions.getSchema("calculate-reputation");

  if (!schema) {
    res.status(400).send({ message: "error" });
    return;
  }

  try {
    console.log({ body: req.body, address: req.body.msgSender });
    console.log(req.body)
    const newAction = schema.newAction(req.body);
    const ack = await actions.submit(newAction);
    res.status(201).send({ ack });
  } catch (e: any) {
    res.status(400).send({ error: e.message });
  }
});

app.listen(3000, () => {
  console.log("listening on port 3000");
});
