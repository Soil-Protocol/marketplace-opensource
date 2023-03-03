import { Box, Typography } from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import { BaseButton } from './Button'

const useStyles = makeStyles((theme) => ({
  baseCard: {
    height: '200px',
    width: '100%',
    border: '1px solid black',
    padding: '20px',
    minWidth: '0',
    flexWrap: 'wrap',
  },
  cover: {
    width: '100%',
    height: '80%',
  },
  lower: {
    height: '20%',
  },
}))

export const NFTCard = () => {
  const classes = useStyles()
  return (
    <Box className={classes.baseCard}>
      <img className={classes.cover} src="https://via.placeholder.com/150/000000/FFFFFF/?text=APE ME" />
      <Box className={classes.lower} display="flex" justifyContent="space-between">
        <Typography>
          Last Bid: 100 LUNA
        </Typography>
        <BaseButton>
          APE
        </BaseButton>
      </Box>
    </Box>
  )
}
