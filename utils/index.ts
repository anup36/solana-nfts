import { generateSigner, Keypair, percentAmount, Umi } from '@metaplex-foundation/umi';
import { createNft } from '@metaplex-foundation/mpl-token-metadata';
import {NftDetails} from '../interfaces/nft-details.interface';
import pinataSDK from '@pinata/sdk';
import * as config from "../config";
import * as fs from 'fs';

const pinata = new pinataSDK(config.PINATA_API_KEY, config.PINATA_SECRET_KEY);

export async function uploadImage(nftDetail: NftDetails): Promise<string> {
    try {
        const imgDirectory = './assets';
        const imgName = 'image.png';
        const filePath = `${imgDirectory}/${imgName}`;
        const image = fs.createReadStream(filePath);

        const { IpfsHash } = await pinata.pinFileToIPFS(image, {
            pinataMetadata: {
                name: nftDetail.name,
            }
        });
        const imgUri = `https://ipfs.io/ipfs/${IpfsHash}`;
        console.log('Uploaded image:', imgUri);
        return imgUri;
    } catch (e) {
        console.error('Error uploading image:', e);
        throw e;
    }
}

export async function uploadMetadata(imageUri: string, nftDetail: NftDetails): Promise<string> {
    try {
        const metadata = {
            name: nftDetail.name,
            description: nftDetail.description,
            image: imageUri,
            attributes: nftDetail.attributes,
            properties: {
                files: [
                    {
                        type: nftDetail.imgType,
                        uri: imageUri,
                    },
                ]
            }
        };

        const metadataHash = await pinata.pinJSONToIPFS(metadata, {
            pinataMetadata: {
                name: nftDetail.symbol,
            }
        });
        const metadataUri = `https://ipfs.io/ipfs/${metadataHash.IpfsHash}`;
        console.log('Uploaded metadata:', metadataUri);
        return metadataUri;
    } catch (e) {
        console.error('Error uploading metadata:', e);
        throw e;
    }
}

export async function mintNft(metadataUri: string, nftDetail: NftDetails, umi: Umi, creator: Keypair) {
    try {
        const mint = generateSigner(umi);
        await createNft(umi, {
            mint,
            name: nftDetail.name,
            symbol: nftDetail.symbol,
            uri: metadataUri,
            sellerFeeBasisPoints: percentAmount(nftDetail.royalties, 2),
            creators: [{ address: creator.publicKey, verified: true, share: 100 }],
        }).sendAndConfirm(umi);

        console.log(`Created NFT: ${mint.publicKey.toString()}`);
    } catch (e) {
        console.error('Error minting NFT:', e);
        throw e;
    }
}