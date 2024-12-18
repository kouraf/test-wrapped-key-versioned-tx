import { LitNodeClient } from '@lit-protocol/lit-node-client';
import { getEncryptedKey } from '@lit-protocol/wrapped-keys/src/lib/api';
import {
    Connection,
    Keypair,
    LAMPORTS_PER_SOL,
    PublicKey,
    SystemProgram,
    Transaction,
    TransactionMessage,
    VersionedTransaction,
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
const instructions = [
    SystemProgram.transfer({
        fromPubkey: fromPublicKey,
        toPubkey: toPublicKey,
        lamports: LAMPORTS_PER_SOL / 100,
    }),
];

const connection = new Connection(clusterApiUrl("devnet"));
let blockhash = await connection
    .getLatestBlockhash()
    .then(res => res.blockhash);

const messageV0 = new TransactionMessage({
    payerKey: fromPublicKey,
    recentBlockhash: blockhash,
    instructions,
}).compileToV0Message();

const transaction = new VersionedTransaction(messageV0);
const serializedTransaction = Buffer.from(transaction.serialize()).toString("base64")

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
        versionedTransaction: true,
        accessControlConditions
    }
})

console.log({ response })
