import {
    Connection,
    Keypair,
    LAMPORTS_PER_SOL,
    PublicKey,
    SystemProgram,
    Transaction,
    TransactionInstruction,
    VersionedTransaction,
    clusterApiUrl
} from '@solana/web3.js';
import { encodeBase58 } from 'ethers';


const chain = 'devnet';
const toKeypair = Keypair.generate()

const fromPublicKey = toKeypair.publicKey;
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

const transaction = Transaction.from(
    Buffer.from(serializedTransaction, 'base64')
);

transaction.sign(toKeypair);

if (!transaction.signature) {
    throw new Error('Transaction signature is null');
}

let signature = encodeBase58(transaction.signature);
console.log({ signature })


const swapTransactionBuf = Buffer.from(
    serializedTransaction,
    'base64'
);

const vTransaction = VersionedTransaction.deserialize(swapTransactionBuf);
vTransaction.sign([toKeypair])

signature = encodeBase58(transaction.signature);
console.log({ signature })