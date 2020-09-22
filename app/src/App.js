import React, { useEffect, useState, useCallback, useMemo } from "react";
import clsx from "clsx";

import { makeStyles } from '@material-ui/core/styles';
import IconButton from '@material-ui/core/IconButton';
import TextField from '@material-ui/core/TextField';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import InputAdornment from '@material-ui/core/InputAdornment';
import FormControl from '@material-ui/core/FormControl';
import Search from '@material-ui/icons/Search';
import CircularProgress from "@material-ui/core/CircularProgress";
import Snackbar from "@material-ui/core/Snackbar";
import Link from "@material-ui/core/Link";
import CloseIcon from '@material-ui/icons/Close';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';

import "./App.css";
import "fontsource-roboto";

import OwnedLockBoxIds from "./OwnedLockBoxIds";
import NewLockBoxForm from "./NewLockBoxForm";
import LockBox from "./LockBox";
import UnlockLockBox from "./UnlockLockBox";
import EtherLockBoxContract from "./contracts/EtherLockBox.json";
import getWeb3 from "./getWeb3";

const getEtherscanUrlBase = network => {
  switch(network) {
    case 3:
      return `https://ropsten.etherscan.io`
    default:
      return "https://etherscan.io"
  }
}

const useStyles = makeStyles((theme) => ({
  root: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "stretch"
  },
  appContainer: {
    overflow: "auto",
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
  formContainer: {
    overflow: "auto",
  },
  innerPaper: {
    padding: theme.spacing(2),
  },
  appContent: {
    [theme.breakpoints.down('xs')]: {
      width: "95%"
    },
    [theme.breakpoints.up('sm')]: {
      width: "80%"
    },
    [theme.breakpoints.up('md')]: {
      width: "60%"
    },
    [theme.breakpoints.up('lg')]: {
      width: "50%",
      maxWidth: "700px",
    },
  },
  searchForm: {
    marginBottom: theme.spacing(2),
    backgroundColor: "white",
    borderRadius: 16,
    '& .MuiInputBase-root': {
      fontWeight: "bold"
    },
  },
  marginBottom: {
    marginBottom: theme.spacing(1),
  },
  lockBoxId: {
    paddingTop: theme.spacing(2),
    paddingLeft: theme.spacing(2),
    backgroundColor: theme.palette.grey[200]
  },
  hero: {
    textAlign: "center",
    backgroundColor: "transparent",
    marginBottom: theme.spacing(3)
  },
  snackBarProgress: {
    marginRight: theme.spacing(1)
  },
  topBar: {
    top: 0,
    padding: theme.spacing(1, 2),
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between"
  },
  topBarItemsLeft: {
    "& a": {
      fontWeight: "bold",
    },
    "& .MuiButton-endIcon": {
      marginLeft: theme.spacing(0.5),
    },
    display: "flex"
  },
  topBarItemsRight: {
    display: "flex",
    "& span": {
      fontWeight: "bold",
    }
  }
}));

