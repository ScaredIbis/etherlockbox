import React, { useMemo } from "react";
import { makeStyles } from '@material-ui/core/styles';
import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";
import Tooltip from "@material-ui/core/Tooltip";
import Ether from "./img/ether.svg";

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
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  }
}));

const LockBox = props => {

  const styles = useStyles();

  const {
    lockBox,
    blockNumber,
    lockBoxId,
    account,
    web3
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

  const unlockedAt = useMemo(() => Number(lockBox.unlockedAt), [lockBox])

  const isLocked = useMemo(() => {
    return (!blockNumber || unlockedAt === 0 || unlockedAt >= blockNumber)
  }, [unlockedAt, blockNumber]);

  const status = useMemo(() => {
    if(unlockedAt === 0) {
      return `Locked since block ${Number(lockBox.createdAt)}`;
    } else if (unlockedAt > blockNumber) {
      return `Unlocks at block ${Number(lockBox.unlockedAt)}`;
    } else if (unlockedAt <= blockNumber) {
      return `Unlocked at block ${Number(lockBox.unlockedAt)}`;
    }
  }, [unlockedAt, blockNumber, lockBox.createdAt, lockBox.unlockedAt])

  const redeemable = useMemo(() => {
    return (
      !isLocked &&
      lockBox.redeemableBy.toUpperCase() == account.toUpperCase()
    )
  }, [lockBox, account, isLocked])

  const spendable = useMemo(() => {
    return (
      isLocked ||
      lockBox.spendableOnceUnlocked &&
      lockBox.owner.toUpperCase() === account.toUpperCase()
    )
  }, [lockBox, account, isLocked])

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
      <Typography variant="h6" gutterBottom>{emoji} {status} </Typography>
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
      <Tooltip
        title={isLocked ? "Lock box is locked" : "Lock box is not spendable once unlocked"}
        disableHoverListener={spendable}
      >
        <span>
          <Button
            variant="contained"
            color="primary"
            className={styles.marginRight}
            disabled={!spendable}
          >
            Spend
          </Button>
        </span>
      </Tooltip>
      <Tooltip
        title={!redeemable ? "Lock box is locked" : "You are not allowed to redeem this lock box"}
        disableHoverListener={redeemable}
      >
        <span>
        <Button
          variant="contained"
          color="secondary"
          disabled={!redeemable}
        >
          Redeem
        </Button>
        </span>
      </Tooltip>
    </>
  );
};

export default LockBox;
