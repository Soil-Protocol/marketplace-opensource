import { css } from '@emotion/react'
import styled from '@emotion/styled'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogProps,
  DialogTitle,
  Typography,
} from '@mui/material'
import React from 'react'

const StyledDialog = styled(Dialog)`
  ${(props) => css`
    .MuiDialog-paper {
      min-width: 360px;
    }

    ${props.theme.breakpoints.down('sm')} {
      .MuiDialog-paper {
        min-width: 0;
      }
    }
  `}
`

const StyledDialogActions = styled(DialogActions)<{ divider: boolean }>`
  padding: 0.8rem 1rem;
  border-top: ${(props) => (props.divider ? '1px solid #e5e5e5' : 'none')};
`

const StyledDialogTitle = styled(DialogTitle)<{ center: boolean }>`
  & > .MuiTypography-root {
    font-weight: bold;
    color: ${(props) => props.theme.palette.text.primary};
    text-align: ${(props) => (props.center ? 'center' : 'left')};
  }
`

const StyledDialogContent = styled(DialogContent)<{ divider: boolean }>`
  padding: 0 1.5rem ${(props) => (props.divider ? '1.5rem' : '1rem')};
`

export type Props = {
  title?: string
  onOk?: (close?: (...args: any) => void) => void
  onClose?: () => void
  okText?: string
  cancelText?: string
  divider?: boolean
  center?: boolean
  children: React.ReactNode
}

export const CoreDialog = (props: DialogProps & Props) => {
  const {
    children,
    title,
    center,
    onClose,
    onOk,
    okText = 'ตกลง',
    cancelText,
    divider = false,
    ...restProps
  } = props

  const handleClose = () => {
    onClose?.()
  }

  const handleOk = () => {
    onOk?.(onClose)
  }

  if (!children) {
    return null
  }

  return (
    <StyledDialog onClose={onClose} {...restProps}>
      {title && <StyledDialogTitle center={center}>{title}</StyledDialogTitle>}
      <StyledDialogContent divider={divider}>
        {typeof children === 'string' ? (
          <Typography
            variant="body1"
            color="textPrimary"
            align={center ? 'center' : 'left'}
          >
            {children}
          </Typography>
        ) : (
          children
        )}
      </StyledDialogContent>
      <StyledDialogActions divider={divider}>
        {cancelText && (
          <Button onClick={handleClose} variant="contained" style={{ minWidth: 100 }}>
            {cancelText}
          </Button>
        )}
        <Button
          style={{ minWidth: 100 }}
          onClick={handleOk}
          variant="contained"
          color="primary"
        >
          {okText}
        </Button>
      </StyledDialogActions>
    </StyledDialog>
  );
}
