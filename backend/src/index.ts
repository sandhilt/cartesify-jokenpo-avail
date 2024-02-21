import { Request, Response } from 'express'
import {Challenge, Move} from './Challenge'
import { Hex } from 'viem';

const { CartesifyBackend } = require("@calindra/cartesify-backend")

let dapp: any;

CartesifyBackend.createDapp().then( (initApp:any) => {
  initApp.start().catch((e:any) => {
        console.error(e);
        process.exit(1);
    });
  dapp = initApp;
});

console.log('starting app.js...')
const express = require("express")

const app = express();
const port = 8383;
app.use(express.json());

let nextId:number = 0;
let playerChallenges = new Map<string, number>();
let challenges = new Map<string, Challenge>();

app.post("/createChallenge", (req:Request, res:Response) => {
  console.log("Create challenge received");
  const payload = req.body;

  const commitment:string = payload.commitment;

  if(!commitment) {
    throw new Error("Move not chosen");
  }

  const sender:string = req.headers['x-msg_sender'] as string

  const challenge = new Challenge(nextId, sender, commitment)
  challenges.set(nextId.toString(), challenge);
  playerChallenges.set(sender, nextId);

  nextId++;

  const buffer = Buffer.from(`challenge with id ${nextId} was created by ${sender}`, "utf-8")
  const hexString = "0x" + buffer.toString('hex');

  dapp.createNotice({payload: hexString})

  res.send({status: "CREATED"})
});

app.get("/challenges",(req:Request, res:Response) => {
  console.log("Request received to list challenges")
  let challengeList: Array<any> = []
  
  for(let challenge_id of challenges.keys()) {
    let challenge:Challenge = challenges.get(challenge_id) as Challenge;
    
    let opponentMove:Move | undefined = undefined;

    if(challenge.oponentAddress) {
      opponentMove = challenge.commitments.get(challenge.oponentAddress) as Move
    }

    let creatorMove:Move = challenge.commitments.get(challenge.creatorAddress) as Move

    challengeList.push({
      "challenge_id": challenge_id,
      "creator": challenge.creatorAddress,
      "opponent": challenge.oponentAddress,
      "winner": challenge.winnerAddress,
      "opponent_committed":  opponentMove?.move,
      "opponent_move":  opponentMove?.move,
      "creator_move": creatorMove.move
    })

  }

  res.send({challenges: challengeList})
})

app.post("/acceptChallenge", (req:Request, res:Response) => {
  console.log("Request received to accept challenges");

  const payload = req.body;

  const commitment:string = payload.commitment;
  const challengeId: string = payload.challengeId;

  const challenge = challenges.get(challengeId);
  
  if(!challenge) {
    const buffer = Buffer.from("Challenge not found", "utf-8");
    const hexPayload: Hex = `0x${buffer.toString("hex")}`;

    dapp.createReport({payload: hexPayload});
    throw new Error("Challenge not found");
  }

  if(!commitment) {
    const buffer = Buffer.from("Commitment not found", "utf-8");
    const hexPayload: Hex = `0x${buffer.toString("hex")}`;

    dapp.createReport({payload: hexPayload});
    throw new Error("Commitment not found");
  }

  const sender:string = req.headers['x-msg_sender'] as string;

  if(playerChallenges.get(sender)) {
    const buffer = Buffer.from("Player is already in a challenge", "utf-8");
    const hexPayload: Hex = `0x${buffer.toString("hex")}`;

    dapp.createReport({payload: hexPayload});
    throw new Error("Player is already in a challenge");
  }

  challenge.addOponent(sender, commitment);
  playerChallenges.set(sender, parseInt(challengeId));

  const buffer = Buffer.from(`challenge with id ${challengeId} was accepted by ${sender}`, "utf-8");
  const hexPayload: Hex = `0x${buffer.toString("hex")}`;

  dapp.createNotice({payload: hexPayload});

  res.send({status: "ACCEPTED"})
})

app.post("/revealMove", (req:Request, res:Response) => {
  console.log("Request received to revel move");

  const payload = req.body

  const nonce = payload.nonce;
  const move = payload.move

  const sender:string = req.headers['x-msg_sender'] as string;

  const challengeId = playerChallenges.get(sender)

  if(challengeId == undefined) {
    throw new Error("Challenge not found")
  }

  const challenge:Challenge = challenges.get(challengeId.toString()) as Challenge

  try {
    challenge.reveal(sender, move, nonce)

    if (challenge.bothRevealed()) {
      const winner = challenge.evaluateWinner()

      if(!winner) {
        const buffer = Buffer.from(`challenge ${challengeId} ended in a draw`, "utf-8");
        const hexPayload: Hex = `0x${buffer.toString("hex")}`;
      
        dapp.createNotice({payload: hexPayload});
      }else {
        const buffer = Buffer.from(`challenge ${challengeId} was won by ${winner}`, "utf-8");
        const hexPayload: Hex = `0x${buffer.toString("hex")}`;
      
        dapp.createNotice({payload: hexPayload});
      }

      if (playerChallenges.get(challenge?.oponentAddress as string)) {
        playerChallenges.delete(challenge?.oponentAddress as string)
      }

      if (playerChallenges.get(challenge?.creatorAddress as string)) {
          playerChallenges.delete(challenge?.creatorAddress as string)
      }
    }

    return res.send({status: "REVEALED"})
  } catch(e) {
    console.log("Error is ", e)
    throw new Error("Error")
  }
})




app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
