import React, { useCallback, useMemo, useState } from "react";
import { makeStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import FormControl from '@material-ui/core/FormControl';
import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";
import Tooltip from "@material-ui/core/Tooltip";
import InputAdornment from "@material-ui/core/InputAdornment";
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';
import RadioButtonUncheckedIcon from '@material-ui/icons/RadioButtonUnchecked';
import Ether from "./img/ether.svg";

const useStyles = makeStyles((theme) => ({
  root: {
    '& .MuiFormControl-root': {
      marginBottom: theme.spacing(1),
    },
  },
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

const UnlockLockBox = props => {

  const styles = useStyles();
  const [answers, setAnswers] = useState([])

  const {
    lockBox,
    web3,
    onUnlock
  } = props;

  const unlockable = useMemo(() => {
    const numCorrectAnswers = answers.reduce((numCorrect, answer) => {
      if(answer && answer.isCorrect) {
        numCorrect += 1;
      }
      return numCorrect;
    }, 0)
    return numCorrectAnswers >= lockBox.numAnswersRequired
  }, [lockBox, answers])

  const hints = useMemo(() => {
    // first byte is number of hints
    let deserializedHints = [];
    let numHintsBytes = lockBox.hints.slice(2, 4);
    let numHints = web3.utils.hexToNumber(`0x${numHintsBytes}`);
    let floatingHints = lockBox.hints.slice(4);
    for(let i = 0; i < numHints; i++) {
      const hintLengthBytes = floatingHints.slice(0, 4);
      const hintLength = web3.utils.hexToNumber(`0x${hintLengthBytes}`);
      const serializedHint = floatingHints.slice(4, 4 + hintLength * 2);
      const deserializedHint = web3.utils.hexToUtf8(`0x${serializedHint}`);
      deserializedHints.push(deserializedHint);
      floatingHints = floatingHints.slice(4 + hintLength * 2)
    }
    return deserializedHints
  }, [lockBox, web3]);

  const updateAnswers = useCallback(({ value, index }) => {
    const newAnswers = [...answers];
    const answerHash = web3.utils.soliditySha3(web3.utils.soliditySha3(value)).replace("0x", "")
    const actualAnswerHash = lockBox.answers.slice(4 + index * 64, 4 + (index + 1) * 64);
    const isCorrect = answerHash === actualAnswerHash;
    newAnswers[index] = { value, isCorrect };

    setAnswers(newAnswers);
  }, [answers, lockBox, web3]);

  const unlockLockBox = useCallback(() => {
    const hashedAnswers = hints.reduce((total, hint, index) => {
      if(answers[index] && answers[index].value) {
        return total + web3.utils.soliditySha3(answers[index].value).replace("0x", "");
      }
      return total + `0000000000000000000000000000000000000000000000000000000000000000`;
    }, "")
    onUnlock(`0x${hashedAnswers}`);
  }, [answers])

  return (
    <div className={styles.root}>
      <Typography
        variant="h6"
        gutterBottom
      >
        <strong>Answer Security Questions</strong>
      </Typography>
      { hints.map((hint, index) => (
        <div key={`security_question_${index}`}>
          <FormControl
            fullWidth
          >
            {hint}
            <TextField
              margin="dense"
              variant="outlined"
              label={`Answer #${index + 1}`}
              placeholder={`Answer #${index + 1}`}
              value={answers[index] ? answers[index].value : ""}
              onChange={event => updateAnswers({ value: event.target.value, index })}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    {
                      answers[index] && answers[index].isCorrect ?
                      <CheckCircleOutlineIcon color="primary" /> :
                      <RadioButtonUncheckedIcon />
                    }
                  </InputAdornment>
                )
              }}
            />
          </FormControl>
        </div>
      ))
      }
      <Tooltip
        title={"Not enough correct answers"}
        disableHoverListener={unlockable}
      >
        <span>
          <Button
            variant="contained"
            color="secondary"
            disabled={!unlockable}
            onClick={unlockLockBox}
          >
            Unlock
          </Button>
        </span>
      </Tooltip>
    </div>
  );
};

export default UnlockLockBox;
