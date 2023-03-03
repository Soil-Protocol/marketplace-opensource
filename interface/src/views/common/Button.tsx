import { Box, Theme } from '@mui/material'
import { makeStyles } from '@mui/styles'

const useStyles = makeStyles<Theme>((theme) => ({
  baseButton: {
    color: theme.palette.text.primary,
    borderRadius: '24px',
    fontSize: '14px',
    minWidth: 180,
    textAlign: 'center',
    border: '1px solid black',
  },
  // gradient: {
  //   background: 'linear-gradient(94.65deg, #EC6740 3.76%, #1E1832 97.79%)',
  // },
  // outlined: {
  //   border: '1px solid #ffffff',
  // },
  // big: {
  //   height: '40px',
  //   padding: '8px 12px',
  // },
  // medium: {
  //   height: '32px',
  //   padding: '5.5px 12px',
  // },
}))

export const BaseButton = ({ children }: { children: any }) => {
  const classes = useStyles()
  // const sizeClass = type === 'big' ? classes.big : classes.medium
  // const buttonTypeClass = type === 'outlined' ? classes.outlined : classes.gradient
  // const buttonClasses = `${sizeClass} ${buttonTypeClass} ${classes.baseButton}`
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      width="100%"
      className={classes.baseButton}
    >
      {children}
    </Box>
  )
}
