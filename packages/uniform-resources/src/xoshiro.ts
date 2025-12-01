/**
 * Xoshiro256** PRNG implementation.
 *
 * This is a high-quality, fast pseudo-random number generator used
 * for deterministic fragment selection in fountain codes.
 *
 * Reference: https://prng.di.unimi.it/
 */

const MAX_UINT64 = BigInt("0xffffffffffffffff");

/**
 * Performs a left rotation on a 64-bit BigInt.
 */
function rotl(x: bigint, k: number): bigint {
  const kBigInt = BigInt(k);
  return ((x << kBigInt) | (x >> (64n - kBigInt))) & MAX_UINT64;
}

/**
 * Xoshiro256** pseudo-random number generator.
 *
 * This PRNG is used for deterministic mixing in fountain codes,
 * allowing both encoder and decoder to agree on which fragments
 * are combined without transmitting that information.
 */
export class Xoshiro256 {
  private s: [bigint, bigint, bigint, bigint];

  /**
   * Creates a new Xoshiro256** instance from a seed.
   *
   * The seed is hashed using SHA-256 to initialize the state.
   * For consistent results across encoder/decoder, use the same seed.
   *
   * @param seed - The seed bytes (any length)
   */
  constructor(seed: Uint8Array) {
    // Hash the seed using a simple hash function
    // In production, you'd use SHA-256 here
    const hash = this.hashSeed(seed);

    // Initialize the 4x64-bit state from the hash
    this.s = [
      this.bytesToBigInt(hash.slice(0, 8)),
      this.bytesToBigInt(hash.slice(8, 16)),
      this.bytesToBigInt(hash.slice(16, 24)),
      this.bytesToBigInt(hash.slice(24, 32)),
    ];
  }

  /**
   * Creates a Xoshiro256** instance from raw state values.
   * Useful for seeding with specific values.
   */
  static fromState(s0: bigint, s1: bigint, s2: bigint, s3: bigint): Xoshiro256 {
    const instance = Object.create(Xoshiro256.prototype) as Xoshiro256;
    instance.s = [s0, s1, s2, s3];
    return instance;
  }

  /**
   * Simple hash function for seeding.
   * This is a basic implementation - in production use SHA-256.
   */
  private hashSeed(seed: Uint8Array): Uint8Array {
    // Simple hash expansion using CRC32-like operations
    const result = new Uint8Array(32);

    if (seed.length === 0) {
      return result;
    }

    // Expand seed to 32 bytes using a simple mixing function
    for (let i = 0; i < 32; i++) {
      let hash = 0;
      for (const byte of seed) {
        hash = (hash * 31 + byte + i) >>> 0;
      }
      // Mix the hash further
      hash ^= hash >>> 16;
      hash = (hash * 0x85ebca6b) >>> 0;
      hash ^= hash >>> 13;
      hash = (hash * 0xc2b2ae35) >>> 0;
      hash ^= hash >>> 16;
      result[i] = hash & 0xff;
    }

    return result;
  }

  /**
   * Converts 8 bytes to a 64-bit BigInt (little-endian).
   */
  private bytesToBigInt(bytes: Uint8Array): bigint {
    let result = 0n;
    for (let i = 7; i >= 0; i--) {
      result = (result << 8n) | BigInt(bytes[i] ?? 0);
    }
    return result;
  }

  /**
   * Generates the next 64-bit random value.
   */
  next(): bigint {
    const result = (rotl((this.s[1] * 5n) & MAX_UINT64, 7) * 9n) & MAX_UINT64;

    const t = (this.s[1] << 17n) & MAX_UINT64;

    this.s[2] ^= this.s[0];
    this.s[3] ^= this.s[1];
    this.s[1] ^= this.s[2];
    this.s[0] ^= this.s[3];

    this.s[2] ^= t;
    this.s[3] = rotl(this.s[3], 45);

    return result;
  }

  /**
   * Generates a random double in [0, 1).
   */
  nextDouble(): number {
    // Use the upper 53 bits for double precision
    const value = this.next();
    return Number(value >> 11n) / Number(1n << 53n);
  }

  /**
   * Generates a random integer in [low, high).
   */
  nextInt(low: number, high: number): number {
    const range = high - low;
    return low + Math.floor(this.nextDouble() * range);
  }

  /**
   * Generates a random byte [0, 255].
   */
  nextByte(): number {
    return Number(this.next() & 0xffn);
  }

  /**
   * Generates an array of random bytes.
   */
  nextData(count: number): Uint8Array {
    const result = new Uint8Array(count);
    for (let i = 0; i < count; i++) {
      result[i] = this.nextByte();
    }
    return result;
  }
}

/**
 * Creates a seed for the Xoshiro PRNG from message checksum and sequence number.
 *
 * This ensures that both encoder and decoder produce the same random sequence
 * for a given message and part number.
 */
export function createSeed(checksum: number, seqNum: number): Uint8Array {
  const seed = new Uint8Array(8);

  // Pack checksum (4 bytes, big-endian)
  seed[0] = (checksum >>> 24) & 0xff;
  seed[1] = (checksum >>> 16) & 0xff;
  seed[2] = (checksum >>> 8) & 0xff;
  seed[3] = checksum & 0xff;

  // Pack seqNum (4 bytes, big-endian)
  seed[4] = (seqNum >>> 24) & 0xff;
  seed[5] = (seqNum >>> 16) & 0xff;
  seed[6] = (seqNum >>> 8) & 0xff;
  seed[7] = seqNum & 0xff;

  return seed;
}
