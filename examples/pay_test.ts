/**
 * Test: pay 10 NARA to model-hub, charge, then fetch user info
 *
 * Flow:
 *   1. Transfer 10 NARA to MoDRtxeD... on-chain
 *   2. GET /model-hub-api/charge?tx=<sig>&...signed
 *   3. GET /model-hub-api/user/info ...signed  → print result
 */

import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
} from "@solana/web3.js";
import bs58 from "bs58";
import { sendTx, signUrl } from "../index";

const RPC_URL = process.env.RPC_URL || "https://devnet-api.nara.build";
const MODEL_HUB_BASE = "https://model-api.nara.build";
const CHARGE_ADDRESS = "MoDRtxeD2xfyPxswH7qnuZyQpNNWpjqTskNY79KuZqX";
const NARA_AMOUNT = 10; // 10 NARA

function loadWallet(): Keypair {
  const raw = process.env.PRIVATE_KEY;
  if (!raw) throw new Error("PRIVATE_KEY not set in env");
  try {
    return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(raw)));
  } catch {
    return Keypair.fromSecretKey(bs58.decode(raw));
  }
}

async function main() {
  const connection = new Connection(RPC_URL, "confirmed");
  const wallet = loadWallet();

  console.log(`Wallet: ${wallet.publicKey.toBase58()}`);
  console.log(`RPC:    ${RPC_URL}`);
  console.log(`Paying: ${NARA_AMOUNT} NARA → ${CHARGE_ADDRESS}\n`);

  // --- Step 1: transfer NARA on-chain ---
  console.log("--- Step 1: Sending on-chain transfer ---");
  const transferIx = SystemProgram.transfer({
    fromPubkey: wallet.publicKey,
    toPubkey: new PublicKey(CHARGE_ADDRESS),
    lamports: Math.round(NARA_AMOUNT * LAMPORTS_PER_SOL),
  });

  const sig = await sendTx(connection, wallet, [transferIx]);
  console.log(`Transfer TX: ${sig}`);

  // --- Step 2: charge ---
  console.log("\n--- Step 2: Calling /model-hub-api/charge ---");
  const chargeUrl = signUrl(
    `${MODEL_HUB_BASE}/model-hub-api/charge`,
    wallet,
    { tx: sig }
  );
  console.log(`Charge URL: ${chargeUrl}`);

  const chargeRes = await fetch(chargeUrl);
  const chargeText = await chargeRes.text();
  let chargeJson: unknown;
  try { chargeJson = JSON.parse(chargeText); } catch { chargeJson = chargeText; }

  if (!chargeRes.ok) {
    console.error(`Charge failed (${chargeRes.status}):`, chargeJson);
    process.exit(1);
  }
  console.log("Charge response:", JSON.stringify(chargeJson, null, 2));

  // --- Step 3: user info ---
  console.log("\n--- Step 3: Calling /model-hub-api/user/info ---");
  const infoUrl = signUrl(
    `${MODEL_HUB_BASE}/model-hub-api/user/info`,
    wallet
  );
  console.log(`Info URL: ${infoUrl}`);

  const infoRes = await fetch(infoUrl);
  const infoText = await infoRes.text();
  let infoJson: unknown;
  try { infoJson = JSON.parse(infoText); } catch { infoJson = infoText; }

  if (!infoRes.ok) {
    console.error(`User info failed (${infoRes.status}):`, infoJson);
    process.exit(1);
  }
  console.log("User info:", JSON.stringify(infoJson, null, 2));
}

main().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});
