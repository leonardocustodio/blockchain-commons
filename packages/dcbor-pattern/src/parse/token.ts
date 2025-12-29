/**
 * Token types for the dCBOR pattern lexer.
 *
 * This module defines all token types that can be produced by the lexer
 * when parsing dCBOR pattern expressions.
 *
 * @module parse/token
 */

import type { Span } from "../error";
import type { Quantifier } from "../quantifier";

/**
 * Token types for dCBOR pattern parsing.
 *
 * This is a discriminated union matching the Rust Token enum.
 */
export type Token =
  // Operators
  | { readonly type: "And" }
  | { readonly type: "Or" }
  | { readonly type: "Not" }

  // Quantifiers
  | { readonly type: "RepeatZeroOrMore" }
  | { readonly type: "RepeatZeroOrMoreLazy" }
  | { readonly type: "RepeatZeroOrMorePossessive" }
  | { readonly type: "RepeatOneOrMore" }
  | { readonly type: "RepeatOneOrMoreLazy" }
  | { readonly type: "RepeatOneOrMorePossessive" }
  | { readonly type: "RepeatZeroOrOne" }
  | { readonly type: "RepeatZeroOrOneLazy" }
  | { readonly type: "RepeatZeroOrOnePossessive" }

  // Structure keywords
  | { readonly type: "Tagged" }
  | { readonly type: "Array" }
  | { readonly type: "Map" }

  // Value keywords
  | { readonly type: "Bool" }
  | { readonly type: "ByteString" }
  | { readonly type: "Date" }
  | { readonly type: "Known" }
  | { readonly type: "Null" }
  | { readonly type: "Number" }
  | { readonly type: "Text" }
  | { readonly type: "Digest" }
  | { readonly type: "Search" }

  // Literals
  | { readonly type: "BoolTrue" }
  | { readonly type: "BoolFalse" }
  | { readonly type: "NaN" }
  | { readonly type: "Infinity" }
  | { readonly type: "NegInfinity" }

  // Delimiters
  | { readonly type: "ParenOpen" }
  | { readonly type: "ParenClose" }
  | { readonly type: "BracketOpen" }
  | { readonly type: "BracketClose" }
  | { readonly type: "BraceOpen" }
  | { readonly type: "BraceClose" }
  | { readonly type: "Comma" }
  | { readonly type: "Colon" }
  | { readonly type: "Ellipsis" }

  // Comparisons
  | { readonly type: "GreaterThanOrEqual" }
  | { readonly type: "LessThanOrEqual" }
  | { readonly type: "GreaterThan" }
  | { readonly type: "LessThan" }

  // Complex literals
  | { readonly type: "NumberLiteral"; readonly value: number }
  | { readonly type: "GroupName"; readonly name: string }
  | { readonly type: "StringLiteral"; readonly value: string }
  | { readonly type: "SingleQuoted"; readonly value: string }
  | { readonly type: "Regex"; readonly pattern: string }
  | { readonly type: "HexString"; readonly value: Uint8Array }
  | { readonly type: "HexRegex"; readonly pattern: string }
  | { readonly type: "DateQuoted"; readonly value: string }
  | { readonly type: "DigestQuoted"; readonly value: string }
  | { readonly type: "Range"; readonly quantifier: Quantifier };

/**
 * A token with its position in the source.
 */
export interface SpannedToken {
  readonly token: Token;
  readonly span: Span;
}

/**
 * Lexer state for tokenizing dCBOR pattern expressions.
 */
export class Lexer {
  readonly #input: string;
  #position: number;
  #tokens: SpannedToken[];

  constructor(input: string) {
    this.#input = input;
    this.#position = 0;
    this.#tokens = [];
  }

  /**
   * Creates a new lexer for the given input.
   */
  static new(input: string): Lexer {
    return new Lexer(input);
  }

  /**
   * Returns the input string.
   */
  input(): string {
    return this.#input;
  }

  /**
   * Returns the current position in the input.
   */
  position(): number {
    return this.#position;
  }

  /**
   * Tokenizes the entire input and returns all tokens.
   * This is a placeholder - full implementation will be added later.
   */
  tokenize(): SpannedToken[] {
    // TODO: Implement full lexer
    return this.#tokens;
  }
}

// Re-export for convenience
export type { Span };
