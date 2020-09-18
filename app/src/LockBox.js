import React, { useMemo, useState, useEffect } from "react";
import { makeStyles } from '@material-ui/core/styles';
import Typography from "@material-ui/core/Typography";
import Grid from "@material-ui/core/Grid";
import Button from "@material-ui/core/Button";
import Tooltip from "@material-ui/core/Tooltip";
import Ether from "./img/ether.svg";

import SpendValue from "./SpendValue";

const useStyles = makeStyles((theme) => ({
  etherIcon: {
    paddingRight: theme.spacing(0.5),
    height: "24px",
    width: "25.5px",
    verticalAlign: "sub"
  },
  marginRight: {
    marginRight: theme.spacing(1)
  },
  overflowEllipsis: {
    whiteSpace: "pre",
    overflow: "hidden",
    textOverflow: "ellipsis"
  },
  buttonContainer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "flex-start"
  }
}));

const LockBox = props => {
  const [spendingContext, setSpendingContext] = useState(null);
  const [spendingProps, setSpendingProps] = useState({});

  const styles = useStyles();

  const {
    lockBox,
    blockNumber,
    lockBoxId,
    account,
    web3,
    handleSpendValue,
    handleRedeemValue,
    handleAddValue
  } = props;

  const emoji = useMemo(() => {
    const unlockedAt = Number(lockBox.unlockedAt);
    if(unlockedAt === 0) {
      return "\u{1F512}"
    } else if (unlockedAt > blockNumber) {
      return "\u{1F510}"
    } else if (unlockedAt <= blockNumber) {
      return "\u{1F513}"
    }
  }, [lockBox, blockNumber])

  const unlockedAt = useMemo(() => Number(lockBox.unlockedAt), [lockBox.unlockedAt]);
  const createdAt = useMemo(() => Number(lockBox.createdAt), [lockBox.createdAt]);

  const isLocked = useMemo(() => {
    return (!blockNumber || unlockedAt === 0 || unlockedAt >= blockNumber)
  }, [unlockedAt, blockNumber]);

  const status = useMemo(() => {
    if(unlockedAt === 0) {
      return `Locked since block ${createdAt}`;
    } else if (unlockedAt > blockNumber) {
      return `Unlocks at block ${unlockedAt}`;
    } else if (unlockedAt <= blockNumber) {
      return `Unlocked at block ${unlockedAt}`;
    }
  }, [unlockedAt, blockNumber, createdAt])

  const blockDelta = useMemo(() => {
    if(unlockedAt === 0) {
      const delta = blockNumber - createdAt;
      if(delta === 0) {
        return "just now";
      }
      return `(${delta} ${delta === 1 ? "block" : "blocks"} ago)`
    } else if(unlockedAt === blockNumber) {
      return "(just now)"
    } else if (unlockedAt > blockNumber) {
      const delta = unlockedAt - blockNumber;
      return `(${delta} ${delta === 1 ? "block" : "blocks"} from now)`;
    } else {
      const delta = blockNumber - unlockedAt;
      return `(${delta} ${delta === 1 ? "block" : "blocks"} ago)`;
    }
  }, [unlockedAt, createdAt, blockNumber])

  const redeemable = useMemo(() => {
    return (
      !isLocked &&
      lockBox.redeemableBy.toUpperCase() === account.toUpperCase()
    )
  }, [lockBox, account, isLocked])

  const spendable = useMemo(() => {
    return (
      ( isLocked || lockBox.spendableOnceUnlocked ) &&
      lockBox.owner.toUpperCase() === account.toUpperCase()
    )
  }, [lockBox, account, isLocked])

  useEffect(() => {
    if(!spendingContext || !web3) {
      setSpendingProps(previous => ({
        ...previous,
        defaultRecipient: ""
      }));
    } else if (spendingContext === "redeem") {
      setSpendingProps({
        title: "Redeem Locked Value",
        onSpend: handleRedeemValue,
        defaultRecipient: lockBox.redeemableBy,
        buttonColor: "secondary",
        buttonText: "Redeem"
      });
    } else if (spendingContext === "spend") {
      setSpendingProps({
        title: "Spend Locked Value",
        onSpend: handleSpendValue,
        defaultRecipient: lockBox.owner,
        buttonColor: "primary",
        buttonText: "Spend"
      });
    } else if (spendingContext === "addValue") {
      setSpendingProps({
        title: "Add Value to Lock Box",
        onSpend: handleAddValue,
        hideRecipientInput: true,
        buttonColor: "primary",
        buttonText: "Add Value"
      })
    }
  }, [spendingContext, lockBoxId, web3, handleSpendValue, handleRedeemValue, handleAddValue, lockBox])

  return (
    <>
      <Typography
        variant="h5"
        gutterBottom
        className={styles.overflowEllipsis}
      >
        <strong>{lockBoxId}</strong>
      </Typography>
      <Typography variant="h6" gutterBottom>
        <img
          className={styles.etherIcon}
          src={Ether}
          alt="Ether Icon"
        />
        {web3.utils.fromWei(props.lockBox.value)} ETH
      </Typography>
      <Typography
        variant="h6"
        gutterBottom
      >
        {emoji} {status} {" "}
        <Typography
          variant="caption"
        >
          {blockDelta}
        </Typography>
      </Typography>
      <Typography
        variant="caption"
        component="p"
      >
        {
          lockBox.spendableOnceUnlocked ?
          "Owner can spend funds even after lock box in unlocked" :
          "Owner cannot spend funds once lock box is unlocked"
        }
      </Typography>
      <Typography
        variant="caption"
        component="p"
        gutterBottom
      >
        {
          Number(lockBox.unlockingPeriod) > 0 ?
          `Lock box is redeemable ${lockBox.unlockingPeriod} blocks after unlocking` :
          "Lock box is redeemable immediately after unlocking"
        }
      </Typography>
      <Grid
        container
        direction="row"
        justify="space-between"
        alignItems="center"
      >
        <Grid
          item
        >
          <Grid
            container
            direction="row"
            justify="flex-start"
            alignItems="center"
          >
            <Tooltip
              title={isLocked ? "Lock box is locked" : "Lock box is not spendable once unlocked"}
              disableHoverListener={spendable}
            >
              <div>
                <Button
                  variant="contained"
                  color="primary"
                  className={styles.marginRight}
                  disabled={!spendable}
                  onClick={() => setSpendingContext("spend")}
                  >
                  Spend
                </Button>
              </div>
            </Tooltip>
            <Tooltip
              title={!redeemable ? "Lock box is locked" : "You are not allowed to redeem this lock box"}
              disableHoverListener={redeemable}
            >
              <div>
              <Button
                variant="contained"
                color="secondary"
                disabled={!redeemable}
                onClick={() => setSpendingContext("redeem")}
              >
                Redeem
              </Button>
              </div>
            </Tooltip>
          </Grid>
        </Grid>
        <Grid
          item
        >
          <Button
            variant="outlined"
            color="primary"
            onClick={() => setSpendingContext("addValue")}
          >
            Add Value
          </Button>
        </Grid>
      </Grid>
      <SpendValue
        open={spendingContext !== null}
        onClose={() => setSpendingContext(null)}
        lockBox={lockBox}
        web3={web3}
        {...spendingProps}
      >
      </SpendValue>
    </>
  );
};

export default LockBox;
