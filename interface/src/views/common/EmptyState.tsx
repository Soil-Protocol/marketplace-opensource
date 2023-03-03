import { Box, Typography } from '@mui/material'
import { quotes } from 'constants/quote'

import Image from 'next/image'
import { useMemo } from 'react'

export const EmptyState = () => {
  const randomQuote = useMemo(() => {
    const quoteIndex = Math.floor(Math.random() * quotes.length)
    return quotes[quoteIndex]
  }, [])

  return (
    <Box
      display="flex"
      marginTop="80px"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      width="100%"
    >
      <Image
        src="/static/images/empty_state_logo.png"
        alt="empty_state"
        layout="fixed"
        width={170}
        height={276}
      />
      <Typography marginTop="40px" key="quote">{randomQuote}</Typography>
    </Box>
  )
}
