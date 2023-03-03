import styled from '@emotion/styled'
import { CSSProperties } from '@mui/styles'

const Wrapper = styled.div<{ ratio: number }>`
  position: relative;
  width: 100%;
  height: 0;
  padding-top: ${(props) => (1 / props.ratio) * 100}%;
  box-sizing: content-box;
`

const Content = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
`

type Props = {
  /**
   * Aspect width / height ratio
   */
  ratio?: number
  contentStyle?: React.CSSProperties
  children?: React.ReactNode
}

export const AspectRatio = (props: Props) => {
  const { children, ratio = 1, contentStyle, ...restProps } = props

  return (
    <Wrapper ratio={ratio} {...restProps}>
      <Content style={contentStyle as any}>{children}</Content>
    </Wrapper>
  )
}
