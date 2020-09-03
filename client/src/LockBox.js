import React from "react";

const LockBox = props => {
  return (
    <div>
      {props.web3.utils.fromWei(props.lockBox.value)}
    </div>
  );
};

export default LockBox;
