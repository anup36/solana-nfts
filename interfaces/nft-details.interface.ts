export interface NftDetails{
    name: string,
    symbol: string,
    uri: string,
    royalties: number,
    description: string,
    imgType: string,
    attributes: [
        { trait_type: string, value: string }
    ]
}