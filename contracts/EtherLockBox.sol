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
    bool spendableOnceUnlocked;
  }

  event Created(bytes lockBoxId);
  event ValueAdded(bytes lockBoxId, uint amount);
  event SpentFrom(bytes lockBoxId, uint amount, address to);
  event Unlocked(bytes lockBoxId);
  event Redeemed(bytes lockBoxId, uint amount, address to);

  mapping (bytes => LockBox) lockBoxes;

  /// Create a new lockBox
  /// @param lockBoxId id of the lockBox
  /// @param hints serialised lockBox hints
  /// hint serialisation form is
  /// <numberOfHints(1byte)><sizeOfHint1(2 bytes)><hint1>...<sizeOfHintN(2 bytes)><hintN>
  /// @param answers serialised lockBox answers
  /// answer serialisation form is
  /// <numberOfAnswers(1byte)><answer1(32 bytes)>...<answerN(32 bytes)>
  /// @param numAnswersRequired number of correct answers required to unlock this lockBox
  /// @param unlockingPeriod number of blocks before redeemer can claim unlocked value
  /// @dev creates a new lockBox
  function createLockBox(
    bytes memory lockBoxId,
    bytes memory hints,
    bytes memory answers,
    uint8 numAnswersRequired,
    uint unlockingPeriod,
    bool spendableOnceUnlocked
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
    lockBox.spendableOnceUnlocked = spendableOnceUnlocked;
    emit Created(lockBoxId);
  }

  /// Get a lockBox by id
  /// @param lockBoxId id of the lockBox
  /// @dev creates a new lockBox
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
    bool spendableOnceUnlocked
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
      lockBox.spendableOnceUnlocked
    );
  }

  /// Add value to an existing lockBox
  /// @param lockBoxId id of the lockBox
  /// @dev adds the msg value to the value of the lockBox
  function addValue(bytes memory lockBoxId) public payable {
    LockBox storage lockBox = lockBoxes[lockBoxId];
    require(lockBoxes[lockBoxId].createdAt > 0, "lockBox does not exist");
    lockBox.value += msg.value;
    emit ValueAdded(lockBoxId, msg.value);
  }

  /// Spend from the lockBox as the owner, sending the specified value to a chosen address
  /// @param lockBoxId id of the lockBox
  /// @param amount amount to deduct from lockBox
  /// @param to id of the lockBox
  /// @dev bypass redemption and immediately send the specified value to a chosen address
  function spendFromLockBox(bytes memory lockBoxId, uint amount, address payable to) public {
    LockBox storage lockBox = lockBoxes[lockBoxId];
    require(lockBox.createdAt > 0, "lockBox does not exist");
    require(lockBox.owner == msg.sender, "only the owner can spend from a lockBox");
    require((lockBox.unlockedAt == 0 || lockBox.unlockedAt > block.number) || lockBoxes[lockBoxId].spendableOnceUnlocked == true, "this lockBox cannot be spent from after it is unlocked");
    require(amount <= lockBox.value, "not enough value in lockBox");
    lockBox.value -= amount;
    to.transfer(amount);
    emit SpentFrom(lockBoxId, amount, to);
  }

  /// Unlock the lockBox, setting the msg sender as the redeemer
  /// @param lockBoxId id of the lockBox
  /// @param answers serialised solutions to answer hash(s)
  /// @dev given the correct hash inputs for the answers, sets the sender as the redeemer of the lockBox
  function unlockLockBox(bytes memory lockBoxId, bytes memory answers) public {
    LockBox storage lockBox = lockBoxes[lockBoxId];
    require(lockBoxes[lockBoxId].createdAt > 0, "lockBox does not exist");
    // first byte specifies how many answers there are
    uint numAnswersCorrect = 0;
    uint8 numTotalAnswers = bytesToUint8(lockBox.answers);
    for (uint8 i = 0; i < numTotalAnswers; i++) {
      bytes32 expectedAnswer = bytesToBytes32(lockBox.answers, i * 32 + 1);
      bytes32 providedAnswer = keccak256(abi.encodePacked(bytesToBytes32(answers, i * 32)));
      if(expectedAnswer == providedAnswer) {
        numAnswersCorrect++;
      }
    }
    require(numAnswersCorrect >= lockBox.numAnswersRequired, "not enough correct answers");
    lockBox.redeemableBy = msg.sender;
    lockBox.unlockedAt = block.number + lockBox.unlockingPeriod;
    emit Unlocked(lockBoxId);
  }

  /// Redeem a specified amount from an unlocked lockBox
  /// @param lockBoxId id of the lockBox
  /// @param amount amount to redeem from lockBox
  /// @param to address to redeem value to
  /// @dev given that the lockBox is redeemable by the msg sender, sends specified amount to specified address
  function redeemLockBox(bytes memory lockBoxId, uint amount, address payable to) public {
    LockBox storage lockBox = lockBoxes[lockBoxId];
    require(lockBox.createdAt > 0, "lockBox does not exist");
    require(lockBox.unlockedAt > 0 && lockBox.unlockedAt <= block.number, "this lockBox is still locked");
    require(lockBox.redeemableBy == msg.sender, "you are not allowed to redeem this lockBox");
    require(amount <= lockBox.value, "not enough value in lockBox");
    lockBox.value -= amount;
    to.transfer(amount);
    emit Redeemed(lockBoxId, amount, to);
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
