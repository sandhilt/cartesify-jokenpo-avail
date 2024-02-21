import './App.css'

import { Cartesify } from "@calindra/cartesify";
import { BrowserProvider } from 'ethers';
import { useEffect, useState } from 'react';
import ListChallenges from './ListChallenges';
import { Eip1193Provider } from 'ethers';
import CreateChallenge from './CreateChallenge';

type EthereumFromWindow = import("ethers").Eip1193Provider & import("ethers").AbstractProvider;
declare global {
  interface Window {
    /** @link {https://docs.metamask.io/wallet/reference/provider-api/} */
    ethereum?: // import("@ethersproject/providers").ExternalProvider &
    EthereumFromWindow;
  }
}

// replace with the content of your dapp address (it could be found on dapp.json)
const fetch = Cartesify.createFetch({
  dappAddress: '0x70ac08179605AF2D9e75782b8DEcDD3c22aA4D0C',
  endpoints: {
    graphQL: new URL("http://localhost:8080/graphql"),
    inspect: new URL("http://localhost:8080/inspect"),
  },
})

function App() {
  const [signer, setSigner] = useState<any>(undefined)

    useEffect(() => {
        try {
          if (!window.ethereum) {
            alert("Connecting to metamask failed.");
            return
          }

          window.ethereum.request({ method: "eth_requestAccounts" })
          .then(async () => {
            const provider = new BrowserProvider(window.ethereum as Eip1193Provider);
            const signer = await provider.getSigner();
            setSigner(signer);
          })
      
        } catch(error) {
          console.log(error);
          alert("Connecting to metamask failed.");
        }
  
    }, [])

  return (
    <div className="App">
       <div>
            <CreateChallenge signer={signer} />
        </div>
        <div>   
            <ListChallenges signer={signer} />
        </div>
    </div>
  )
}

export default App
