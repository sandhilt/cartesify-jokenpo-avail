import React, {useState} from "react";
import {Button, useToast, Select, Heading} from '@chakra-ui/react'
import { generateCommitment } from "./util"
import { Cartesify } from "@calindra/cartesify";

const fetch = Cartesify.createFetch({
    dappAddress: '0x70ac08179605AF2D9e75782b8DEcDD3c22aA4D0C',
    endpoints: {
      graphQL: new URL("http://localhost:8080/graphql"),
      inspect: new URL("http://localhost:8080/inspect"),
    },
  })

function CreateChallenge ({signer}) {
    const [choice, setChoice] = useState<number>(1)
    const [loading, setLoading] = useState(false)
    const toast = useToast()

    async function createChallenge() {
        const commitment = await generateCommitment(choice, signer)

        toast({
            title: "Transaction sent",
            description: "waiting for confirmation",
            status: "success",
            duration: 9000,
            isClosable: true,
            position: "top-left"
        })

        const response = await fetch("http://127.0.0.1:8383/createChallenge", {
            method: "POST",
            headers: {
                    "Content-Type": "application/json",
            },
            body: JSON.stringify({ commitment }),
            signer 
        })

        if(response.ok) {
            toast({
                title: "Confirmed",
                description: `Challenge created successfully`,
                status: "success",
                duration: 9000,
                isClosable: true,
                position: "top-left"
            })
        } else {
            toast({
                title: "Error",
                description: `Challenge was not created`,
                status: "error",
                duration: 9000,
                isClosable: true,
                position: "top-left"
            })
        }

        let results = await response.json();
        console.log(results) // will print the backend response as json
        

    }

    async function handleSubmit(event) {
        event.preventDefault()
        setLoading(true)
        await createChallenge()
        setLoading(false)
    }

    let buttonProps:any = {}
    if(loading) buttonProps.isLoading = true

    return (<div className="challendeForm">

        <form onSubmit={handleSubmit}>
            <Heading size="lg">CreateChallenge</Heading>
            <div>
                <label>Choice</label>
                <Select
                    focusBorderColor="yellow"
                    size="md"
                    value={choice}
                    onChange={(event) => setChoice(parseInt(event.target.value))}
                >
                    <option value="1">ROCK</option>
                    <option value="2">PAPER</option>
                    <option value="3">SCISSORS</option>
                </Select>
            </div>
            <Button {...buttonProps} type="submit" colorScheme={"yellow"}>
                Create Challenge
            </Button>
        </form>
    </div>)
}

export default CreateChallenge