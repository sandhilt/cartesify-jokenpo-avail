import type { BinaryLike } from 'crypto';
import * as crypto from 'crypto';

export class Challenge {
    creatorAddress: string
    oponentAddress?: string
    id: number
    createdAt: string
    winnerAddress?: string
    commitments = new Map<string, Move>();

    constructor(id: number, creatorAddress: string, commitment: string) {
        this.creatorAddress = creatorAddress;
        this.id = id;
        this.commitments.set(creatorAddress, new Move(commitment))
        this.createdAt = new Date().toISOString();
    }

    addOponent = (address: string, commitment: string) => {
        console.log("Adding opponent")
        this.oponentAddress = address
        this.commitments.set(address, new Move(commitment))
    }

    bothRevealed = () => {
        const opponentMove = this.commitments.get(this.oponentAddress as string)?.move;
        const creatorMove = this.commitments.get(this.creatorAddress as string)?.move;

        return opponentMove && creatorMove && opponentMove !== 0 && creatorMove !== 0;
    }

    reveal = (address: string, move: string, nonce: string) => {
        if (!this.commitments.get(this.oponentAddress as string)) {
            throw new Error("Opponent has not commited yet")
        }

        const revealHash = this.generateHash(nonce + move);

        const commitedMove = this.commitments.get(address)

        if (commitedMove?.commitment?.toString() !== revealHash) {
            throw new Error("Move does not match the commitment")
        }

        commitedMove.move = parseInt(move)

        this.commitments.set(address, commitedMove);
    }

    generateHash = (hash: BinaryLike) => {
        const revealedHash = crypto.createHash('sha256').update(hash).digest('hex');
        return revealedHash
    }

    evaluateWinner = () => {
        const opponentMove = this.commitments.get(this.oponentAddress as string)?.move
        const creatorMove = this.commitments.get(this.creatorAddress)?.move


        if (creatorMove === 1 && opponentMove === 3) {
            this.winnerAddress = this.creatorAddress
        } else if (creatorMove === 3 && opponentMove === 1) {
            this.winnerAddress = this.oponentAddress
        } else if (creatorMove === 3 && opponentMove === 2) {
            this.winnerAddress = this.creatorAddress
        } else if (creatorMove === 2 && opponentMove === 3) {
            this.winnerAddress = this.oponentAddress
        } else if (creatorMove === 2 && opponentMove === 1) {
            this.winnerAddress = this.creatorAddress
        } else if (creatorMove === 1 && opponentMove === 2) {
            this.winnerAddress = this.oponentAddress
        }

        return this.winnerAddress;
    }
}

export class Move {
    NONE: number = 0;
    ROCK: number = 1;
    PAPER: number = 2;
    SCISSORS: number = 3;

    commitment: string;
    move: number = 0;

    constructor(commitment: string, move: number = 0) {
        this.commitment = commitment;
        this.move = move;
    }

}