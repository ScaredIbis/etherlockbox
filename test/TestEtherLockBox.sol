pragma solidity >=0.4.21 <=0.7.0;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/EtherLockBox.sol";

contract TestEtherLockBox {

  function testItStoresAValue() public {
    EtherLockBox etherLockBox = EtherLockBox(DeployedAddresses.EtherLockBox());

    etherLockBox.createLockBox(
      0x00,
      0x00,
      0x015d301403171467692c18ed2549c8e41e0c3f7451d43554323cf5cd1bed64b2bb,
      1,
      2,
      false
    );

    uint expected = 89;

    Assert.equal(etherLockBox.getLockBox(0x00), expected, "It should store the value 89.");
  }
}
