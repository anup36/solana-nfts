import { mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { createSignerFromKeypair, Keypair, keypairIdentity, Umi } from '@metaplex-foundation/umi';
import * as path from 'path';
import * as fs from 'fs';
import * as config from "./config";
import { uploadImage, uploadMetadata, mintNft } from './utils';

let umi: Umi, creator: Keypair;

async function initializeUmi() {
    umi = createUmi(config.RPC_URL);
    const creatorWallet = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(config.WALLET_SECRET));
    creator = createSignerFromKeypair(umi, creatorWallet);
    umi.use(keypairIdentity(creator));
    umi.use(mplTokenMetadata());
}

const nftDetail = JSON.parse(fs.readFileSync(path.join(__dirname, './assets/metadata.json')).toString());

async function main() {
    try {

        await initializeUmi();
        const imageUri = await uploadImage(nftDetail);
        const metadataUri = await uploadMetadata(imageUri, nftDetail);
        await mintNft(metadataUri, nftDetail, umi, creator);

    } catch (e) {
        console.error('Error in main execution:', e);
    }
}

main();
