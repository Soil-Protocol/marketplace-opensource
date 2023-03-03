import { ConnectType, useWallet } from '@terra-money/wallet-provider'
import { useMemo, useState } from 'react'

export const useSetup = () => {
  const [isReady, setIsReady] = useState(true)
  const { availableConnectTypes } = useWallet()

  const isExtensionInstall = useMemo(() => {
    return availableConnectTypes.includes(ConnectType.EXTENSION)
  }, [])

  return { isReady, isExtensionInstall }
}
