export const isAddress = (address: string): boolean => {
  return address.startsWith('terra') && address.length === 44
}

export const maskAddress = (address: string): string => {
  if (!isAddress) {
    return address
  }
  return address.substr(0, 5) + '...' + address.substr(-5, 5)
}
