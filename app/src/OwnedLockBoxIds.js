import React from 'react';
import { makeStyles } from '@material-ui/core/styles';

import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';

const useStyles = makeStyles((theme) => ({
  root: {
    '& .MuiDialogContent-root': {
      padding: theme.spacing(0, 3, 3, 3),
    },
    '& button': {
      marginTop: theme.spacing(1),
    },
  },
  spendButton: {
    marginBottom: theme.spacing(2),
  }
}));

const OwnedLockBoxIds = props => {
  const {
    open,
    onClose,
    lockBoxIds,
    handleLockBoxIdSelected
  } = props;

  const styles = useStyles();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="my-lockbox-ids-dialog-title"
      className={styles.root}
    >
      <DialogTitle id="my-lockbox-ids-dialog-title">{"\u{1F3E6}"} Your Lock Boxes</DialogTitle>
      <DialogContent>
        {lockBoxIds.map(lockBoxId => (
          <Button
            key={lockBoxId}
            variant="outlined"
            fullWidth
            color="primary"
            onClick={(event) => {
              event.preventDefault()
              handleLockBoxIdSelected(lockBoxId)
            }}
          >
            {lockBoxId}
          </Button>
        ))}
      </DialogContent>
    </Dialog>
  );
}

export default OwnedLockBoxIds;