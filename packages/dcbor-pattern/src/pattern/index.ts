/**
 * Pattern types for dCBOR pattern matching.
 *
 * This module provides the core Pattern type and its variants for
 * matching dCBOR values.
 *
 * @module pattern
 */

import type { Cbor } from "@bcts/dcbor";
import type { Path } from "../format";

// Value patterns - to be implemented
// export * from "./value";

// Structure patterns - to be implemented
// export * from "./structure";

// Meta patterns - to be implemented
// export * from "./meta";

// Matcher interface - to be implemented
// export * from "./matcher";

// VM execution - to be implemented
// export * from "./vm";

/**
 * Value patterns match CBOR leaf values.
 */
export type ValuePattern =
  | { readonly type: "Bool"; readonly variant: "Any" }
  | { readonly type: "Bool"; readonly variant: "Value"; readonly value: boolean }
  | { readonly type: "Null" }
  | { readonly type: "Number"; readonly variant: "Any" }
  | { readonly type: "Number"; readonly variant: "Value"; readonly value: number }
  | { readonly type: "Number"; readonly variant: "Range"; readonly min: number; readonly max: number }
  | { readonly type: "Number"; readonly variant: "GreaterThan"; readonly value: number }
  | { readonly type: "Number"; readonly variant: "GreaterThanOrEqual"; readonly value: number }
  | { readonly type: "Number"; readonly variant: "LessThan"; readonly value: number }
  | { readonly type: "Number"; readonly variant: "LessThanOrEqual"; readonly value: number }
  | { readonly type: "Number"; readonly variant: "NaN" }
  | { readonly type: "Number"; readonly variant: "Infinity" }
  | { readonly type: "Number"; readonly variant: "NegInfinity" }
  | { readonly type: "Text"; readonly variant: "Any" }
  | { readonly type: "Text"; readonly variant: "Value"; readonly value: string }
  | { readonly type: "Text"; readonly variant: "Regex"; readonly pattern: RegExp }
  | { readonly type: "ByteString"; readonly variant: "Any" }
  | { readonly type: "ByteString"; readonly variant: "Value"; readonly value: Uint8Array }
  | { readonly type: "ByteString"; readonly variant: "Regex"; readonly pattern: RegExp }
  | { readonly type: "Date"; readonly variant: "Any" }
  | { readonly type: "Date"; readonly variant: "Value"; readonly value: Date }
  | { readonly type: "Date"; readonly variant: "Range"; readonly min: Date; readonly max: Date }
  | { readonly type: "Date"; readonly variant: "Earliest"; readonly value: Date }
  | { readonly type: "Date"; readonly variant: "Latest"; readonly value: Date }
  | { readonly type: "Date"; readonly variant: "StringValue"; readonly value: string }
  | { readonly type: "Date"; readonly variant: "Regex"; readonly pattern: RegExp }
  | { readonly type: "Digest"; readonly variant: "Any" }
  | { readonly type: "Digest"; readonly variant: "Value"; readonly value: Uint8Array }
  | { readonly type: "Digest"; readonly variant: "Prefix"; readonly prefix: Uint8Array }
  | { readonly type: "Digest"; readonly variant: "BinaryRegex"; readonly pattern: RegExp }
  | { readonly type: "KnownValue"; readonly variant: "Any" }
  | { readonly type: "KnownValue"; readonly variant: "Value"; readonly value: bigint }
  | { readonly type: "KnownValue"; readonly variant: "Named"; readonly name: string }
  | { readonly type: "KnownValue"; readonly variant: "Regex"; readonly pattern: RegExp };

/**
 * Structure patterns match CBOR containers.
 */
export type StructurePattern =
  | { readonly type: "Array"; readonly variant: "Any" }
  | { readonly type: "Array"; readonly variant: "Elements"; readonly pattern: Pattern }
  | { readonly type: "Array"; readonly variant: "Length"; readonly min: number; readonly max?: number }
  | { readonly type: "Map"; readonly variant: "Any" }
  | { readonly type: "Map"; readonly variant: "Constraints"; readonly constraints: Array<[Pattern, Pattern]> }
  | { readonly type: "Map"; readonly variant: "Length"; readonly min: number; readonly max?: number }
  | { readonly type: "Tagged"; readonly variant: "Any" }
  | { readonly type: "Tagged"; readonly variant: "Tag"; readonly tag: number; readonly pattern: Pattern }
  | { readonly type: "Tagged"; readonly variant: "Name"; readonly name: string; readonly pattern: Pattern }
  | { readonly type: "Tagged"; readonly variant: "Regex"; readonly regex: RegExp; readonly pattern: Pattern };

/**
 * Meta patterns combine and modify other patterns.
 */
export type MetaPattern =
  | { readonly type: "Any" }
  | { readonly type: "And"; readonly patterns: Pattern[] }
  | { readonly type: "Or"; readonly patterns: Pattern[] }
  | { readonly type: "Not"; readonly pattern: Pattern }
  | { readonly type: "Repeat"; readonly pattern: Pattern; readonly min: number; readonly max?: number }
  | { readonly type: "Capture"; readonly name: string; readonly pattern: Pattern }
  | { readonly type: "Search"; readonly pattern: Pattern }
  | { readonly type: "Sequence"; readonly patterns: Pattern[] };

/**
 * The main Pattern type - a discriminated union of all pattern variants.
 */
export type Pattern =
  | { readonly kind: "Value"; readonly pattern: ValuePattern }
  | { readonly kind: "Structure"; readonly pattern: StructurePattern }
  | { readonly kind: "Meta"; readonly pattern: MetaPattern };

