interface Window {
  _firebase: firebase
}

namespace JSX {
  interface IntrinsicAttributes extends React.Attributes {
    id?: string
    className?: string
    style?: CSSProperties
    onClick?: (...args: any) => any
  }
}

declare module '*.svg'
declare module '*.png'
declare module '*.jpg'

type Override<T, U> = Pick<T, Exclude<keyof T, keyof U>> & U
