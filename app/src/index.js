import "./app.css";
import Web3 from "web3";
import randomGraphTokenArtifact from "../../build/contracts/RandomGraphToken.json";
import simpleExchangeArtifact from "../../build/contracts/SimpleExchange.json";
const ipfsAPI = require('ipfs-http-client');
const ipfs = ipfsAPI({ host: 'ipfs.infura.io', port: '5001', protocol: 'https' });

const App = {
    web3: null,
    account: null,
    randomGraphToken: null,
    simpleExchange: null,
    contractAddress: null,
    start: async function () {
        const { web3 } = this
        try {
            const networkId = await web3.eth.personal.net.getId();
            var deployedNetwork = randomGraphTokenArtifact.networks[networkId];
            this.contractAddress = deployedNetwork.address;
            this.randomGraphToken = new web3.eth.Contract(
                randomGraphTokenArtifact.abi,
                deployedNetwork && deployedNetwork.address,
            );
            deployedNetwork = simpleExchangeArtifact.networks[networkId];
            this.exchangeAddress = deployedNetwork.address;
            this.simpleExchange = new web3.eth.Contract(
                simpleExchangeArtifact.abi,
                deployedNetwork && deployedNetwork.address,
            );
            // get accounts
            const accounts = await web3.eth.getAccounts();
            this.account = accounts[0];
        } catch (error) {
            console.log(error);
            console.error("Could not connect to contract or chain.");
            return;
        }
        App.renderAllTokens();
    },
    renderAllTokens: async function () {
        await App.renderExchangeDetails();
        const { web3 } = this;
        try {
            if (new URLSearchParams(window.location.search).get('filter') === 'owned') {
                const { balanceOf } = this.randomGraphToken.methods;
                var balance = await balanceOf(this.account).call();
                if (balance == 0) {
                    $("#nft-list").addClass("alert alert-danger").html("You don't have any tokens. Create one now!");
                } else {
                    for (var i = 0; i < balance; i++) {
                        const { tokenOfOwnerByIndex } = this.randomGraphToken.methods;
                        var id = await tokenOfOwnerByIndex(this.account, i).call();
                        const { tokenURI } = this.randomGraphToken.methods;
                        var uri = await tokenURI(id).call();
                        setTimeout(function () {
                            $.getJSON(uri, function (data) {
                                App.renderToken(id, data, uri);
                            });
                        }, 3000);
                    }
                }
            } else {
                $("#approve-div").hide();
                const { totalSupply } = this.randomGraphToken.methods;
                var numberOfNFTs = await totalSupply().call();
                for (var i = 0; i < numberOfNFTs; i++) {
                    const { tokenByIndex } = this.randomGraphToken.methods;
                    var id = await tokenByIndex(i).call();
                    const { tokenURI } = this.randomGraphToken.methods;
                    var uri = await tokenURI(id).call();
                    setTimeout(function () {
                        $.getJSON(uri, function (data) {
                            App.renderToken(id, data, uri);
                        });
                    }, 3000);
                }
            }
        } catch (err) {
            console.log("ERR", err)
        }

    },
    renderExchangeDetails: async function () {
        const { web3 } = this;
        const { isApprovedForAll } = this.randomGraphToken.methods;
        var approved = await isApprovedForAll(this.account, App.simpleExchange._address).call();
        if (approved == true) {
            $("#msg").addClass("alert alert-success").html("You have approved the exchange to sell tokens on your behalf!");
            $("#approve-div").hide();
        } else {
            $("#msg").addClass("alert alert-danger").html("Approve the exchange to sell tokens on your behalf");
        }
    },
    //  $("#approve").click(setApproval);
    setApproval: async function () {
        const { web3 } = this;
        const { setApprovalForAll } = this.randomGraphToken.methods;
        await setApprovalForAll(App.simpleExchange._address, true).send({ gas: 4700000, from: this.account });
        alert("You have successfully approved the exchange to sell tokens on your behalf!");
        location.reload();
    },
    renderToken: async function (tokenId, metaData, uri) {
        var node = $("<div/>");
        node.addClass("col-sm-3 text-center col-margin-bottom-1 product");
        node.append("<img src='" + metaData.properties.image.description + "' />");
        node.append("<a href='" + metaData.properties.image.description + "' target='_blank'>Full Size");
        node.append("<br>");
        node.append("<a href='" + uri + "' target='_blank'>Metadata");
        const { isApprovedForAll } = this.randomGraphToken.methods;
        var approved = await isApprovedForAll(this.account, App.simpleExchange._address).call();
        if (approved == true) {
            await App.renderPriceBox(tokenId, node);
        }
        else {
            const { listingPrice } = this.simpleExchange.methods;
            var result = await listingPrice(tokenId).call();
            if (result > 0) {
                App.renderPurchaseButton(tokenId, node);
            }
        }
        $("#nft-list").append(node);
    },

    renderPurchaseButton: async function (tokenId, node) {
        const { web3 } = this;
        const { listingPrice } = this.simpleExchange.methods;
        var price = await listingPrice(tokenId).call();
        var etherPrice = web3.utils.fromWei(price, 'ether');
        node.append("<div><a href='#'class='btn btn-primary buy-token' onclick='App.buyToken(" + tokenId + "," + price + "); return false;' data-token" + tokenId + "data-price" + price + ">Buy for" + etherPrice + "Ether</a></div>");
    },
    buyToken: async function (tokenId, price) {
        const { web3 } = this; const { buyToken } = this.simpleExchange.methods; await buyToken(tokenId).send({ gas: 4700000, value: price, from: this.account }); alert("You have successfully purchased the NFT!"); location.reload("/");
    },
    renderPriceBox: async function (tokenId, node) {
        const { web3 } = this;
        const { listingPrice } = this.simpleExchange.methods;
        var result = await listingPrice(tokenId).call();
        if (result > 0) {
            var price = await listingPrice(tokenId).call();
            node.append("<div>Token sale for " + web3.utils.fromWei(price, 'ether') + " Ether");
        } else {
            node.append("<div><input id='token-" + tokenId + "' placeholder='0.1'><a href='#' class='btn btn-primary list-token' onclick='App.listToken(" + tokenId + "); return false;' data-token='" + tokenId + "'>List for Sale");
        }
    },

    listToken: async function (tokenId) {
        const { web3 } = this;
        const { listToken } = App.simpleExchange.methods;
        var price = $("#token-" + tokenId).val();
        await listToken(tokenId, web3.utils.toWei(price, 'ether')).send({ gas: 4700000, from: this.account });
        alert("Your NFT has been listed for sale!");
        location.reload("/");
    },

    createNFT: async function () {
        var blob = saveSVG();
        console.log(blob);
        var reader = new window.FileReader();
        reader.readAsArrayBuffer(blob);
        setTimeout(function () {
            var val = Buffer.from(reader.result);
            const data = { path: 'graph.svg', content: val }
            ipfs.add(data, { wrapWithDirectory: true })
                .then((response) => {
                    console.log(response, response.cid.string);
                    App.uploadJSONMetaData("https://ipfs.io/ipfs/" + response.cid.string + "/graph.svg");
                })
        }, 5000);
    },


    uploadJSONMetaData: async function (imageURL) {
        let jsonData = {
            "title": "Asset Metadata",
            "type": "object",
            "properties": {
                "name": {
                    "type": "string",
                    "description": "Random Graph Token"
                },
                "description": {
                    "type": "string",
                    "description": "NFT to represent Random Graph"
                },
                "image": {
                    "type": "string",
                    "description": imageURL
                }
            }
        }
        ipfs.add(Buffer.from(JSON.stringify(jsonData))).then(function (value) {
            console.log("hash", value, value.path);
            App.createToken("https://ipfs.io/ipfs/" + value.path);
        });
    },

    createToken: async function (metaDataURL) {
        const { web3 } = this;
        var attributes = App.parseGraphAttributes();
        const { createUniqueArt } = this.randomGraphToken.methods;
        createUniqueArt(web3.utils.asciiToHex(attributes.graphType), attributes.charge, attributes.linkDistance,
            attributes.graphVars, metaDataURL).send({ gas: 4700000, from: this.account });
        console.log("Token successfully created");
    },

    parseGraphAttributes: function () {
        var e = document.getElementById("graph-type");
        var graphType = e.options[e.selectedIndex].value;
        var charge = $("#charge-dist").html();
        var linkDistance = $("#link-dist").html();
        var textFields = $("#params input");
        var r = 0;
        var h = 0;
        var n = 0;
        var mo = 0;
        var m = 0;
        var p = 0;
        var k = 0;
        var alpha = 0;
        var beta = 0;

        if (graphType == 'BalancedTree') {
            r = parseInt(textFields[0].value);
            h = parseInt(textFields[1].value);
        } else if (graphType == 'BarabasiAlbert') {
            n = parseInt(textFields[0].value);
            mo = parseInt(textFields[1].value);
            m = parseInt(textFields[2].value);
        } else if (graphType == 'ErdosRenyi.np') {
            n = parseInt(textFields[0].value);
            p = parseInt(textFields[1].value);
        } else if (graphType == 'ErdosRenyi.nm') {
            n = parseInt(textFields[0].value);
            m = parseInt(textFields[1].value);
        } else if (graphType == 'WattsStrogatz.alpha') {
            n = parseInt(textFields[0].value);
            k = parseInt(textFields[1].value);
            alpha = parseInt(textFields[2].value);
        } else if (graphType == 'WattsStrogatz.beta') {
            n = parseInt(textFields[0].value);
            k = parseInt(textFields[1].value);
            beta = parseInt(textFields[2].value);
        }
        return {
            graphType: graphType,
            charge: charge,
            linkDistance: linkDistance,
            graphVars: [r, h, n, mo, m, p, k, alpha, beta]
        }
    }
};

window.App = App;

window.addEventListener("load", async function () {
    if (window.ethereum) {
        const web3 = new Web3(window.ethereum);
        try {
            // Request account access if needed
            await window.ethereum.enable();
            // Acccounts now exposed
            App.web3 = web3;
        } catch (error) {
            console.log("Error in window.ethereum")
            console.log(error);
        }
    }
    // Legacy dapp browsers...
    else if (window.web3) {
        // Use Mist/MetaMask's provider.
        const web3 = window.web3;
        console.log("Injected web3 detected.");
        App.web3 = web3;
    }
    // Fallback to localhost; use dev console port by default...
    else {
        const provider = new Web3.providers.HttpProvider(
            "https://rpc-mumbai.matic.today"
        );
        const web3 = new Web3(provider);
        console.log("No web3 instance injected, using Local web3.");
        App.web3 = web3;
    }

    await App.start();
});