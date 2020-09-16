import React, { useState, useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';

import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import InputAdornment from '@material-ui/core/InputAdornment';
import FormControl from '@material-ui/core/FormControl';

const useStyles = makeStyles((theme) => ({
  root: {
    '& .MuiFormControl-root': {
      margin: theme.spacing(1, 0),
    },
  },
  spendButton: {
    marginBottom: theme.spacing(2),
  }
}));

const SpendValue = props => {
  const {
    open,
    onClose,
    onSpend,
    title,
    buttonText,
    defaultRecipient,
    hideRecipientInput,
    lockBox,
    web3,
    buttonColor,
  } = props;

  const styles = useStyles();
  const [amount, setAmount] = useState(web3.utils.fromWei(lockBox.value));
  const [to, setTo] = useState(defaultRecipient);

  useEffect(() => {
    setAmount(web3.utils.fromWei(lockBox.value))
  }, [lockBox, web3.utils])

  useEffect(() => {
    setTo(defaultRecipient)
  }, [defaultRecipient]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="form-dialog-title"
      className={styles.root}
    >
      <DialogTitle id="form-dialog-title">{title}</DialogTitle>
      <DialogContent>
        <FormControl fullWidth>
          <TextField
            margin="dense"
            label="Amount"
            variant="outlined"
            type="number"
            inputProps={{
              min: ".000000000000000001",
              step: ".0001",
              max: `${web3.utils.fromWei(lockBox.value)}`
            }}
            value={amount}
            onChange={event => setAmount(event.target.value)}
            InputProps={{
              endAdornment: (<InputAdornment position="end">Ether</InputAdornment>)
            }}
          />
        </FormControl>
        { !hideRecipientInput ? (
          <FormControl fullWidth>
            <TextField
              margin="dense"
              label="Recipient Address"
              variant="outlined"
              value={to}
              onChange={event => setTo(event.target.value)}
            />
          </FormControl>
        ) : null}
        <Button
          className={styles.spendButton}
          onClick={() => onSpend(web3.utils.toWei(amount), to)}
          color={buttonColor}
          variant="contained"
        >
          {buttonText}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

export default SpendValue;