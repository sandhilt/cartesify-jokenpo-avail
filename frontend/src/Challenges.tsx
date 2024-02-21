import {useState} from "react";
import { useToast, Heading, Select, Button } from "@chakra-ui/react";
import { generateCommitment } from "./util";
import { Cartesify } from "@calindra/cartesify";
import { MOVE_KEY, NONCE_KEY } from "./constants";

const fetch = Cartesify.createFetch({
    dappAddress: '0x70ac08179605AF2D9e75782b8DEcDD3c22aA4D0C',
    endpoints: {
      graphQL: new URL("http://localhost:8080/graphql"),
      inspect: new URL("http://localhost:8080/inspect"),
    },
  })

function Challenges({challenges, address, signer, showAccept=false}) {
    const toast = useToast()
    const [choice, setChoice] = useState(1)
    const [acceptLoading, setAcceptLoading] = useState(false)
    const [revealLoading, setRevealLoading] = useState(false)


    const isAddressUser = (addr) => {
        if(addr === address) {
            return <strong style={{color: "green"}}>You</strong>
        } else {
            return <strong style={{color: "red"}}>Opponent</strong>
        }
    }

    const moveToString = (move) => {
        return {
            0: "HIDDEN",
            1: "ROCK",
            2: "PAPER",
            3: "SCISSORS"
        }[move]
    }

    const showReveal = (challenge) => {
        if(challenge.opponent === address && challenge.opponent_move !== 0) return false;
        if(challenge.creator === address && challenge.creator_move !== 0) return false;

        return (
            challenge.opponent_move !== undefined &&
            challenge.creator_move !== undefined &&
            !challenge.winner
        )
        
    }

    const revealMove = async () => {
        const nonce = localStorage.getItem(NONCE_KEY + address)
        const move = localStorage.getItem(MOVE_KEY + address)

        toast({
            title: "Transaction sent",
            description: "waiting for confirmation",
            status: "success",
            duration: 9000,
            isClosable: true,
            position: "top-left"
        })

        setRevealLoading(true);

        const response = await fetch("http://127.0.0.1:8383/revealMove", {
            method: "POST",
            headers: {
                    "Content-Type": "application/json",
            },
            body: JSON.stringify({ nonce, move }),
            signer 
        })

        setRevealLoading(false);

        if(response.ok) {
            toast({
                title: "Confirmed",
                description: `Move Revealed successfully`,
                status: "success",
                duration: 9000,
                isClosable: true,
                position: "top-left"
            })
        } else {
            toast({
                title: "Error",
                description: `Move was not revealed`,
                status: "error",
                duration: 9000,
                isClosable: true,
                position: "top-left"
            })
        }

    }

    const acceptChallenge = async (id) => {
        const commitment = await generateCommitment(choice, signer)

        toast({
            title: "Transaction sent",
            description: "waiting for confirmation",
            status: "success",
            duration: 9000,
            isClosable: true,
            position: "top-left"
        })

        setAcceptLoading(true);

        const response = await fetch("http://127.0.0.1:8383/acceptChallenge", {
            method: "POST",
            headers: {
                    "Content-Type": "application/json",
            },
            body: JSON.stringify({ commitment, challengeId: id }),
            signer 
        })

        setAcceptLoading(false);

        if(response.ok) {
            toast({
                title: "Confirmed",
                description: `Challenge accepted successfully`,
                status: "success",
                duration: 9000,
                isClosable: true,
                position: "top-left"
            })
        } else {
            toast({
                title: "Error",
                description: `Challenge was not accepted`,
                status: "error",
                duration: 9000,
                isClosable: true,
                position: "top-left"
            })
        }
        
    }

    const challengeDone = (challenge) => {
        return challenge.winner != undefined || (challenge.opponent_move !== '0' && challenge.creator_move !== '0')
    }

    let buttonAcceptProps:any = {}
    if(acceptLoading) buttonAcceptProps.isLoading = true

    let buttonRevealProps:any = {}
    if(revealLoading) buttonRevealProps.isLoading = true

    return (
        <div className="challenges">
            { 
                challenges.map( (challenge) => {

                    let data = {
                        opponentMove: "",
                        yourMove: "",
                        opponent: ""
                    }


                    if(challenge.creator === address) {
                        data = {
                            opponentMove: challenge.opponent_move,
                            yourMove: challenge.creator_move,
                            opponent: challenge.opponent
                        }
                    } else {
                        data = {
                            opponentMove: challenge.creator_move,
                            yourMove: challenge.opponent_move,
                            opponent: challenge.creator
                        }
                    }

                    return <div className="challenge" key={challenge.challenge_id}>
                        <Heading>Challenge #{challenge.challenge_id}</Heading>
                        {data.opponent && (
                            <p><strong>Opponent</strong>: {data.opponent}</p>
                        )}

                        {challenge.winner && (
                            <p><strong>Winner</strong>: {isAddressUser(challenge.winner)}</p>
                        )}

                        {!challenge.winner && challengeDone(challenge) && (
                            <p><strong>Result</strong>: <strong style={{color: "yellow"}}>Draw</strong></p>
                        )}

                        { data.opponentMove != undefined && (
                            <p><strong>Opponent Move: </strong>{" "}{moveToString(data.opponentMove)}</p>
                        )}


                        { data.yourMove != undefined && (
                            <p><strong>Your Move: </strong>{" "}{moveToString(data.yourMove)}</p>
                        )}

                        { showReveal(challenge) ?
                         <Button {...buttonRevealProps} colorScheme="green" onClick={() => revealMove()} >Reveal Move</Button>
                        : !challengeDone(challenge) ? <p>Waiting ...</p> : <></>
                        }

                        { showAccept && <>
                            <Select focusBorderColor="yellow"
                             size="md" 
                             value={choice}
                             onChange={(e) => setChoice(parseInt(e.target.value))}>
                    <option value="1">ROCK</option>
                    <option value="2">PAPER</option>
                    <option value="3">SCISSORS</option>
                            </Select>
                            <Button {...buttonAcceptProps} onClick={() => {acceptChallenge(challenge.challenge_id)}} colorScheme="green">
                                Accept Challenge
                            </Button>
                        </>}

                    </div>
                })
                
        
            }
        </div>
    )
}

export default Challenges