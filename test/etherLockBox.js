const EtherLockBox = artifacts.require("./EtherLockBox.sol");

contract("EtherLockBox", accounts => {
  it("should create a new lockbox", async () => {
    // const etherLockBoxInstance = await EtherLockBox.deployed();

    // // Set value of 89
    // await etherLockBoxInstance.createLockBox(
    //   0x00,
    //   0x00,
    //   0x01
    //   { from: accounts[0] }
    // );

    // // Get stored value
    // const storedData = await etherLockBoxInstance.get.call();

    // assert.equal(storedData, 89, "The value 89 was not stored.");
  });
});
