import { NONCE_KEY, MOVE_KEY } from "./constants"

export async function generateHash(input) {
    const encoder = new TextEncoder()
    const data = encoder.encode(input)
    const hashBuffer = await crypto.subtle.digest("SHA-256", data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("")
    return hashHex
}

export const generateCommitment = async (choice, signer) => {
    const address = await signer.getAddress()

    const nonce = Math.random() * 1000
    localStorage.setItem(NONCE_KEY + address.toLowerCase(), nonce.toString())
    localStorage.setItem(MOVE_KEY + address.toLowerCase(), choice)

    const commitment = await generateHash(nonce.toString() + choice)
    return commitment
}

