import { useEffect, useRef, useCallback, useState } from 'react'
import { useWallet } from '@terra-money/wallet-provider'
import { Box, Typography } from '@mui/material'
import { toast } from 'react-toastify'
import { useQueryService } from './useQueryService'
import { TxInfo } from '@terra-money/terra.js'

type PollOptions = {
  interval?: number
  submittedText?: string
  successText?: string
  revertText?: string
  showSuccessAlert?: boolean
  showRevertAlert?: boolean
  onSuccess?: (txInfo: TxInfo) => void
  onRevert?: (txInfo: TxInfo) => void
}

const defaultPollOptions: PollOptions = {
  interval: 3000,
  submittedText: 'Transaction Submitted',
  successText: 'Transaction Success',
  revertText: 'Transaction Revert',
  showSuccessAlert: true,
  showRevertAlert: true,
  onSuccess: (_txInfo: TxInfo) => {},
  onRevert: (_txInfo: TxInfo) => {},
}

export const useResultPolling = (options: PollOptions = {}) => {
  const { network } = useWallet()
  const { lcdClient } = useQueryService()

  const [txInfo, setTxInfo] = useState<TxInfo>(null)
  const [polling, setPolling] = useState(false)
  const [error, setError] = useState(null)
  const txPollingRef = useRef<NodeJS.Timer>(null)

  const showTxSubmitted = useCallback(
    (txHash: string, text = 'TX Submitted') => {
      const finderUrl = `https://finder.terra.money/${network.chainID}/tx/${txHash}`
      toast(() => (
        <Box display="flex" flexDirection="column">
          <Typography variant="h4" className="nes-text">
            {text}
          </Typography>
          <a className="nes-text is-primary" href={finderUrl} target="_blank" rel="noreferrer">
            <Typography variant="subtitle2">View on finder</Typography>
          </a>
        </Box>
      ))
    },
    [network],
  )

  const pollTxInfo = useCallback(
    (txHash: string, options: PollOptions = {}) => {
      const {
        interval,
        successText,
        revertText,
        showSuccessAlert,
        showRevertAlert,
        onSuccess,
        onRevert,
      } = {
        ...defaultPollOptions,
        ...options,
      }
      const intervalId = setInterval(async () => {
        setPolling(true)
        try {
          const finderUrl = `https://finder.terra.money/${network.chainID}/tx/${txHash}`
          const txInfo = await lcdClient.tx.txInfo(txHash)
          if (txInfo.logs) {
            // Tx success
            if (showSuccessAlert) {
              toast(() => (
                <Box display="flex" flexDirection="column">
                  <Typography variant="h4" className="nes-text">
                    {successText}
                  </Typography>
                  <a
                    className="nes-text is-primary"
                    href={finderUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Typography variant="subtitle2">View on finder</Typography>
                  </a>
                </Box>
              ))
            }
            onSuccess(txInfo)
          } else {
            // Tx revert
            if (showRevertAlert) {
              toast.error(() => (
                <Box display="flex" flexDirection="column">
                  <Typography variant="h4" className="nes-text">
                    {revertText}
                  </Typography>
                  <a
                    className="nes-text is-primary"
                    href={finderUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Typography variant="subtitle2">View on finder</Typography>
                  </a>
                </Box>
              ))
            }
            onRevert(txInfo)
          }
          setPolling(false)
          setTxInfo(txInfo)
          setError(null)
          clearInterval(intervalId)
        } catch (error) {
          setPolling(false)
          setTxInfo(null)
          setError(error)
          if (txPollingRef.current !== intervalId) {
            clearInterval(intervalId)
          }
        }
      }, interval)
      txPollingRef.current = intervalId
    },
    [network],
  )

  const stopPolling = useCallback(() => {
    if (txPollingRef.current) {
      clearInterval(txPollingRef.current)
    }
  }, [txPollingRef.current])

  return { txInfo, polling, error, pollTxInfo, stopPolling, showTxSubmitted }
}
