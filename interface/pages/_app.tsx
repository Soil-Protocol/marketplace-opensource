// import App, { AppProps, AppContext } from 'next/app'

import 'react-toastify/dist/ReactToastify.css'
import 'styles/asteroid.scss'
import 'styles/rarity-card.scss'
import './../src/styles.css'

import { ThemeProvider as EmotionThemeProvider } from '@emotion/react'
import { CssBaseline } from '@mui/material'
import { StylesProvider, ThemeProvider as MaterialThemeProvider } from '@mui/styles'
import { CoreSpinner } from 'core/CoreSpinner'
import { GlobalStyle } from 'GlobalStyle'
import { AppProps } from 'next/app'
import Head from 'next/head'
import { createContext, useContext, useEffect } from 'react'
import { ToastContainer } from 'react-toastify'
import { theme } from 'theme'
import { GlobalDialog } from 'views/common/GlobalDialog'
import { GlobalSpinner } from 'views/common/GlobalSpinner'
import { Navbar } from 'views/common/Navbar'
import { WalletProvider, StaticWalletProvider } from '@terra-money/wallet-provider'
import { Networks, walletConnectChainIds } from 'constants/networks'
import ReactGA from 'react-ga'

if (typeof window !== 'undefined') {
  ReactGA.initialize(process.env.NEXT_PUBLIC_GA)
  ReactGA.pageview(window.location.pathname + window.location.search)
}

const TerraWalletProvider = ({ children }) => {
  const isBrowser = typeof window !== 'undefined'

  return isBrowser ? (
    <WalletProvider defaultNetwork={Networks.mainnet} walletConnectChainIds={walletConnectChainIds}>
      {children}
    </WalletProvider>
  ) : (
    <StaticWalletProvider defaultNetwork={Networks.mainnet}>{children}</StaticWalletProvider>
  )
}
const CustomApp = ({ Component, pageProps }: AppProps) => {
  useEffect(() => {
    const jssStyles = document.querySelector('#jss-server-side')
    if (jssStyles) {
      jssStyles.parentElement.removeChild(jssStyles)
    }
  }, [])

  return (
    <>
      {Array.from({ length: 10 }).map((n, i) => {
        return <div className={`asteroid ${`asteroid-${i + 1}`}`} key={`asteroid_${i}`} />
      })}
      <Head>
        <title>KNOWHERE</title>
      </Head>
      <GlobalStyle />
      <StylesProvider injectFirst>
        <MaterialThemeProvider theme={theme}>
          <EmotionThemeProvider theme={theme}>
            <TerraWalletProvider>
              <CssBaseline />
              <GlobalSpinner />
              <GlobalDialog />
              <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar
                pauseOnFocusLoss={false}
                closeButton={false}
                icon={false}
              />
              <Navbar>
                <Component {...pageProps} />
              </Navbar>
            </TerraWalletProvider>
          </EmotionThemeProvider>
        </MaterialThemeProvider>
      </StylesProvider>
    </>
  )
}

// Only uncomment this method if you have blocking data requirements for
// every single page in your application. This disables the ability to
// perform automatic static optimization, causing every page in your app to
// be server-side rendered.
//
// CustomApp.getInitialProps = async (appContext: AppContext) => {
//   // calls page's `getInitialProps` and fills `appProps.pageProps`
//   const appProps = await App.getInitialProps(appContext);
//
//   return { ...appProps }
// }

export default CustomApp
