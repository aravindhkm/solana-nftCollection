import {
  createCreateMasterEditionV3Instruction,
  CreateMasterEditionV3InstructionAccounts,
  CreateMasterEditionArgs,
  CreateMasterEditionInstructionArgs,
} from "@metaplex-foundation/mpl-token-metadata";
import {
  Connection,
  PublicKey,
  clusterApiUrl,
  Transaction,
  sendAndConfirmTransaction,
  Keypair,
} from "@solana/web3.js";
import hashList from "./hashlist.json";
import fs from "fs";

const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

(async function() {
  const pathToMyKeypair = process.env.HOME + "/.config/solana/id.json";
// const one = process.env.HOME + "/.config/solana/phantomtwo.json";
// const two = process.env.HOME + "/.config/solana/phantomthree.json"; 
const keypairFile = fs.readFileSync(pathToMyKeypair);
// const keypairFileOne = fs.readFileSync(one);
// const keypairFileTwo = fs.readFileSync(two);
const secretKey = Buffer.from(JSON.parse(keypairFile.toString()));
// const secretKeyOne = Buffer.from(JSON.parse(keypairFileOne.toString()));
// const secretKeyTwo = Buffer.from(JSON.parse(keypairFileTwo.toString()));

const payer = Keypair.fromSecretKey(secretKey); // 5ipkGqSibqZaX5TnhUhUU8RvkWE7hMosCpff61VeNLPX
// const userOne = Keypair.fromSecretKey(secretKeyOne);
// const userTwo = Keypair.fromSecretKey(secretKeyTwo);

  let successes = 0;
  let failures = 0;
  let splitAuthority = true;
  let connection = new Connection(clusterApiUrl('devnet'),'confirmed');

  // for (let i = 0; i < args.length; i++)
  //   if (args[i] == "-r") connection = new Connection(args[++i]);
  //   else if (args[i] == "-k") keypair = args[++i];
  //   else if (args[i] == "-u") {
  //     updateAuthority = args[++i];
  //     splitAuthority = true;
  //   } else if (args[i] == "-m") {
  //     mintAuthority = args[++i];
  //     splitAuthority = true;
  //   }

  let updateKeypair = payer;
  let mintKeypair = payer;


  const wallet = payer;
  console.log(wallet.publicKey.toString());

  let rawdata: any = {};
  for (let i = 0; i < hashList.length; i++) {
    const hash: string = hashList[i];

    console.log("hash", hash);

    rawdata[hash] = false;
  }
  //fs.writeFileSync("./config.json", JSON.stringify(rawdata));
  let config = JSON.parse(JSON.stringify(rawdata));
  console.log("config", config);

  for (const hash in config) {
    const processed = config[hash];
    if (!processed) {
      try {
        let mint = new PublicKey(hash);
        const [masterKey, _masterBump] = await PublicKey.findProgramAddress(
          [
            Buffer.from("metadata"),
            TOKEN_METADATA_PROGRAM_ID.toBuffer(),
            mint.toBuffer(),
            Buffer.from("edition"),
          ],
          TOKEN_METADATA_PROGRAM_ID
        );
        const [metadatakey, _metaBump] = await PublicKey.findProgramAddress(
          [
            Buffer.from("metadata"),
            TOKEN_METADATA_PROGRAM_ID.toBuffer(),
            mint.toBuffer(),
          ],
          TOKEN_METADATA_PROGRAM_ID
        );


        // if (splitAuthority) {

        //   let masterEdition = {
        //       edition: masterKey,
        //       mint: mint,
        //       updateAuthority: payer.publicKey,
        //       mintAuthority: payer.publicKey,
        //       payer: payer.publicKey,
        //       metadata: metadatakey,  } as CreateMasterEditionV3InstructionAccounts;

        //   let masterArgs = { maxSupply: 1, } as CreateMasterEditionArgs;

        //   let masterEditionInstructionArgs = {createMasterEditionArgs: masterArgs,   } as CreateMasterEditionInstructionArgs;

        //   let ix = createCreateMasterEditionV3Instruction(
        //     masterEdition,
        //     masterEditionInstructionArgs
        //   );

        //   const transaction = new Transaction().add(ix);

        //   console.log("Try");
        //   await sendAndConfirmTransaction(connection, transaction, [
        //     wallet,
        //     updateKeypair!,
        //     mintKeypair!,
        //   ]);
        //   console.log("Success");


        // } else {
          let masterEdition = {
            edition: masterKey,
            mint: mint,
            updateAuthority: wallet.publicKey,
            mintAuthority: wallet.publicKey,
            payer: wallet.publicKey,
            metadata: metadatakey,
          } as CreateMasterEditionV3InstructionAccounts;
          let masterArgs = {
            maxSupply: 1,
          } as CreateMasterEditionArgs;
          let masterEditionInstructionArgs = {
            createMasterEditionArgs: masterArgs,
          } as CreateMasterEditionInstructionArgs;
          let ix = createCreateMasterEditionV3Instruction(
            masterEdition,
            masterEditionInstructionArgs
          );
          const transaction = new Transaction().add(ix);
          await sendAndConfirmTransaction(connection, transaction, [wallet]);
      //  }

        config[hash] = true;
        successes++;



       // fs.writeFileSync("./config.json", JSON.stringify(config));

      } catch (e) {
        console.log(e);
        console.log("failed to create master edition for:", hash);
        failures++;
      }
    }
  }
  
  // failures == 0
  //   ? console.log("all master editions created")
  //   : console.log(
  //       `Only ${successes}/${
  //         successes + failures
  //       } master editions created... please rerun.`
  //     );


})();

// if (require.main) main(process.argv.slice(2)).catch(console.error);
// ed1d0d396d73157cde8ad29b3f8ffd88cb51e4410582f37c5bbfe5a40955c65e