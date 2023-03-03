export interface Nft {
  token_id: string
  token_uri?: string
  owner?: string
  extension: NftExtension
}

export interface NftExtension {
  image: string
  image_data?: string
  external_url?: string
  description?: string
  name: string
  attributes: NftAttributes[]
  background_color?: string
  animation_url?: string
  youtube_url?: string
}

export interface NftAttributes {
  display_type?: string
  trait_type?: string
  value?: string
}