const App = () => {
  const styles = useStyles();

  const [ready, setReady] = useState(false);
  const [web3, setWeb3] = useState({});
  const [noWeb3, setNoWeb3] = useState(false);
  const [blockNumber, setBlockNumber] = useState(null);
  const [etherscanUrlBase, setEtherscanUrlBase] = useState("");
  const [account, setAccount] = useState("");
  const [contract, setContract] = useState({});
  const [lockBoxId, setLockBoxId] = useState("");
  const [ownedLockBoxIds, setOwnedLockBoxIds] = useState([]);
  const [showOwnedLockBoxIds, setShowOwnedLockBoxIds] = useState(false);
  const [searchedLockBoxId, setSearchedLockBoxId] = useState("");
  const [lockBox, setLockBox] = useState({});
  const [snackBarMessage, setSnackBarMessage] = useState(null);

  async function initWeb3 () {
    try {
      // Get network provider and web3 instance.
      const _web3 = await getWeb3();

      // Get the contract instance.
      const networkId = await _web3.eth.net.getId();
      setEtherscanUrlBase(getEtherscanUrlBase(networkId));
      const deployedNetwork = EtherLockBoxContract.networks[networkId];
      const _contract = new _web3.eth.Contract(
        EtherLockBoxContract.abi,
        deployedNetwork && deployedNetwork.address
      );

      const _blockNumber = await _web3.eth.getBlockNumber();
      setBlockNumber(_blockNumber);

      _web3.currentProvider.publicConfigStore.on("update", async () => {
        setAccount(_web3.currentProvider.selectedAddress);
        const [_blockNumber, networkId] = await Promise.all([
          _web3.eth.getBlockNumber(),
          _web3.eth.net.getId()
        ]);
        setEtherscanUrlBase(getEtherscanUrlBase(networkId));
        setBlockNumber(_blockNumber);
      });

      setWeb3(_web3);
      setAccount(_web3.currentProvider.selectedAddress);
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
      setNoWeb3(true);
      console.error(error);
    }
  }

  const getOwnedLockBoxes = useCallback(async () => {
    const numOwnedLockBoxes = await contract.methods.getOwnedLockBoxesCount().call({
      from: account,
    });

    const newValues = [];
    for(let index = 0; index < numOwnedLockBoxes; index++) {
      const ownedLockBoxId = await contract.methods.getOwnedLockBoxId(index).call({
        from: account,
      });

      newValues.push(web3.utils.hexToUtf8(ownedLockBoxId));
    }
    setOwnedLockBoxIds(newValues);
  }, [contract, web3, account]);

  useEffect(() => {
    if(ready) {
      getOwnedLockBoxes();
    }
  }, [ready, getOwnedLockBoxes])

  const getLockBox = useCallback(async () => {
    if(lockBoxId) {
      window.history.pushState({}, "", `?lockBoxId=${lockBoxId}`);
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

    setSnackBarMessage(`Creating Lock Box`);
    try {
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
      setSnackBarMessage(null);
      getLockBox();
      getOwnedLockBoxes();
    } catch (error) {
      setSnackBarMessage(null);
    }
  }, [account, web3.utils, contract.methods, lockBoxId, getLockBox, getOwnedLockBoxes]);

  const handleUnlockLockBox = useCallback(async (answers) => {
    setSnackBarMessage("Unlocking Lock Box")
    try {
      await contract.methods.unlockLockBox(
        web3.utils.hexToBytes(web3.utils.utf8ToHex(lockBoxId)),
        answers,
      )
        .send({
          from: account
        });
      setSnackBarMessage(null);
      getLockBox();
    } catch (error) {
      setSnackBarMessage(null);
    }
  }, [account, web3.utils, contract.methods, lockBoxId, getLockBox])

  const handleSpendValue = useCallback(async (amount, to) => {
    setSnackBarMessage("Spending Value");
    try {
      await contract.methods.spendFromLockBox(
        web3.utils.hexToBytes(web3.utils.utf8ToHex(lockBoxId)),
        amount,
        to
      )
        .send({
          from: account,
        });
      setSnackBarMessage(null);
      getLockBox();
    } catch (error) {
      setSnackBarMessage(null);
    }
  }, [account, web3.utils, contract.methods, lockBoxId, getLockBox])

  const handleRedeemValue = useCallback(async (amount, to) => {
    setSnackBarMessage("Redeeming Value");
    try {
      await contract.methods.redeemLockBox(
        web3.utils.hexToBytes(web3.utils.utf8ToHex(lockBoxId)),
        amount,
        to
      )
        .send({
          from: account,
        });
      setSnackBarMessage(null);
      getLockBox();
    } catch (error) {
      setSnackBarMessage(null);
    }
  }, [account, web3.utils, contract.methods, lockBoxId, getLockBox])

  const handleAddValue = useCallback(async (amount) => {
    setSnackBarMessage("Adding Value");
    try {
      await contract.methods.addValue(
        web3.utils.hexToBytes(web3.utils.utf8ToHex(lockBoxId)),
      )
        .send({
          from: account,
          value: amount
        });
      setSnackBarMessage(null);
      getLockBox();
    } catch (error) {
      setSnackBarMessage(null);
    }
  }, [account, web3.utils, contract.methods, lockBoxId, getLockBox])

  const handleOwnedLockBoxIdSelected = (selectedLockBoxId) => {
    setSearchedLockBoxId(selectedLockBoxId);
    setLockBoxId(selectedLockBoxId);
    setShowOwnedLockBoxIds(false);
  }

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

  const isLocked = useMemo(() => {
    const unlockedAt = Number(lockBox.unlockedAt);
    return (!blockNumber || unlockedAt === 0 || unlockedAt > blockNumber)
  }, [lockBox, blockNumber]);

  const slicedAccount = useMemo(() => {
    if(!account) {
      return null;
    }
    return `0x${account.slice(2, 6).toUpperCase()}...${account.slice(-4).toUpperCase()}`
  }, [account]);

  return (
    <div
      className={styles.root}
    >
      <div className={clsx(styles.topBar)}>
        <div className={styles.topBarItemsLeft}>
          <Button
            href="https://etherlockbox.com"
            target="_blank"
            color="primary"
            endIcon={<OpenInNewIcon/>}
          >
            About
          </Button>
          <Button
            href={contract._address ? `${etherscanUrlBase}/address/${contract._address}` : etherscanUrlBase}
            target="_blank"
            color="primary"
            endIcon={<OpenInNewIcon/>}
          >
            Etherscan
          </Button>
          <Button
            href="https://github.com/ScaredIbis/etherlockbox"
            target="_blank"
            color="primary"
            endIcon={<OpenInNewIcon/>}
          >
            Github
          </Button>
        </div>
        <div className={styles.topBarItemsRight}>
          <Button
            color="secondary"
            disabled={ownedLockBoxIds.length === 0}
            onClick={() => setShowOwnedLockBoxIds(true)}
          >
            My Lockboxes
          </Button>
          <Button
            href={account ? `${etherscanUrlBase}/address/${account}` : etherscanUrlBase}
            target="_blank"
            color="primary"
            endIcon={<OpenInNewIcon/>}
          >
            {slicedAccount || "..."}
          </Button>
        </div>
      </div>
      <div className={styles.appContainer}>
        <div className={styles.hero}>
          <Typography variant="h4">{"\u{1F511}"} Ether Lock Box</Typography>
        </div>
        {
          noWeb3 ? (
            <div>
              <Typography variant="h6">
                Could not load web3.{" "}
                <Link href="https://metamask.io/" target="_blank">
                  Check out metamask.
                </Link>
              </Typography>
            </div>
          ) : null
        }
        { !ready && !noWeb3 ? (
            <div>
              <CircularProgress />
            </div>
        ) : null }
        {
          ready && !noWeb3 ? (
            <>
              <div className={styles.appContent}>
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
              </div>
              {
                lockBoxId && lockBox.createdAt === "0"
                  ? (
                    <Paper
                        className={clsx(styles.appContent, styles.formContainer)}
                        elevation={2}
                      >
                        <div className={styles.innerPaper}>
                          <NewLockBoxForm
                            lockBoxId={lockBoxId}
                            onSave={createLockBox}
                          />
                      </div>
                    </Paper>
                  )
                  : null
              }
              {
                lockBoxId && Number(lockBox.createdAt) > 0 ? (
                  <>
                    <Paper
                      className={clsx(styles.paper, styles.marginBottom, styles.appContent)}
                      elevation={2}
                    >
                      <div className={styles.innerPaper}>
                        <LockBox
                          blockNumber={blockNumber}
                          lockBox={lockBox}
                          lockBoxId={lockBoxId}
                          web3={web3}
                          account={account}
                          contract={contract}
                          handleRedeemValue={handleRedeemValue}
                          handleSpendValue={handleSpendValue}
                          handleAddValue={handleAddValue}
                        />
                      </div>
                    </Paper>
                    {
                      isLocked ? (
                        <Paper
                          className={clsx(styles.paper, styles.appContent)}
                          elevation={2}
                        >
                          <div className={styles.innerPaper}>
                            <UnlockLockBox
                              blockNumber={blockNumber}
                              lockBox={lockBox}
                              lockBoxId={lockBoxId}
                              web3={web3}
                              account={account}
                              contract={contract}
                              onUnlock={handleUnlockLockBox}
                            />
                          </div>
                        </Paper>
                      ) : null
                    }
                  </>
                ) : null
              }
          </>
          ) : null
        }
      </div>
      <Snackbar
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        open={snackBarMessage !== null}
        message={(
          <>
            <CircularProgress
              size={15}
              thickness={5}
              className={styles.snackBarProgress}
            />
            <Typography variant="body1" component="span">
              {snackBarMessage}
            </Typography>
          </>
        )}
        action={
          <React.Fragment>
            <IconButton size="small" aria-label="close" color="inherit" onClick={() => setSnackBarMessage(null)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </React.Fragment>
        }
      />
      <OwnedLockBoxIds
        lockBoxIds={ownedLockBoxIds}
        open={showOwnedLockBoxIds}
        onClose={() => setShowOwnedLockBoxIds(false)}
        handleLockBoxIdSelected={handleOwnedLockBoxIdSelected}
      />
      <Snackbar
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        open={snackBarMessage !== null}
        message={(
          <>
            <CircularProgress
              size={15}
              thickness={5}
              className={styles.snackBarProgress}
            />
            <Typography variant="body1" component="span">
              {snackBarMessage}
            </Typography>
          </>
        )}
        action={
          <React.Fragment>
            <IconButton size="small" aria-label="close" color="inherit" onClick={() => setSnackBarMessage(null)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </React.Fragment>
        }
      />
    </div>
  );
};

export default App;
