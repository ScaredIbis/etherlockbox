const truffleAssert = require("truffle-assertions");
const { assert } = require("chai");
const EtherLockBox = artifacts.require("./EtherLockBox.sol");
const BN = web3.utils.BN;

contract("EtherLockBox", accounts => {
  const defaultLockBoxArgs = [
    "0x0123",
    "0x0123456789",
    "0x01805dc8973ad04df3f1195bda4e1a00894dbedce0288eb8c6a3bf8d228616489e",
    1,
    2,
    false,
    { from: accounts[0], value: 1000 }
  ];

  it("creates a new lockBox", async () => {
    const etherLockBoxInstance = await EtherLockBox.new();

    await advanceBlock()

    await etherLockBoxInstance.createLockBox(...defaultLockBoxArgs)

    const newLockBox = await etherLockBoxInstance.getLockBox("0x0123");

    const {
      createdAt,
      owner,
      redeemableBy,
      unlockedAt,
      unlockingPeriod,
      value,
      hints,
      answers,
      numAnswersRequired,
      spendableOnceUnlocked,
    } = newLockBox;

    assert.equal(createdAt, 7, "createdAt was not set correctly");
    assert.equal(owner, accounts[0], "owner was not set correctly");
    assert.equal(redeemableBy, 0, "redeemableBy was set incorrectly");
    assert.equal(unlockedAt, 0, "unlockedAt was set incorrectly");
    assert.equal(unlockingPeriod, 2, "unlockingPeriod was not set correctly");
    assert.equal(value, 1000, "value was not set correctly");
    assert.equal(hints, "0x0123456789", "hints was not set correctly");
    assert.equal(
      answers,
      "0x01805dc8973ad04df3f1195bda4e1a00894dbedce0288eb8c6a3bf8d228616489e",
      "answers was not set correctly"
    );
    assert.equal(numAnswersRequired, 1, "numAnswersRequired was not set correctly");
    assert.equal(spendableOnceUnlocked, false, "spendableOnceUnlocked was not set correctly");
  });

  it("prevents duplicate lockBox id's", async () => {
    const etherLockBoxInstance = await EtherLockBox.new();

    await etherLockBoxInstance.createLockBox(...defaultLockBoxArgs)

    await truffleAssert.reverts(
      etherLockBoxInstance.createLockBox(...defaultLockBoxArgs),
      "lockBox with this id already exists"
    );
  });

  it("retrieves a non-existent lockBox", async () => {
    const etherLockBoxInstance = await EtherLockBox.new();

    const nonExistentLockBox = await etherLockBoxInstance.getLockBox("0x00");

    const {
      createdAt,
      owner,
      redeemableBy,
      unlockedAt,
      unlockingPeriod,
      value,
      hints,
      answers,
      numAnswersRequired,
      spendableOnceUnlocked,
    } = nonExistentLockBox;

    assert.equal(createdAt, 0, "createdAt had a non-zero value");
    assert.equal(owner, 0, "owner had a non-zero value");
    assert.equal(redeemableBy, 0, "redeemableBy had a non-zero value");
    assert.equal(unlockedAt, 0, "unlockedAt had a non-zero value");
    assert.equal(unlockingPeriod, 0, "unlockingPeriod had a non-zero value");
    assert.equal(value, 0, "value had a non-zero value");
    assert.equal(hints, null, "hints had a non-zero value");
    assert.equal(answers, null, "answers had a non-zero value");
    assert.equal(numAnswersRequired, 0, "numAnswersRequired had a non-zero value");
    assert.equal(spendableOnceUnlocked, false, "spendableOnceUnlocked had a non-zero value");
  });

  it("prevents adding value to a non-existent lockBox", async () => {
    const etherLockBoxInstance = await EtherLockBox.new();

    await truffleAssert.reverts(
      etherLockBoxInstance.addValue("0x123", { from: accounts[0], value: 1000 }),
      "lockBox does not exist"
    );
  });

  it("adds value to an existing lockBox", async () => {
    const etherLockBoxInstance = await EtherLockBox.new();

    await etherLockBoxInstance.createLockBox(...defaultLockBoxArgs)

    await etherLockBoxInstance.addValue(defaultLockBoxArgs[0], { from: accounts[0], value: 1000 });

    const lockBox = await etherLockBoxInstance.getLockBox(defaultLockBoxArgs[0]);

    assert.equal(lockBox.value, 2000, "value was not added to lockBox")
  });

  it("prevents spending from an unlocked lockBox when spendableOnceUnlocked is false", async () => {
    const etherLockBoxInstance = await EtherLockBox.new();

    await etherLockBoxInstance.createLockBox(...defaultLockBoxArgs)

    await etherLockBoxInstance.unlockLockBox(
      defaultLockBoxArgs[0],
      "0x9c22ff5f21f0b81b113e63f7db6da94fedef11b2119b4088b89664fb9a3cb658"
    );

    await advanceBlock();

    await truffleAssert.reverts(
        etherLockBoxInstance.spendFromLockBox(defaultLockBoxArgs[0], 1000, accounts[0], { from: accounts[0] }),
      "this lockBox cannot be spent from after it is unlocked"
    );
  });


  it("prevents non-owners from spending from a lockBox", async () => {
    const etherLockBoxInstance = await EtherLockBox.new();

    await etherLockBoxInstance.createLockBox(...defaultLockBoxArgs)

    await truffleAssert.reverts(
      etherLockBoxInstance.spendFromLockBox(defaultLockBoxArgs[0], 1000, accounts[1], { from: accounts[1] }),
      "only the owner can spend from a lockBox"
    );
  });

  it("prevents spending more from a lockBox than the lockBox value", async () => {
    const etherLockBoxInstance = await EtherLockBox.new();

    await etherLockBoxInstance.createLockBox(...defaultLockBoxArgs)

    await truffleAssert.reverts(
      etherLockBoxInstance.spendFromLockBox(defaultLockBoxArgs[0], 2000, accounts[0], { from: accounts[0] }),
      "not enough value in lockBox"
    );
  });

  it("allows spending from a locked lockBox when spendableOnceUnlocked is false", async () => {
    const etherLockBoxInstance = await EtherLockBox.new();

    await etherLockBoxInstance.createLockBox(...defaultLockBoxArgs)

    const balanceBefore = await web3.eth.getBalance(accounts[1]);

    await etherLockBoxInstance.spendFromLockBox(defaultLockBoxArgs[0], 500, accounts[1], { from: accounts[0] });

    const lockBox = await etherLockBoxInstance.getLockBox(defaultLockBoxArgs[0]);
    const balanceAfter = await web3.eth.getBalance(accounts[1]);

    assert.equal(lockBox.value, 500, "spent value was not deducted from lockBox")
    assert.equal(new BN(balanceAfter).sub(new BN(balanceBefore)), 500, "recipient did not receive payment");
  });

  it("allows spending from an unlocked lockBox when spendableOnceUnlocked is true", async () => {
    const etherLockBoxInstance = await EtherLockBox.new();

    // set spendableOnceUnlocked true
    const args = [...defaultLockBoxArgs];
    args[defaultLockBoxArgs.length - 2] = true;

    await etherLockBoxInstance.createLockBox(...args)

    await etherLockBoxInstance.unlockLockBox(
      defaultLockBoxArgs[0],
      "0x9c22ff5f21f0b81b113e63f7db6da94fedef11b2119b4088b89664fb9a3cb658"
    );

    await advanceBlock();

    const balanceBefore = await web3.eth.getBalance(accounts[1]);

    await etherLockBoxInstance.spendFromLockBox(args[0], 500, accounts[1], { from: accounts[0] });

    const lockBox = await etherLockBoxInstance.getLockBox(defaultLockBoxArgs[0]);
    const balanceAfter = await web3.eth.getBalance(accounts[1]);

    assert.equal(lockBox.value, 500, "spent value was not deducted from lockBox")
    assert.equal(new BN(balanceAfter).sub(new BN(balanceBefore)), 500, "recipient did not receive payment");
  });

  it("prevents unlocking a non-existent lockBox", async () => {
    const etherLockBoxInstance = await EtherLockBox.new();

    await truffleAssert.reverts(
      etherLockBoxInstance.unlockLockBox(
        defaultLockBoxArgs[0],
        "0x9c22ff5f21f0b81b113e63f7db6da94fedef11b2119b4088b89664fb9a3cb658"
      ),
      "lockBox does not exist"
    );
  });

  it("prevents unlocking a lockBox which is already unlocked", async () => {
    const etherLockBoxInstance = await EtherLockBox.new();

    await etherLockBoxInstance.createLockBox(...defaultLockBoxArgs)

    // unlock it as account 0
    await etherLockBoxInstance.unlockLockBox(
      defaultLockBoxArgs[0],
      "0x9c22ff5f21f0b81b113e63f7db6da94fedef11b2119b4088b89664fb9a3cb658",
      { from: accounts[0] }
    );

    await advanceBlock();

    await truffleAssert.reverts(
      etherLockBoxInstance.unlockLockBox(
        defaultLockBoxArgs[0],
        "0x9c22ff5f21f0b81b113e63f7db6da94fedef11b2119b4088b89664fb9a3cb658",
        { from: accounts[1] }
      ),
      "lockBox is already unlocked"
    );
  });

  it("does not unlock a lockBox if not enough correct answers are provided", async () => {
    const etherLockBoxInstance = await EtherLockBox.new();

    await etherLockBoxInstance.createLockBox(...defaultLockBoxArgs)

    await truffleAssert.reverts(
      etherLockBoxInstance.unlockLockBox(
        defaultLockBoxArgs[0],
        "0x9c22ff5f21f0b81b113e63f7db6da94fedef11b2119b4088b89664fb9a3cb655"
      ),
      "not enough correct answers"
    );
  });

  it("unlocks a lockBox if enough correct answers are provided", async () => {
    const etherLockBoxInstance = await EtherLockBox.new();

    const unlockingPeriod = 3;
    await etherLockBoxInstance.createLockBox(
      "0x0123",
      "0x0123456789",
      "0x03009371045a3a6b823569d2dcdadeab27c8e4a58222658cb482e46ec689151ea3"+ // dog
      "b2311223dce89420ba2e9492e1c68fc01cf84fb4a419ea9e71f6fe5a9ce30e48"+ // car
      "89859628ea9579938ef099ddc022231afe8ad583bff8a7f3e13b29a2d6d9bbca", // school
      2,
      unlockingPeriod,
      false,
      { from: accounts[0], value: 1000 }
    )

    const currentBlockNumber = await web3.eth.getBlockNumber();

    await etherLockBoxInstance.unlockLockBox(
      defaultLockBoxArgs[0],
      "0x41791102999c339c844880b23950704cc43aa840f3739e365323cda4dfa89e7a"+ // dog
      "52763589e772702fa7977a28b3cfb6ca534f0208a2b2d55f7558af664eac478a"+ // cat
      "5bc534741144677435544dbab077ee677cce543955e026b74bd7a04ccb945123", // school
      { from: accounts[1] }
    );

    const lockBox = await etherLockBoxInstance.getLockBox("0x0123");

    assert.equal(
      new BN(lockBox.unlockedAt),
      currentBlockNumber + 1 + unlockingPeriod,
      "lockBox was not unlocked at the right block"
    );
    assert.equal(lockBox.redeemableBy, accounts[1], "lockBox redeemableBy was not set correctly");
  });

  it("prevents redeeming a non-existent lockBox", async () => {
    const etherLockBoxInstance = await EtherLockBox.new();

    await truffleAssert.reverts(
      etherLockBoxInstance.redeemLockBox(
        defaultLockBoxArgs[0],
        500,
        accounts[0]
      ),
      "lockBox does not exist"
    );
  });

  it("prevents redeeming a locked lockBox", async () => {
    const etherLockBoxInstance = await EtherLockBox.new();

    await etherLockBoxInstance.createLockBox(...defaultLockBoxArgs)

    await truffleAssert.reverts(
      etherLockBoxInstance.redeemLockBox(
        defaultLockBoxArgs[0],
        500,
        accounts[0]
      ),
      "this lockBox is still locked"
    );
  });

  it("prevents redeeming more from a lockBox than the lockBox value", async () => {
    const etherLockBoxInstance = await EtherLockBox.new();

    await etherLockBoxInstance.createLockBox(...defaultLockBoxArgs)

    await etherLockBoxInstance.unlockLockBox(
      defaultLockBoxArgs[0],
      "0x9c22ff5f21f0b81b113e63f7db6da94fedef11b2119b4088b89664fb9a3cb658",
      { from: accounts[0] }
    );

    await advanceBlock();
    await advanceBlock();

    await truffleAssert.reverts(
      etherLockBoxInstance.redeemLockBox(
        defaultLockBoxArgs[0],
        2000,
        accounts[0]
      ),
      "not enough value in lockBox"
    );
  });

  it("prevents redeeming by anyone other than the redeemableBy address", async () => {
    const etherLockBoxInstance = await EtherLockBox.new();

    await etherLockBoxInstance.createLockBox(...defaultLockBoxArgs)

    await etherLockBoxInstance.unlockLockBox(
      defaultLockBoxArgs[0],
      "0x9c22ff5f21f0b81b113e63f7db6da94fedef11b2119b4088b89664fb9a3cb658",
      { from: accounts[0] }
    );

    await advanceBlock();
    await advanceBlock();

    await truffleAssert.reverts(
      etherLockBoxInstance.redeemLockBox(
        defaultLockBoxArgs[0],
        1000,
        accounts[1],
        { from: accounts[1] }
      ),
      "you are not allowed to redeem this lockBox"
    );
  });

  it("redeems the specified amount to the specified address", async () => {
    const etherLockBoxInstance = await EtherLockBox.new();

    await etherLockBoxInstance.createLockBox(...defaultLockBoxArgs)

    await etherLockBoxInstance.unlockLockBox(
      defaultLockBoxArgs[0],
      "0x9c22ff5f21f0b81b113e63f7db6da94fedef11b2119b4088b89664fb9a3cb658",
      { from: accounts[0] }
    );

    await advanceBlock();
    await advanceBlock();

    const balanceBefore = await web3.eth.getBalance(accounts[1]);

    await etherLockBoxInstance.redeemLockBox(defaultLockBoxArgs[0], 500, accounts[1], { from: accounts[0] });

    const lockBox = await etherLockBoxInstance.getLockBox(defaultLockBoxArgs[0]);
    const balanceAfter = await web3.eth.getBalance(accounts[1]);

    assert.equal(lockBox.value, 500, "redeemed value was not deducted from lockBox")
    assert.equal(new BN(balanceAfter).sub(new BN(balanceBefore)), 500, "recipient did not receive payment");
  });

  it("increments the ownedLockBox count of the sender when a lockBox is created", async () => {
    const etherLockBoxInstance = await EtherLockBox.new();

    const lockBoxCountBefore = await etherLockBoxInstance.getOwnedLockBoxesCount({ from: accounts[0] });

    assert.equal(lockBoxCountBefore, 0, "lockBox count was not initialised as 0");

    await etherLockBoxInstance.createLockBox(...defaultLockBoxArgs)

    const lockBoxCountAfter = await etherLockBoxInstance.getOwnedLockBoxesCount({ from: accounts[0] });

    assert.equal(lockBoxCountAfter, 1, "lockBox count was not incremented when new lockBox was created");
  });

  it("can fetch the id of an owned lockBoxId given its index in the ownedLockBoxes mapping", async () => {
    const etherLockBoxInstance = await EtherLockBox.new();

    await etherLockBoxInstance.createLockBox(...defaultLockBoxArgs)

    const lockBoxId = await etherLockBoxInstance.getOwnedLockBoxId(0, { from: accounts[0] });

    assert.equal(lockBoxId, defaultLockBoxArgs[0], "lockBox Id was not stored in the correct index");
  });
});

const advanceBlock = () => {
  return new Promise((resolve, reject) => {
      web3.currentProvider.send({
          jsonrpc: "2.0",
          method: "evm_mine",
          id: new Date().getTime()
      }, (err) => {
          if (err) { return reject(err); }
          const newBlockHash = web3.eth.getBlock('latest').hash;

          return resolve(newBlockHash)
      });
  });
}