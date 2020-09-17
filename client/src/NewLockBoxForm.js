
import React, { useState, useCallback } from "react";
import PropTypes from "prop-types";

import { makeStyles } from '@material-ui/core/styles';

import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import InputAdornment from '@material-ui/core/InputAdornment';
import FormControl from '@material-ui/core/FormControl';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import Delete from '@material-ui/icons/Delete';
import Add from '@material-ui/icons/Add';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import FormHelperText from '@material-ui/core/FormHelperText';

const useStyles = makeStyles((theme) => ({
  root: {
    '& .MuiFormControl-root': {
      margin: theme.spacing(1, 0),
    },
  },
  noMarginBottom: {
    marginBottom: theme.spacing(0),
  },
  noMarginTop: {
    marginTop: theme.spacing(0),
  },
  noPaddingRight: {
    paddingRight: theme.spacing(0),
  },
  overflowEllipsis: {
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  }
}));

const NewLockBoxForm = props => {
  const styles = useStyles();

  const [value, setValue] = useState(0);
  const [spendableOnceUnlocked, setSpendableOnceUnlocked] = useState(false);
  const [unlockingPeriod, setUnlockingPeriod] = useState(0);
  const [numAnswersRequired, setNumAnswersRequired] = useState(1);
  const [questions, setQuestions] = useState([{
    hint: "",
    answer: ""
  }]);

  const updateQuestions = useCallback(({ hint, answer, index }) => {
    const newQuestions = [...questions];
    newQuestions.splice(index, 1, { hint, answer });

    setQuestions(newQuestions);
  }, [questions]);

  const removeQuestion = index => {
    if(questions.length > 1) {
      const newQuestions = [...questions];
      newQuestions.splice(index, 1);

      setQuestions(newQuestions);
    }
  };

  const addSecurityQuestion = () => {
    setQuestions(previousQuestions => {
      // number of hints/answers must be contained within 1 byte (<= 255)
      if (previousQuestions.length < 255) {
        return [...previousQuestions, { hint: "", answer: "" }];
      }
      return previousQuestions;
    });
  };

  const submitForm = useCallback((event) => {
    event.preventDefault();
    props.onSave({
      value,
      spendableOnceUnlocked,
      unlockingPeriod,
      questions,
      numAnswersRequired
    });
  }, [value, spendableOnceUnlocked, unlockingPeriod, questions, numAnswersRequired, props]);

  return (
    <form
      className={styles.root}
      noValidate
      autoComplete="off"
      onSubmit={submitForm}
    >
      <Typography
        variant="h5"
        gutterBottom
        className={styles.overflowEllipsis}
      >
        <strong>{props.lockBoxId}</strong>
      </Typography>
      <Typography variant="h6" gutterBottom>New Lock Box Settings</Typography>
      <FormControl fullWidth>
        <TextField
          margin="dense"
          label="Value"
          variant="outlined"
          type="number"
          inputProps={{
            min: ".000000000000000001",
            step: ".0001",
            max: `1000000000000000000`
          }}
          value={value}
          onChange={event => setValue(event.target.value)}
          InputProps={{
            endAdornment: (<InputAdornment position="end">Ether</InputAdornment>)
          }}
        />
      </FormControl>
      <FormControl fullWidth>
        <TextField
          margin="dense"
          label="Unlocking Period"
          variant="outlined"
          type="number"
          inputProps={{
            min: "0",
            step: "1",
            max: `1000000000000000000`
          }}
          value={unlockingPeriod}
          onChange={event => setUnlockingPeriod(event.target.value)}
          InputProps={{
            endAdornment: (<InputAdornment position="end">Blocks</InputAdornment>)
          }}
        />
      </FormControl>
      <FormControl>
        <FormControlLabel
          className={styles.noMarginBottom}
          control={(
            <Checkbox
              color="primary"
              checked={spendableOnceUnlocked}
              onChange={event => setSpendableOnceUnlocked(event.target.checked)}
              name="spendableOnceUnlocked"
            />
          )}
          label="Spendable Once Unlocked"
        />
        <FormHelperText className={styles.noMarginTop}>
          {
            spendableOnceUnlocked
              ? "You will be able to spend from this lockbox even if someone else unlocks it"
              : "Once this lockbox is unlocked by someone else, you will lose access to the funds"
          }
        </FormHelperText>
      </FormControl>
      <Typography variant="h6">Security Questions</Typography>
      { questions.map(({ hint, answer }, index) => (
        <div key={`security_question_${index}`}>
          <FormControl
            fullWidth
            >
            <TextField
              margin="dense"
              variant="outlined"
              label={`Hint #${index + 1}`}
              placeholder={`Hint #${index + 1}`}
              value={hint}
              onChange={event => updateQuestions({ hint: event.target.value, answer, index })}
              InputProps={questions.length > 1 ? {
                className: styles.noPaddingRight,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="delete security question"
                      type="button"
                      color="secondary"
                      onClick={() => {
                        removeQuestion(index)
                      }}
                    >
                      <Delete />
                    </IconButton>
                  </InputAdornment>
                )
              } : {}}
              />
            <TextField
              margin="dense"
              variant="outlined"
              label={`Answer #${index + 1}`}
              placeholder={`Answer #${index + 1}`}
              value={answer}
              onChange={event => updateQuestions({ answer: event.target.value, hint, index })}
            />
          </FormControl>
        </div>
      ))
      }
      <FormControl>
        <Button
          type="button"
          variant="outlined"
          color="secondary"
          onClick={addSecurityQuestion}
          startIcon={<Add />}
        >
          Add Security Question
        </Button>
      </FormControl>
      <FormControl fullWidth>
        <TextField
          margin="dense"
          label="Correct Answers Required"
          variant="outlined"
          type="number"
          inputProps={{
            min: "1",
            max: `${questions.length}`
          }}
          placeholder="Correct answers required"
          value={numAnswersRequired}
          onChange={event => setNumAnswersRequired(event.target.value)}
        />
      </FormControl>
      <FormControl>
        <Button
          type="submit"
          variant="contained"
          color="primary"
        >
          Create
        </Button>
      </FormControl>
    </form>
  );
};

NewLockBoxForm.propTypes = {
  onSave: PropTypes.func,
  lockBoxId: PropTypes.string,
};

export default NewLockBoxForm;
