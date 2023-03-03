import { ipfsBaseUri } from 'constants/ipfs'

export const formatImageURL = (url) =>
  url
    ? (url.startsWith('ipfs://')
        ? ipfsBaseUri + url.split('ipfs://')[1]
        : url) || '/static/images/default.png'
    : '/static/images/default.png'
