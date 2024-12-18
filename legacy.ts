import { LitNodeClient } from '@lit-protocol/lit-node-client';
import { getEncryptedKey } from '@lit-protocol/wrapped-keys/src/lib/api';
import {
    Connection,
    Keypair,
    LAMPORTS_PER_SOL,
    PublicKey,
    SystemProgram,
    Transaction,
    TransactionInstruction,
    clusterApiUrl
} from '@solana/web3.js';
import { pkpSessionSigs, wrappedKey } from './utils';

const litAction = require("./signTransactionWithEncryptedSolanaKey")


const litNodeClient = new LitNodeClient({
    alertWhenUnauthorized: false,
    litNetwork: "datil-dev",
    debug: true,
});

await litNodeClient.connect();

const chain = 'devnet';
const toKeypair = Keypair.generate()

const fromPublicKey = new PublicKey(wrappedKey.publicKey);
const toPublicKey = toKeypair.publicKey;

const solanaConnection = new Connection(clusterApiUrl(chain), 'confirmed');
const { blockhash } = await solanaConnection.getLatestBlockhash();
const lamports = await solanaConnection.getMinimumBalanceForRentExemption(128);

const solanaTransaction = new Transaction();

solanaTransaction.add(
    SystemProgram.transfer({
        fromPubkey: fromPublicKey,
        toPubkey: toPublicKey,
        lamports: LAMPORTS_PER_SOL / 100, // Transfer 0.01 SOL
    }),
    SystemProgram.createAccount({
        fromPubkey: fromPublicKey,
        newAccountPubkey: toPublicKey,
        lamports, // Minimum balance required for rent exemption
        space: 128,
        programId: SystemProgram.programId, // Owner of the allocated space
    })
);



solanaTransaction.feePayer = fromPublicKey;


solanaTransaction.recentBlockhash = blockhash;

const serializedTransaction = solanaTransaction
    .serialize({
        requireAllSignatures: false,
        verifySignatures: false,
    })
    .toString('base64');

const unsignedTransaction = {
    serializedTransaction,
    chain,
};

const accessControlConditions = [
    {
        "contractAddress": "",
        "standardContractType": "",
        "chain": "ethereum",
        "method": "",
        "parameters": [
            ":userAddress"
        ],
        "returnValueTest": {
            "comparator": "=",
            "value": wrappedKey.pkpAddress
        }
    }
]

const key = await getEncryptedKey({ pkpSessionSigs, litNodeClient, id: wrappedKey.id })

const response = await litNodeClient.executeJs({
    sessionSigs: pkpSessionSigs,
    code: litAction.code,
    jsParams: {
        pkpAddress: wrappedKey.pkpAddress,
        ciphertext: key.ciphertext,
        dataToEncryptHash: key.dataToEncryptHash,
        unsignedTransaction,
        broadcast: false,
        versionedTransaction: true, // KEEP IN MIND that backward compatibility is not guaranteed, even if some legacy transactions can be parsed and signed as versioned ones.
        accessControlConditions
    }
})

console.log({ response })
