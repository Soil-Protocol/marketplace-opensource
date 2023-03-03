import { Auction } from 'interfaces/auction.interface'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useQueryService } from './useQueryService'

type Options = {
  polling?: boolean
  interval?: number
}

export const useAuctionQuery = (auctionId: string, options: Options = {}) => {
  const { polling = false, interval = 3000 } = options

  const [data, setData] = useState<Auction>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const pollingRef = useRef<NodeJS.Timer | null>(null)

  const { queryAuctionById } = useQueryService()

  const fetch = useCallback(async () => {
    if (!auctionId) return
    // setLoading(true)
    try {
      const response = await queryAuctionById(auctionId)
      setData(response)
      // setLoading(false)
      // setError(null)
    } catch (e) {
      // setData(null)
      // setLoading(false)
      // setError(e)
    }
  }, [auctionId])

  useEffect(() => {
    if (polling) {
      fetch()
      pollingRef.current = setInterval(fetch, interval)
      return () => {
        clearInterval(pollingRef.current)
        setData(null)
        // setLoading(false)
        // setError(null)
      }
    } else {
      fetch()
    }
  }, [auctionId])

  return data
}
