const denomMapping = {
  uluna: 'LUNA',
  uusd: 'UST',
  uaud: 'AUD',
  ucad: 'CAD',
  uchf: 'CHF',
  ucny: 'CNY',
  udkk: 'DKK',
  ueur: 'EUR',
  ugbp: 'GBP',
  uhkd: 'HKD',
  uidr: 'IDR',
  uinr: 'INR',
  ujpy: 'JPY',
  ukrw: 'KRW',
  umnt: 'MNT',
  unok: 'NOK',
  uphp: 'PHP',
  usdr: 'SDR',
  usek: 'SEK',
  usgd: 'SGD',
  uthb: 'THB',
}

export const denomToSymbol = (denom: string): string => {
  return denomMapping[denom] || denom
}
