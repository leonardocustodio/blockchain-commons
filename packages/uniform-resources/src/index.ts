// Core types
export { UR } from "./ur";
export { URType } from "./ur-type";

// Error types
export {
  URError,
  InvalidSchemeError,
  TypeUnspecifiedError,
  InvalidTypeError,
  NotSinglePartError,
  UnexpectedTypeError,
  BytewordsError,
  CBORError,
  isError,
} from "./error";

export type { Result } from "./error";

// Traits/Interfaces
export { isUREncodable } from "./ur-encodable";
export type { UREncodable } from "./ur-encodable";
export { isURDecodable } from "./ur-decodable";
export type { URDecodable } from "./ur-decodable";
export { isURCodable } from "./ur-codable";
export type { URCodable } from "./ur-codable";

// Multipart encoding/decoding
export { MultipartEncoder } from "./multipart-encoder";
export { MultipartDecoder } from "./multipart-decoder";

// Fountain codes (for advanced multipart handling)
export {
  FountainEncoder,
  FountainDecoder,
  splitMessage,
  xorBytes,
  chooseFragments,
  mixFragments,
} from "./fountain";
export type { FountainPart } from "./fountain";

// PRNG for deterministic fountain code mixing
export { Xoshiro256, createSeed } from "./xoshiro";

// Utilities
export {
  isURTypeChar,
  isValidURType,
  validateURType,
  BYTEWORDS,
  BYTEWORDS_MAP,
  BYTEMOJIS,
  encodeBytewordsIdentifier,
  encodeBytemojisIdentifier,
  BytewordsStyle,
  encodeBytewords,
  decodeBytewords,
  crc32,
  MINIMAL_BYTEWORDS_MAP,
} from "./utils";
