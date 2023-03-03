import styled from '@emotion/styled'
import MenuIcon from '@mui/icons-material/Menu'
import {
  AppBar,
  Box,
  Button,
  Container,
  IconButton,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
  Popover,
  Alert,
} from '@mui/material'
import { Routes } from 'constants/Routes'
import { includes } from 'lodash'
import { observer } from 'mobx-react-lite'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useMemo, useState, MouseEvent, useEffect } from 'react'
import { Footer } from './Footer'
import {
  ConnectType,
  useConnectedWallet,
  useWallet,
  WalletStatus,
} from '@terra-money/wallet-provider'
import { maskAddress } from 'utils/address.util'
import { Extension } from '@terra-money/terra.js'

const StyledAppBar = styled(AppBar)`
  background: transparent;
  z-index: ${(props) => props.theme.zIndex.drawer + 1};
`

const StyledPopover = styled(Popover)`
  border-radius: 0;
  background: transparent;
  margin-top: 1rem;
  .MuiPaper-root {
    border-radius: 0;
  }
`

const NavMenuBox = styled(Box)`
  & > * {
    margin-right: 0.5rem;
  }
`
type Props = {
  children: React.ReactNode
}

const MenuButton = ({ title, link }: { title: string; link: string }) => {
  const router = useRouter()
  const { pathname } = router
  return (
    <Box paddingX={2}>
      <Button
        variant="text"
        onClick={() => router.push(link)}
        style={{ borderBottom: pathname == link ? '4px solid #A3A1FF' : 'none', borderRadius: '0' }}
      >
        <Typography variant="body1" component="div" style={{ color: '#ffffff' }}>
          {title}
        </Typography>
      </Button>
    </Box>
  )
}

export const Navbar = observer((props: Props) => {
  const { children } = props

  const [isSidebarOpen, setSidebarOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState<HTMLElement>(null)

  const router = useRouter()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const sidebarHidden = includes(Routes.SIDEBAR_HIDDEN, router.pathname)

  const {
    status,
    network,
    wallets,
    availableConnectTypes,
    availableInstallTypes,
    connect,
    install,
    disconnect,
  } = useWallet()

  const connectedWallet = useConnectedWallet()

  const isReady = useMemo(() => {
    return status !== WalletStatus.INITIALIZING
  }, [status])

  const isConnected = useMemo(() => {
    return status === WalletStatus.WALLET_CONNECTED
  }, [status])

  const isTestnet = useMemo(() => {
    return status !== WalletStatus.INITIALIZING && network.name === 'testnet'
  }, [network, status])
  const isExtensionInstalled = useMemo(() => {
    return availableConnectTypes.includes(ConnectType.EXTENSION)
  }, [availableConnectTypes])

  useEffect(() => {
    if (isReady && isConnected && isExtensionInstalled) {
      const extension = new Extension()
      const intervalId = setInterval(async () => {
        const info = await extension.request('info')
        if (network.name !== info.payload['name']) {
          window.location.reload()
        }
      }, 1000)
      return () => {
        clearInterval(intervalId)
      }
    }
  }, [isReady, network])

  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (anchorEl !== null) {
      setAnchorEl(null)
    } else {
      setAnchorEl(event.currentTarget)
    }
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const TestnetBar = styled(Alert)`
    border-radius: 0%;
    background-color: #ff0033;
    justify-content: center;
  `
  return (
    <>
      <Box display="flex" position="sticky" top="0" flexDirection="column" zIndex={999}>
        {isTestnet && (
          <TestnetBar icon={false}>
            <Typography>
              You're on{' '}
              <span style={{ textDecoration: 'underline', fontWeight: 700 }}>
                {network.chainID}
              </span>{' '}
              testnet
            </Typography>
          </TestnetBar>
        )}
      </Box>
      <Container fixed>
        <StyledAppBar position="static">
          <Toolbar style={{ paddingLeft: 0, paddingRight: 0 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" flex={1}>
              <Box display="flex" alignItems="flex-end">
                <Box marginRight={2}>
                  {isMobile && !sidebarHidden ? (
                    <IconButton edge="start" onClick={() => setSidebarOpen(true)} size="large">
                      <MenuIcon fontSize="large" />
                    </IconButton>
                  ) : (
                    <Link href="/" passHref>
                      <Box component="a" display="flex">
                        <Image src="/static/images/logo.png" width={162} height={35} />
                      </Box>
                    </Link>
                  )}
                </Box>
                <MenuButton title="Marketplace" link="/" />
                <MenuButton title="My NFT" link="/my-nft" />
              </Box>
              <Box>
                <button type="button" className="nes-btn is-primary" onClick={handleMenuClick}>
                  <Typography>
                    {isConnected ? maskAddress(connectedWallet.walletAddress) : 'Connect'}
                  </Typography>
                </button>
                <StyledPopover
                  anchorEl={anchorEl}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                  open={Boolean(anchorEl)}
                  onClose={handleClose}
                >
                  {isConnected ? (
                    <Box display="flex" flexDirection="column">
                      <button
                        type="button"
                        className="nes-btn"
                        onClick={() => {
                          disconnect()
                          setAnchorEl(null)
                        }}
                      >
                        <Typography color="black">Disconnect</Typography>
                      </button>
                    </Box>
                  ) : (
                    <Box display="flex" flexDirection="column">
                      {isExtensionInstalled && (
                        <button
                          type="button"
                          className="nes-btn"
                          onClick={() => {
                            connect(ConnectType.EXTENSION)
                            setAnchorEl(null)
                          }}
                        >
                          <Typography color="black">Chrome Extension</Typography>
                        </button>
                      )}
                      <button
                        type="button"
                        className="nes-btn"
                        onClick={() => {
                          connect(ConnectType.WALLETCONNECT)
                          setAnchorEl(null)
                        }}
                      >
                        <Typography color="black">Mobile</Typography>
                      </button>
                    </Box>
                  )}
                </StyledPopover>
              </Box>
            </Box>
          </Toolbar>
        </StyledAppBar>
        <Box minHeight="100vh" marginTop={2}>
          <img
            src="/static/images/knowhere-bg_2x.webp"
            style={{
              minHeight: '100%',
              minWidth: '1024px',
              width: '100%',
              height: 'auto',
              objectFit: 'cover' as any,
              position: 'fixed' as any,
              top: 0,
              left: 0,
              zIndex: -200,
            }}
          />

          {isReady && children}
          <Footer />
        </Box>
      </Container>
    </>
  )
})