/**
 * Result of pattern matching with captures.
 */
export interface MatchResult {
  readonly paths: Path[];
  readonly captures: Map<string, Path[]>;
}

// ============================================================================
// Pattern Constructors
// ============================================================================

/**
 * Creates a pattern that matches any value.
 */
export const any = (): Pattern => ({
  kind: "Meta",
  pattern: { type: "Any" },
});

/**
 * Creates a pattern that matches any boolean.
 */
export const anyBool = (): Pattern => ({
  kind: "Value",
  pattern: { type: "Bool", variant: "Any" },
});

/**
 * Creates a pattern that matches a specific boolean value.
 */
export const bool = (value: boolean): Pattern => ({
  kind: "Value",
  pattern: { type: "Bool", variant: "Value", value },
});

/**
 * Creates a pattern that matches null.
 */
export const nullPattern = (): Pattern => ({
  kind: "Value",
  pattern: { type: "Null" },
});

/**
 * Creates a pattern that matches any number.
 */
export const anyNumber = (): Pattern => ({
  kind: "Value",
  pattern: { type: "Number", variant: "Any" },
});

/**
 * Creates a pattern that matches a specific number.
 */
export const number = (value: number): Pattern => ({
  kind: "Value",
  pattern: { type: "Number", variant: "Value", value },
});

/**
 * Creates a pattern that matches numbers in a range.
 */
export const numberRange = (min: number, max: number): Pattern => ({
  kind: "Value",
  pattern: { type: "Number", variant: "Range", min, max },
});

/**
 * Creates a pattern that matches any text.
 */
export const anyText = (): Pattern => ({
  kind: "Value",
  pattern: { type: "Text", variant: "Any" },
});

/**
 * Creates a pattern that matches specific text.
 */
export const text = (value: string): Pattern => ({
  kind: "Value",
  pattern: { type: "Text", variant: "Value", value },
});

/**
 * Creates a pattern that matches text using a regex.
 */
export const textRegex = (pattern: RegExp): Pattern => ({
  kind: "Value",
  pattern: { type: "Text", variant: "Regex", pattern },
});

/**
 * Creates a pattern that matches any byte string.
 */
export const anyByteString = (): Pattern => ({
  kind: "Value",
  pattern: { type: "ByteString", variant: "Any" },
});

/**
 * Creates a pattern that matches a specific byte string.
 */
export const byteString = (value: Uint8Array): Pattern => ({
  kind: "Value",
  pattern: { type: "ByteString", variant: "Value", value },
});

/**
 * Creates a pattern that matches any array.
 */
export const anyArray = (): Pattern => ({
  kind: "Structure",
  pattern: { type: "Array", variant: "Any" },
});

/**
 * Creates a pattern that matches any map.
 */
export const anyMap = (): Pattern => ({
  kind: "Structure",
  pattern: { type: "Map", variant: "Any" },
});

/**
 * Creates a pattern that matches any tagged value.
 */
export const anyTagged = (): Pattern => ({
  kind: "Structure",
  pattern: { type: "Tagged", variant: "Any" },
});

/**
 * Creates an AND pattern that matches if all patterns match.
 */
export const and = (...patterns: Pattern[]): Pattern => ({
  kind: "Meta",
  pattern: { type: "And", patterns },
});

/**
 * Creates an OR pattern that matches if any pattern matches.
 */
export const or = (...patterns: Pattern[]): Pattern => ({
  kind: "Meta",
  pattern: { type: "Or", patterns },
});

/**
 * Creates a NOT pattern that matches if the pattern does not match.
 */
export const not = (pattern: Pattern): Pattern => ({
  kind: "Meta",
  pattern: { type: "Not", pattern },
});

/**
 * Creates a capture pattern with a name.
 */
export const capture = (name: string, pattern: Pattern): Pattern => ({
  kind: "Meta",
  pattern: { type: "Capture", name, pattern },
});

/**
 * Creates a search pattern for recursive matching.
 */
export const search = (pattern: Pattern): Pattern => ({
  kind: "Meta",
  pattern: { type: "Search", pattern },
});

/**
 * Creates a sequence pattern for ordered matching.
 */
export const sequence = (...patterns: Pattern[]): Pattern => ({
  kind: "Meta",
  pattern: { type: "Sequence", patterns },
});

// ============================================================================
// Pattern Matching (stub implementation)
// ============================================================================

/**
 * Matches a pattern against a CBOR value and returns all matching paths.
 *
 * @param pattern - The pattern to match
 * @param haystack - The CBOR value to search
 * @returns Array of paths to matching elements
 */
export const paths = (_pattern: Pattern, _haystack: Cbor): Path[] => {
  // TODO: Implement pattern matching
  return [];
};

/**
 * Matches a pattern against a CBOR value and returns paths with captures.
 *
 * @param pattern - The pattern to match
 * @param haystack - The CBOR value to search
 * @returns Match result with paths and captures
 */
export const pathsWithCaptures = (_pattern: Pattern, _haystack: Cbor): MatchResult => {
  // TODO: Implement pattern matching with captures
  return { paths: [], captures: new Map() };
};

/**
 * Checks if a pattern matches a CBOR value.
 *
 * @param pattern - The pattern to match
 * @param haystack - The CBOR value to test
 * @returns true if the pattern matches
 */
export const matches = (_pattern: Pattern, _haystack: Cbor): boolean => {
  // TODO: Implement pattern matching
  return false;
};
