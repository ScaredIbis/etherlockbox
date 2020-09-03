import React, { useEffect, useState, useCallback } from "react";

import { makeStyles } from '@material-ui/core/styles';
import IconButton from '@material-ui/core/IconButton';
import TextField from '@material-ui/core/TextField';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import InputAdornment from '@material-ui/core/InputAdornment';
import FormControl from '@material-ui/core/FormControl';
import Search from '@material-ui/icons/Search';
import Grid from "@material-ui/core/Grid";
import CircularProgress from "@material-ui/core/CircularProgress";
import "./App.css";
import "fontsource-roboto";

import NewLockBoxForm from "./NewLockBoxForm";
import LockBox from "./LockBox";
import EtherLockBoxContract from "./contracts/EtherLockBox.json";
import getWeb3 from "./getWeb3";

const useStyles = makeStyles((theme) => ({
  root: {
    height: "100%",
  },
  searchForm: {
    marginBottom: theme.spacing(2),
    backgroundColor: "white",
    borderRadius: theme.spacing(1),
    '& .MuiInputBase-root': {
      fontWeight: "bold"
    },
  },
  paper: {
    padding: theme.spacing(2),
  },
  lockBoxId: {
    paddingTop: theme.spacing(2),
    paddingLeft: theme.spacing(2),
    backgroundColor: theme.palette.grey[200]
  },
  hero: {
    textAlign: "center",
    backgroundColor: "transparent",
  }
}));

const App = () => {
  const styles = useStyles();

  const [ready, setReady] = useState(false);
  const [web3, setWeb3] = useState({});
  const [account, setAccount] = useState([]);
  const [contract, setContract] = useState({});
  const [lockBoxId, setLockBoxId] = useState("");
  const [searchedLockBoxId, setSearchedLockBoxId] = useState("");
  const [lockBox, setLockBox] = useState({});

  async function initWeb3 () {
    try {
      // Get network provider and web3 instance.
      const _web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await _web3.eth.getAccounts();

      // Get the contract instance.
      const networkId = await _web3.eth.net.getId();
      const deployedNetwork = EtherLockBoxContract.networks[networkId];
      const _contract = new _web3.eth.Contract(
        EtherLockBoxContract.abi,
        deployedNetwork && deployedNetwork.address
      );

      _web3.currentProvider.publicConfigStore.on("update", () => {
        setAccount(_web3.currentProvider.selectedAddress);
      });

      setWeb3(_web3);
      setAccount(accounts[0]);
      setContract(_contract);
      setReady(true);

      const urlParams = new URLSearchParams(window.location.search);
      const lockBoxId = urlParams.get("lockBoxId");
      if (lockBoxId) {
        setSearchedLockBoxId(lockBoxId);
        setLockBoxId(lockBoxId);
      }
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        "Failed to load web3, accounts, or contract. Check console for details."
      );
      console.error(error);
    }
  }

  const getLockBox = useCallback(async () => {
    if(lockBoxId) {
      const lockBoxIdBytes = web3.utils.hexToBytes(web3.utils.utf8ToHex(lockBoxId));
      const lockBox = await contract.methods.getLockBox(lockBoxIdBytes).call();
      setLockBox(lockBox);
    }
  }, [lockBoxId, contract.methods, web3.utils]);

  const handleCreateLockBox = useCallback(async formValues => {
    if (formValues.questions.length > 255) {
      throw new Error(`Too many questions: ${formValues.questions.length}`);
    }
    let numQuestionsHex = web3.utils.numberToHex(formValues.questions.length).replace("0x", "");
    if (numQuestionsHex.length === 1) {
      numQuestionsHex = `0${numQuestionsHex}`;
    }

    let hints = `0x${numQuestionsHex}`;
    let answers = `0x${numQuestionsHex}`;

    for (const { hint, answer } of formValues.questions) {
      let hintLength = web3.utils.numberToHex(hint.length).replace("0x", "");
      if (hintLength.length > 4) {
        throw new Error(`Hint too long: ${hint}`);
      }
      // pad to 2 bytes
      while (hintLength.length < 4) {
        hintLength = `0${hintLength}`;
      }
      hints = `${hints}${hintLength}${web3.utils.utf8ToHex(hint).replace("0x", "")}`;
      answers = `${answers}${web3.utils.soliditySha3(web3.utils.soliditySha3(answer)).replace("0x", "")}`;
    }

    await contract.methods.createLockBox(
      web3.utils.hexToBytes(web3.utils.utf8ToHex(lockBoxId)),
      hints,
      answers,
      formValues.numAnswersRequired,
      formValues.unlockingPeriod,
      formValues.spendableOnceUnlocked
    )
      .send({
        from: account,
        value: web3.utils.toWei(formValues.value)
      });
  }, [account, web3.utils, contract.methods, lockBoxId]);

  useEffect(() => { initWeb3() }, [web3.eth]);

  useEffect(() => {
    if (ready) {
      getLockBox();
    }
  }, [getLockBox, ready]);

  const createLockBox = useCallback((formValues) => {
    if (ready) {
      handleCreateLockBox(formValues);
    }
  }, [handleCreateLockBox, ready]);

  if (!ready) {
    return (
      <Grid
        container
        direction="row"
        justify="center"
        alignItems="center"
      >
        <CircularProgress />
      </Grid>
    );
  }
  return (
    <Grid
      className={styles.root}
      container
      direction="row"
      justify="center"
      alignItems="center"
    >
      <Grid
        item
        xs={12}
        sm={10}
        md={6}
        lg={4}
      >
        <div className={styles.hero}>
          <Typography variant="h4" gutterBottom>{"\u{1F511}"} Ether Lock Box</Typography>
        </div>
        <Paper
          elevation={2}
        >
          <form
            className={styles.searchForm}
            noValidate
            autoComplete="off"
            onSubmit={event => {
              event.preventDefault();
              setLockBoxId(searchedLockBoxId);
            }}
          >
            <FormControl fullWidth>
              <TextField
                variant="outlined"
                placeholder="Find Lock Box By ID"
                value={searchedLockBoxId}
                onChange={event => setSearchedLockBoxId(event.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        type="submit"
                      >
                        <Search />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </FormControl>
          </form>
        </Paper>
        {
          lockBoxId && lockBox.createdAt === "0"
            ? (
              <Paper
                className={styles.paper}
                elevation={2}
              >
                <NewLockBoxForm
                  lockBoxId={lockBoxId}
                  onSave={createLockBox}
                />
              </Paper>
            )
            : null
        }
        {
          lockBoxId && Number(lockBox.createdAt) > 0
            ? (
              <Paper
                className={styles.paper}
                variant="outlined"
              >
                <LockBox
                  lockBox={lockBox}
                  web3={web3}
                  contract={contract}
                />
              </Paper>
            )
            : null
        }
      </Grid>
    </Grid>
  );
};

export default App;
