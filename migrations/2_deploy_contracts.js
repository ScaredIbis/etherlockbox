var EtherLockBox = artifacts.require("./EtherLockBox.sol");

module.exports = function(deployer) {
  deployer.deploy(EtherLockBox);
};
