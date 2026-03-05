/**
 * Example: Agent Registry (on-chain AI agent registration)
 *
 * This example demonstrates how to:
 * 1. Register a new agent
 * 2. Set bio and metadata
 * 3. Upload agent memory (chunked buffer mechanism)
 * 4. Query agent info and read memory
 * 5. Update memory / append memory
 * 6. Log activity
 * 7. Transfer authority
 * 8. Delete agent
 *
 * Prerequisites:
 * - Set PRIVATE_KEY environment variable (base58 or JSON array)
 *
 * Run: tsx examples/agent_registry.ts
 */

import {
  registerAgent,
  getAgentRecord,
  getAgentInfo,
  getAgentMemory,
  setBio,
  setMetadata,
  uploadMemory,
  logActivity,
  transferAgentAuthority,
  deleteAgent,
  Keypair,
  PublicKey,
} from "../index";
import { Connection } from "@solana/web3.js";
import bs58 from "bs58";

async function main() {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("PRIVATE_KEY environment variable is required");
  }

  const wallet = privateKey.startsWith("[")
    ? Keypair.fromSecretKey(new Uint8Array(JSON.parse(privateKey)))
    : Keypair.fromSecretKey(bs58.decode(privateKey));

  const rpcUrl = process.env.RPC_URL || "https://mainnet-api.nara.build/";
  const connection = new Connection(rpcUrl, "confirmed");

  console.log("Wallet:", wallet.publicKey.toBase58());

  // Random agent ID (6-char hex suffix ensures uniqueness each run)
  const suffix = Math.random().toString(16).slice(2, 8);
  const agentId = process.env.AGENT_ID || `agent-${suffix}`;

  // ── 1. Register agent ───────────────────────────────────────────
  console.log(`\n--- Registering agent "${agentId}" ---`);
  try {
    const { signature, agentPubkey } = await registerAgent(
      connection,
      wallet,
      agentId
    );
    console.log("Registered:", agentPubkey.toBase58());
    console.log("Transaction:", signature);
  } catch (err: any) {
    console.log("Register skipped (may already exist):", err.message);
  }

  // ── 2. Set bio ────────────────────────────────────────────────
  console.log("\n--- Setting bio ---");
  const bioSig = await setBio(
    connection,
    wallet,
    agentId,
    "An AI agent demonstrating the Nara Agent Registry SDK."
  );
  console.log("Transaction:", bioSig);

  // ── 3. Set metadata ───────────────────────────────────────────
  console.log("\n--- Setting metadata ---");
  const metadata = JSON.stringify({
    version: "1.0.0",
    model: "gpt-4",
    capabilities: ["chat", "code", "analysis"],
  });
  const metaSig = await setMetadata(connection, wallet, agentId, metadata);
  console.log("Transaction:", metaSig);

  // ── 4. Upload agent memory ────────────────────────────────────
  console.log("\n--- Uploading agent memory ---");
  const memoryData = Buffer.from(
    JSON.stringify({
      context: "This is the agent's persistent memory.",
      facts: ["The sky is blue", "Nara is a Solana-compatible chain"],
      lastUpdated: new Date().toISOString(),
    })
  );
  console.log(`Memory size: ${memoryData.length} bytes`);

  const uploadSig = await uploadMemory(
    connection,
    wallet,
    agentId,
    memoryData,
    {
      onProgress(chunkIndex, totalChunks, sig) {
        console.log(`  [${chunkIndex}/${totalChunks}] tx: ${sig}`);
      },
    }
  );
  console.log("Finalize tx:", uploadSig);

  // ── 5. Query agent info ───────────────────────────────────────
  console.log("\n--- Querying agent info ---");
  const info = await getAgentInfo(connection, agentId);
  console.log("Agent ID:", info.record.agentId);
  console.log("Authority:", info.record.authority.toBase58());
  console.log("Version:", info.record.version);
  console.log("Memory:", info.record.memory.toBase58());
  console.log("Created at:", new Date(info.record.createdAt * 1000).toISOString());
  console.log(
    "Updated at:",
    info.record.updatedAt
      ? new Date(info.record.updatedAt * 1000).toISOString()
      : "-"
  );
  console.log("Bio:", info.bio ?? "(none)");
  console.log("Metadata:", info.metadata ?? "(none)");

  // ── 6. Verify memory ─────────────────────────────────────────
  console.log("\n--- Verifying memory ---");
  const memoryBytes = await getAgentMemory(connection, agentId);
  if (!memoryBytes) {
    console.log("ERROR: no memory found on-chain");
  } else if (memoryBytes.equals(memoryData)) {
    console.log(`OK: on-chain memory matches (${memoryData.length} bytes)`);
  } else {
    console.log(
      `MISMATCH: on-chain ${memoryBytes.length} bytes vs local ${memoryData.length} bytes`
    );
  }

  // ── 7. Update memory ─────────────────────────────────────────
  console.log("\n--- Updating memory ---");
  const updatedMemory = Buffer.from(
    JSON.stringify({
      context: "Updated agent memory.",
      facts: ["Nara SDK supports agent registry"],
      lastUpdated: new Date().toISOString(),
    })
  );
  const updateSig = await uploadMemory(
    connection,
    wallet,
    agentId,
    updatedMemory,
    {
      onProgress(chunkIndex, totalChunks, sig) {
        console.log(`  [${chunkIndex}/${totalChunks}] tx: ${sig}`);
      },
    }
    // mode defaults to "auto" -> detects existing memory -> "update"
  );
  console.log("Finalize tx:", updateSig);

  const updatedRecord = await getAgentRecord(connection, agentId);
  console.log("New version:", updatedRecord.version);

  // ── 8. Log activity ───────────────────────────────────────────
  console.log("\n--- Logging activity ---");
  const actSig = await logActivity(
    connection,
    wallet,
    agentId,
    "gpt-4",
    "example_run",
    "Completed agent registry example successfully"
  );
  console.log("Transaction:", actSig);

  // ── 9. Transfer authority (optional) ──────────────────────────
  // Uncomment and set NEW_AUTHORITY to transfer ownership.
  // const newAuthority = new PublicKey(process.env.NEW_AUTHORITY!);
  // console.log("\n--- Transferring authority ---");
  // const transferSig = await transferAgentAuthority(
  //   connection,
  //   wallet,
  //   agentId,
  //   newAuthority
  // );
  // console.log("Transaction:", transferSig);

  // ── 10. Delete agent (optional) ───────────────────────────────
  // Uncomment to delete the agent and reclaim all rent.
  // console.log("\n--- Deleting agent ---");
  // const deleteSig = await deleteAgent(connection, wallet, agentId);
  // console.log("Transaction:", deleteSig);

  console.log("\nDone.");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
