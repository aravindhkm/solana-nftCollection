import { Keypair, Connection, PublicKey, Transaction, SystemProgram } from "@solana/web3.js";
import base58 from "bs58";
import fs from "fs";
import {
  createAssociatedTokenAccountInstruction,
  createInitializeMintInstruction,
  createMintToCheckedInstruction,
  getAssociatedTokenAddress,
  getMinimumBalanceForRentExemptMint,
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  PROGRAM_ID as MPL_TOKEN_METADATA_PROGRAM_ID,
  createCreateMetadataAccountInstruction,
  createCreateMasterEditionInstruction,
} from "@metaplex-foundation/mpl-token-metadata";


let connection = new Connection("https://api.devnet.solana.com");

// 5pVyoAeURQHNMVU7DmfMHvCDNmTEYXWfEwc136GYhTKG
const pathToMyKeypair = process.env.HOME + "/.config/solana/id.json";
const keypairFile = fs.readFileSync(pathToMyKeypair);
const secretKey = Buffer.from(JSON.parse(keypairFile.toString()));
const payer = Keypair.fromSecretKey(secretKey); 
const feePayer = payer;

(async () => {
  let mint = Keypair.generate();
  console.log(`mint: ${mint.publicKey.toBase58()}`);

  let ata = await getAssociatedTokenAddress(mint.publicKey, feePayer.publicKey);

  let tokenMetadataPubkey = await getMetadataPDA(mint.publicKey);

  let masterEditionPubkey = await getMasterEditionPDA(mint.publicKey);

  let tx = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: feePayer.publicKey,
      newAccountPubkey: mint.publicKey,
      lamports: await getMinimumBalanceForRentExemptMint(connection),
      space: MINT_SIZE,
      programId: TOKEN_PROGRAM_ID,
    }),
    createInitializeMintInstruction(mint.publicKey, 0, feePayer.publicKey, feePayer.publicKey),
    createAssociatedTokenAccountInstruction(feePayer.publicKey, ata, feePayer.publicKey, mint.publicKey),
    createMintToCheckedInstruction(mint.publicKey, ata, feePayer.publicKey, 1, 0),
    createCreateMetadataAccountInstruction(
      {
        metadata: tokenMetadataPubkey,
        mint: mint.publicKey,
        mintAuthority: feePayer.publicKey,
        payer: feePayer.publicKey,
        updateAuthority: feePayer.publicKey,
      },
      {
        createMetadataAccountArgs: {
          data: {
            name: "Fake SMS #1355",
            symbol: "FSMB",
            uri: "https://34c7ef24f4v2aejh75xhxy5z6ars4xv47gpsdrei6fiowptk2nqq.arweave.net/3wXyF1wvK6ARJ_9ue-O58CMuXrz5nyHEiPFQ6z5q02E",
            sellerFeeBasisPoints: 100,
            creators: [
              {
                address: feePayer.publicKey,
                verified: true,
                share: 100,
              },
            ],
          },
          isMutable: true,
        },
      }
    ),
    createCreateMasterEditionInstruction(
      {
        edition: masterEditionPubkey,
        mint: mint.publicKey,
        updateAuthority: feePayer.publicKey,
        mintAuthority: feePayer.publicKey,
        payer: feePayer.publicKey,
        metadata: tokenMetadataPubkey,
      },
      {
        createMasterEditionArgs: {
          maxSupply: 0,
        },
      }
    )
  );

  console.log(await connection.sendTransaction(tx, [feePayer, mint]));
})();

async function getMetadataPDA(mint: PublicKey): Promise<PublicKey> {
  const [publicKey] = await PublicKey.findProgramAddress(
    [Buffer.from("metadata"), MPL_TOKEN_METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    MPL_TOKEN_METADATA_PROGRAM_ID
  );
  return publicKey;
}

async function getMasterEditionPDA(mint: PublicKey): Promise<PublicKey> {
  const [publicKey] = await PublicKey.findProgramAddress(
    [Buffer.from("metadata"), MPL_TOKEN_METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer(), Buffer.from("edition")],
    MPL_TOKEN_METADATA_PROGRAM_ID
  );
  return publicKey;
}