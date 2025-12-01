# Blockchain Commons - TypeScript

> Disclaimer: This whole project is still in early development and under heavy development. Please note that the APIs and interfaces are subject to change and are not yet stable.

A comprehensive TypeScript monorepo implementing Blockchain Commons specifications for cryptographic data encoding, uniform resources, and secure information structures.

This repository contains TypeScript implementations of specifications developed by [Blockchain Commons](https://www.blockchaincommons.com/), a research and development cooperative of blockchain and digital asset developers.

## 📦 Packages

### Core Libraries

| Package | Description | Version | Reference |
|---------|-------------|---------|-----------|
| [**dcbor**](packages/dcbor) | Deterministic CBOR encoding - a specification for serializing data in a canonical, reproducible format. Ensures identical byte sequences for cryptographic operations and blockchain applications. [📖 API Docs](https://leonardocustodio.github.io/bc-dcbor-ts/) | `1.0.0-alpha.1` | [bc-dcbor-rust](https://github.com/BlockchainCommons/bc-dcbor-rust) |
| [**uniform-resources**](packages/uniform-resources) | Uniform Resources (UR) - a method for encoding binary data as URIs for transport in QR codes and other text-based channels. Includes Bytewords encoding and fountain codes for multi-part transmission. | `1.0.0-alpha.1` | [bc-ur-rust](https://github.com/BlockchainCommons/bc-ur-rust) |

## 🎮 Applications

### [Playground](apps/playground)
An interactive web application for experimenting with dCBOR encoding and Uniform Resources decoding.

**Try it locally:**
```bash
bun dev
```

**Live Demo:** https://leonardocustodio.github.io/blockchain-commons

## 🚀 Quick Start

### Prerequisites
- Node.js >= 16.0.0
- [Bun](https://bun.sh/) (>=1.2.22) - Package manager and runtime

### Installation

```bash
# Install dependencies
bun install

# Build all packages
bun run build

# Run development servers
bun run dev

# Run linting
bun run lint

# Type checking
bun run check-types
```

## 📚 Specifications & Reference Implementations

This project implements open specifications maintained by Blockchain Commons:

- **[Deterministic CBOR (dCBOR)](https://github.com/BlockchainCommons/bc-dcbor-rust)** - A deterministic binary encoding format based on CBOR (RFC 7049)
- **[Uniform Resources (UR)](https://github.com/BlockchainCommons/bc-ur-rust)** - A method for encoding binary data as URIs optimized for QR codes and text-based channels

For complete specifications and reference implementations in other languages, visit:
- [Blockchain Commons GitHub](https://github.com/BlockchainCommons)
- [Blockchain Commons Documentation](https://www.blockchaincommons.com/)
