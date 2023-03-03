import { Box, Typography } from '@mui/material'
import { IconType } from 'react-icons/lib'

const JoinIcon = ({ Icon, url }: { Icon: IconType; url: string }) => {
  const onClick = () => {
    window.open(url, '_blank').focus()
  }
  return (
    <Box
      className="hover-pointer"
      style={{
        margin: '0 0 0 10px',
        background: '#FFFFFF2F',
        borderRadius: '35px',
        width: '30px',
        height: '30px',
        padding: '1px 0 0 7px',
      }}
      onClick={onClick}
    >
      <Icon />
    </Box>
  )
}

export const Footer = () => {
  return (
    <Box paddingY={7} display="flex" justifyContent="space-between" alignItems="center">
      <Typography variant="subtitle1" component="div" color="textPrimary">
        © 2021 Knowhere. All rights reserved
      </Typography>
      <Box display="flex" color="white" alignItems="center">
        <Typography variant="subtitle1" component="div" color="textPrimary">
          Join our community
        </Typography>
      </Box>
    </Box>
  )
}
