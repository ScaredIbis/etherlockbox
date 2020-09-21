import React from "react";
import ReactDOM from "react-dom";
import { createMuiTheme } from '@material-ui/core/styles';
import { ThemeProvider } from '@material-ui/styles';
import { cyan } from '@material-ui/core/colors';
import "./index.css";
import App from "./App";
import * as serviceWorker from "./serviceWorker";

const theme = createMuiTheme({
  palette: {
      primary: {
      main: cyan[700],
    },
    secondary: {
      main: '#f4511e',
    },
  },
  overrides: {
    MuiPaper: {
      rounded: {
        borderRadius: 16,
      },
    },
    MuiButton: {
      root: {
        borderRadius: 12,
      },
    },
    MuiOutlinedInput: {
      root: {
        borderRadius: 16,
      },
    },
  },
});

const Providers = () => (
  <ThemeProvider theme={theme}>
    <App/>
  </ThemeProvider>
)

ReactDOM.render(<Providers />, document.getElementById("root"));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
