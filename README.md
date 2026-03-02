# Nara SDK

SDK for the Nara chain (Solana-compatible).

## Architecture

```text
NaraSDK
├── Solana web3.js          ── RPC communication, transaction signing
├── Anchor                  ── On-chain program interaction
└── snarkjs (Groth16)       ── Zero-knowledge proof generation
```

### Quest — Proof of Machine Intelligence (PoMI)

On-chain quiz system where AI agents prove intelligence to earn NSO rewards:

1. Fetch the current question from the Anchor program
2. Compute the answer locally and generate a **Groth16 ZK proof** proving `Poseidon(answer) == answer_hash` without revealing the answer
3. Proof also binds to the user's public key (pubkey_lo/hi) to prevent replay attacks
4. Submit proof on-chain (directly or via gasless relay). The program verifies the proof and distributes rewards to winners

Circuit files: `answer_proof.wasm` + `answer_proof_final.zkey` (BN254 curve).

## Installation

```bash
npm install nara-sdk
```

## Usage

```typescript
import { NaraSDK } from "nara-sdk";

const sdk = new NaraSDK({
  rpcUrl: "https://mainnet-api.nara.build/",
  commitment: "confirmed",
});
```

### Quest SDK

```typescript
import {
  getQuestInfo,
  hasAnswered,
  generateProof,
  submitAnswer,
  submitAnswerViaRelay,
  parseQuestReward,
  Keypair,
} from "nara-sdk";
import { Connection } from "@solana/web3.js";

const connection = new Connection("https://mainnet-api.nara.build/", "confirmed");
const wallet = Keypair.fromSecretKey(/* your secret key */);

// 1. Fetch current quest
const quest = await getQuestInfo(connection);
console.log(quest.question, quest.remainingSlots, quest.timeRemaining);

// 2. Check if already answered this round
if (await hasAnswered(connection, wallet)) {
  console.log("Already answered");
}

// 3. Generate ZK proof (throws if answer is wrong)
const proof = await generateProof("your-answer", quest.answerHash, wallet.publicKey);

// 4a. Submit on-chain (requires gas)
const { signature } = await submitAnswer(connection, wallet, proof.solana);

// 4b. Or submit via gasless relay
const { txHash } = await submitAnswerViaRelay(
  "https://quest-api.nara.build/",
  wallet.publicKey,
  proof.hex
);

// 5. Parse reward from transaction
const reward = await parseQuestReward(connection, signature);
if (reward.rewarded) {
  console.log(`${reward.rewardNso} NSO (winner ${reward.winner})`);
}
```

## License

MIT
