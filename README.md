# test-wrapped-key-versioned-tx

#### Install dependencies:

```bash
bun install
```

#### Set sessionSig and wrapped key in `utils.ts`

```
export const pkpSessionSigs = {}

export const wrappedKey = {
    publicKey: "",
    pkpAddress: "",
    id: "",
    litNetwork: "datil-dev",
    keyType: "ed25519"
}
```


#### To test:

```bash
bun run legacy.ts
bun run versioned.ts
```



#### KEEP IN MIND 
Backward compatibility is not guaranteed, even if some legacy transactions can be parsed and signed as versioned ones. 

Check `exemple.ts` both signature are the same but we can't always assume that. 

I copied the lit action in `/js-sdk/packages/wrapped-keys-lit-actions/src/generated/solana/signTransactionWithEncryptedSolanaKey.js` after running `generate-lit-actions`