import styled from '@emotion/styled'
import {
  useState, useRef, useEffect, useMemo,
} from 'react'
import { Box, Typography } from '@mui/material'
import { denomToSymbol } from 'utils/currency.util'

const InputLuna = ({ onChange, value }) => (
  <Box
    style={{ background: 'transparent', width: '100%' }}
    className="nes-field is-inline"
    position="relative"
  >
    <img
      src="/static/icons/luna.png"
      style={{
        width: 24,
        height: 24,
        position: 'absolute' as 'absolute',
        left: 16,
      }}
    />
    <input
      onChange={(e) => onChange(e?.target?.value)}
      type="number"
      value={value}
      className="nes-input is-dark"
      style={{
        fontSize: 16,
        background: 'transparent',
        paddingTop: 10,
        paddingBottom: 10,
        paddingLeft: 50,
        width: '100%',
      }}
      placeholder="0.00"
    />
  </Box>
)

const InputNonLuna = ({ onChange, value, denom }: { onChange: (val) => any, value: any, denom: string }) => (
  <Box
    style={{ background: 'transparent', width: '100%' }}
    className="nes-field is-inline"
    position="relative"
  >
    <input
      onChange={(e) => onChange(e?.target?.value)}
      type="number"
      value={value}
      className="nes-input is-dark"
      style={{
        fontSize: 16,
        background: 'transparent',
        paddingTop: 10,
        paddingBottom: 10,
        paddingRight: 50,
        width: '100%',
      }}
      placeholder="0.00"
    />
    <Typography
      style={{
        position: 'absolute' as 'absolute',
        right: 24,
      }}
    >
      { denomToSymbol(denom) }
    </Typography>
  </Box>
)

export const CurrencyInput = ({ onChange, value, denom }: { onChange: (val) => any, value: any, denom: string }) => (
  <Box width="100%">
    {
      denom == 'uluna'
      ? <InputLuna onChange={onChange} value={value} />
      : <InputNonLuna onChange={onChange} denom={denom} value={value} />
    }
  </Box>
)
