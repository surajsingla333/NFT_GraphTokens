const RandomGraphToken = artifacts.require("./RandomGraphToken");
const SimpleExchange = artifacts.require("./SimpleExchange");

module.exports = function(deployer) {
  deployer.deploy(RandomGraphToken).then(function(f){
    return deployer.deploy(SimpleExchange, RandomGraphToken.address);
  });
};

