import styled from '@emotion/styled'
import { CircularProgress } from '@mui/material'

const Wrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(255, 255, 255, 0.4);
  z-index: ${(props) => props.theme.zIndex.tooltip + 1};
`

type Props = {
  open?: boolean
}

export const CoreSpinner = (props: Props) => {
  const { open = true } = props

  return (
    open && (
      <Wrapper>
        <CircularProgress />
      </Wrapper>
    )
  )
}
