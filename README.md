<p align="center">
  <img src="https://raw.githubusercontent.com/nara-chain/nara-web/main/public/favicon.png" width="48" />
</p>

<h3 align="center">Nara SDK</h3>
<p align="center">
  Chain-level SDK and CLI for the Nara network.
  <br />
  <a href="https://nara.build/docs">nara.build/docs</a>
</p>

---

TypeScript/JavaScript SDK for interacting with the Nara blockchain. Build agents, submit transactions, query accounts, and integrate with on-chain programs.

## Install

```bash
npm install @nara/sdk
```

## Quick Start

```js
import { Connection, Keypair, Transaction } from '@nara/sdk';

const connection = new Connection('https://devnet-api.nara.build');
const balance = await connection.getBalance(publicKey);
```

## Features

```
Transactions       Build, sign, and send transactions
Accounts           Query balances, token accounts, and program state
Programs           Interact with Nara on-chain programs (Agent Registry, PoMI, ZK ID)
Keypairs           Generate and manage wallet keypairs
RPC Client         Full RPC method coverage
```

## CLI

```bash
npx @nara/sdk --help
```

## Documentation

Full API reference at [nara.build/docs](https://nara.build/docs).

## License

MIT

## Links

[Website](https://nara.build) · [Explorer](https://explorer.nara.build) · [GitHub](https://github.com/nara-chain) · [X](https://x.com/NaraBuildAI)
