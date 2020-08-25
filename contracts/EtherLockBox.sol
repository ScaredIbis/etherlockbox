// SPDX-License-Identifier: MIT
pragma solidity >=0.4.21 <=0.7.0;

/// @author Chris Martin
/// @title A mechanism for locking eth behind m-of-n security questions
contract EtherLockBox {

  struct LockBox {
    uint createdAt;
    address owner;
    address redeemableBy;
    uint unlockedAt;
    uint unlockingPeriod;
    uint value;
    bytes hints;
    bytes answers;
    uint8 numAnswersRequired;
    bool breakableOnceUnlocked;
  }

  mapping (bytes => LockBox) lockBoxes;

  /// Create a new lockbox
  /// @param lockBoxId id of the lockbox
  /// @param hints serialised lockbox hints
  /// @param answers serialised lockbox answers
  /// @param numAnswersRequired number of correct answers required to unlock this lockbox
  /// @param unlockingPeriod number of blocks before redeemer can claim unlocked value
  /// @dev creates a new lockbox
  function createLockBox(
    bytes memory lockBoxId,
    bytes memory hints,
    bytes memory answers,
    uint8 numAnswersRequired,
    uint unlockingPeriod,
    bool breakableOnceUnlocked
  ) public payable {
    LockBox storage lockBox = lockBoxes[lockBoxId];
    require(lockBox.createdAt == 0, "lockBox with this id already exists");
    lockBox.createdAt = block.number;
    lockBox.owner = msg.sender;
    lockBox.value = msg.value;
    lockBox.hints = hints;
    lockBox.answers = answers;
    lockBox.numAnswersRequired = numAnswersRequired;
    lockBox.unlockingPeriod = unlockingPeriod;
    lockBox.breakableOnceUnlocked = breakableOnceUnlocked;
  }

  /// Get a lockbox by id
  /// @param lockBoxId id of the lockbox
  /// @dev creates a new lockbox
  function getLockBox(bytes memory lockBoxId) public view returns (
    uint createdAt,
    address owner,
    address redeemableBy,
    uint unlockedAt,
    uint unlockingPeriod,
    uint value,
    bytes memory hints,
    bytes memory answers,
    uint8 numAnswersRequired,
    bool breakableOnceUnlocked
  ) {
    LockBox storage lockBox = lockBoxes[lockBoxId];
    return (
      lockBox.createdAt,
      lockBox.owner,
      lockBox.redeemableBy,
      lockBox.unlockedAt,
      lockBox.unlockingPeriod,
      lockBox.value,
      lockBox.hints,
      lockBox.answers,
      lockBox.numAnswersRequired,
      lockBox.breakableOnceUnlocked
    );
  }

  /// Add value to an existing lockbox
  /// @param lockBoxId id of the lockbox
  /// @dev adds the msg value to the value of the lockbox
  function addValue(bytes memory lockBoxId) public payable {
    LockBox storage lockBox = lockBoxes[lockBoxId];
    require(lockBoxes[lockBoxId].createdAt > 0, "lockBox does not exist");
    lockBox.value += msg.value;
  }

  /// Break the lockbox as the owner, sending the specified value to a chosen address
  /// @param lockBoxId id of the lockbox
  /// @param to id of the lockbox
  /// @param amount amount to deduct from lockbox
  /// @dev bypass redemption and immediately send the specified value to a chosen address
  function breakLockBox(bytes memory lockBoxId, address payable to, uint amount) public {
    LockBox storage lockBox = lockBoxes[lockBoxId];
    require(lockBox.createdAt > 0, "lockBox does not exist");
    require(lockBox.owner == msg.sender, "only the owner can break a lockbox");
    require(lockBox.unlockedAt > block.number || lockBoxes[lockBoxId].breakableOnceUnlocked, "this lockbox cannot be broken after it is unlocked");
    require(lockBox.value <= amount, "not enough value in lockbox");
    lockBox.value -= amount;
    to.transfer(amount);
  }

  /// Unlock the lockbox, setting the msg sender as the redeemer
  /// @param lockBoxId id of the lockbox
  /// @param answers serialised solutions to answer hash(s)
  /// @dev given the correct hash inputs for the answers, sets the sender as the redeemer of the lockbox
  function unlockLockBox(bytes memory lockBoxId, bytes memory answers) public {
    LockBox storage lockBox = lockBoxes[lockBoxId];
    require(lockBoxes[lockBoxId].createdAt > 0, "lockBox does not exist");
    // first byte specifies how many answers there are
    uint numAnswersCorrect = 0;
    uint8 numAnswersProvided = bytesToUint8(answers);
    for (uint8 i = 0; i < numAnswersProvided; i++) {
      uint byteOffset = i * 32 + 1;
      bytes32 expectedAnswer = bytesToBytes32(lockBox.answers, byteOffset);
      bytes32 providedAnswer = keccak256(abi.encodePacked(bytesToBytes32(answers, byteOffset)));
      if(expectedAnswer == providedAnswer) {
        numAnswersCorrect++;
      }
    }
    require(numAnswersCorrect >= lockBox.numAnswersRequired, "Not enough correct answers");
    lockBox.redeemableBy = msg.sender;
    lockBox.unlockedAt = block.number + lockBox.unlockingPeriod;
  }

  /// Redeem a specified amount from an unlocked lockbox
  /// @param lockBoxId id of the lockbox
  /// @param to address to redeem value to
  /// @param amount amount to redeem from lockbox
  /// @dev given that the lockbox is redeemable by the msg sender, sends specified amount to specified address
  function redeemLockBox(bytes memory lockBoxId, address payable to, uint amount) public {
    LockBox storage lockBox = lockBoxes[lockBoxId];
    require(lockBox.createdAt > 0, "lockBox does not exist");
    require(lockBox.redeemableBy == msg.sender, "you are not allowed to redeem this lockbox");
    require(lockBox.unlockedAt <= block.number, "this lockbox is still locked");
    require(amount <= lockBox.value, "not enough value in lockbox");
    lockBox.value -= amount;
    to.transfer(amount);
  }

  /// util function for converting first byte of byte array to uint8
  /// @param _bytes byte array to slice
  /// @dev given a byte array, convert the first element to a uint8 value
  function bytesToUint8(bytes memory _bytes) internal pure returns (uint8) {
    require(_bytes.length >= 1, "out of bounds when counting provided answers");
    uint8 tempUint;

    assembly {
        tempUint := mload(add(add(_bytes, 0x1), 0))
    }

    return tempUint;
  }

  /// util function for slicing a bytes array and converting to bytes32
  /// @param _bytes byte array to slice
  /// @param _start start index of slice
  /// @dev given a byte array, convert a slice starting at specified index to bytes32
  function bytesToBytes32(bytes memory _bytes, uint256 _start) internal pure returns (bytes32) {
    require(_bytes.length >= (_start + 32), "out of bounds when slicing to bytes32");
    bytes32 tempBytes32;

    assembly {
        tempBytes32 := mload(add(add(_bytes, 0x20), _start))
    }

    return tempBytes32;
  }
}
