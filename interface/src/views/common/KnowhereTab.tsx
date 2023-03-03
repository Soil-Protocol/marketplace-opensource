import { Box, styled, Tab, Tabs, TabProps } from '@mui/material'
import React from 'react'

interface StyledTabProps {
  label: string
}

export const KnowhereTabs = styled(Tabs)({
  '& .MuiTabs-indicator': {
    backgroundColor: '#1890ff',
    height: '3px',
  },
})

export const KnowhereTab = styled((props: StyledTabProps & TabProps) => (
  <Tab disableRipple {...props} />
))(({ theme }) => ({
  textTransform: 'none',
  minWidth: 0,
  fontSize: 12,
  fontWeight: theme.typography.fontWeightRegular,
  color: 'white',
  '&:focus': {
    outline: 'none',
  },
  '&:hover': {
    outline: 'none',
  },
  '&.Mui-selected': {
    color: '#1890ff',
    fontWeight: theme.typography.fontWeightMedium,
  },
  padding: '0',
  marginRight: theme.spacing(4),
}))

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

export const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props

  return (
    <Box role="tabpanel" width="100%" hidden={value !== index} {...other}>
      {value === index && <Box>{children}</Box>}
    </Box>
  )
}
