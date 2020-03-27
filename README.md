# NFT_GraphTokens
This project is about building non-funigible ERC720 tokens. 
The tokens are representd as unique graphs which are built using D3.JS and the token's meta data and full image is stored in IPFS.

Once the user creates a NFT token, he will have to approve the exchange (market) to sell tokens on his behalf. After approving, he can then set 
price for his tokens. Once the proces are set, the tokens will be listed on the market (dashboard) where any other user can buy those tokens for the mentioned price.

Buy/selling means changing the ownership of the tokens.

I have used matic protocol to make transaction much faster and gas efficient (0 in function calls). You will need to change the gas price to 0 to make the transactions free of gas.

## Contract Deployed on matic testnet :  `https://testnetv3.matic.network`

RandomGraphToken contract address :  `0x58A21f7aA3D9D83D0BD8D4aDF589626D13b94b45`

SimpleExchange contract address : `0xA46E01606f9252fa833131648f4D855549BcE9D9`

Live Demo : `https://non-fungible-token.netlify.com/`

Use metamask to connect with the app. Set RPC to matic testnet.
