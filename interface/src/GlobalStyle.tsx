import { Global, css } from '@emotion/react'

const styles = css`
  /* html {
    background-color: transparent;
    background-image: url('/static/images/knowhere-bg_2x.png');
    background-size: 100vw 100vh;
    background-attachment: fixed;
    @media only screen and (max-width: 960px) and (orientation: landscape) {
    }
  } */

  body {
    padding: 0;
  }

  a {
    color: inherit;
    text-decoration: none;
    cursor: pointer;
  }

  option {
    background-color: #150047;
  }

  *,
  *:before,
  *:after {
    -webkit-overflow-scrolling: touch;
  }

  /* Chrome, Safari, Edge, Opera */
  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  /* Firefox */
  input[type='number'] {
    -moz-appearance: textfield;
  }

  textarea:focus,
  input:focus {
    outline: none;
  }

  .Toastify {
    @media only screen and (max-width: 480px) {
      .Toastify__toast-container {
        margin: auto;
        left: 0;
        right: 0;
        width: 320px;
      }
    }
    .Toastify__toast-container--top-right {
      top: 3.5rem;
      width: 350px;
    }

    .Toastify__toast {
      border-radius: 0;
      padding: 0;
      border: 2px solid white;
      background: #54c7ec;
    }

    .Toastify__toast-body {
      margin: auto 0.5rem;
    }

    .Toastify__toast--error {
      background: #ff0033;
    }
  }

  .hover-pointer {
    &:hover {
      cursor: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAzElEQVRYR+2X0Q6AIAhF5f8/2jYXZkwEjNSVvVUjDpcrGgT7FUkI2D9xRfQETwNIiWO85wfINfQUEyxBG2ArsLwC0jioGt5zFcwF4OYDPi/mBYKm4t0U8ATgRm3ThFoAqkhNgWkA0jJLvaOVSs7j3qMnSgXWBMiWPXe94QqMBMBc1VZIvaTu5u5pQewq0EqNZvIEMCmxAawK0DNkay9QmfFNAJUXfgGgUkLaE7j/h8fnASkxHTz0DGIBMCnBeeM7AArpUd3mz2x3C7wADglA8BcWMZhZAAAAAElFTkSuQmCC')
          14 0,
        pointer;
    }
  }

  .nes-btn {
    border-color: white;
    color: white;
  }

  .nes-input {
    border-image-repeat: stretch !important;
  }

  .nes-container {
    position: relative;
    padding: 1.5rem 2rem;
    border-color: #fff;
    border-style: solid;
    border-width: 4px;
  }

  .nes-container.is-rounded {
    border-image-slice: 3;
    border-image-width: 3;
    border-image-repeat: stretch !important;
    border-image-source: url('data:image/svg+xml;utf8,<?xml version="1.0" encoding="UTF-8" ?><svg version="1.1" width="8" height="8" xmlns="http://www.w3.org/2000/svg"><path d="M3 1 h1 v1 h-1 z M4 1 h1 v1 h-1 z M2 2 h1 v1 h-1 z M5 2 h1 v1 h-1 z M1 3 h1 v1 h-1 z M6 3 h1 v1 h-1 z M1 4 h1 v1 h-1 z M6 4 h1 v1 h-1 z M2 5 h1 v1 h-1 z M5 5 h1 v1 h-1 z M3 6 h1 v1 h-1 z M4 6 h1 v1 h-1 z" fill="white" /></svg>') !important;
    border-image-outset: 2;
    padding: 1rem 1.5rem;
    margin: 4px;
  }

  section > canvas {
    display: block;
    margin: 0 auto;
  }
`

export const GlobalStyle = () => <Global styles={styles} />
