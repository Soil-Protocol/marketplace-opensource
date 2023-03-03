import { Box, BoxProps } from '@mui/material'

export const Limit = (props: BoxProps) => (
  <Box maxWidth={1136} margin="auto" {...props}>
    {props.children}
  </Box>
)
