/**
 * @bcts/envelope-pattern - Known value pattern matching
 *
 * This is a 1:1 TypeScript port of bc-envelope-pattern-rust known_value_pattern.rs
 *
 * @module envelope-pattern/pattern/leaf/known-value-pattern
 */

import type { Envelope } from "@bcts/envelope";
import { KnownValue } from "@bcts/known-values";
import {
  KnownValuePattern as DCBORKnownValuePattern,
  type Matcher as DCBORMatcher,
} from "@bcts/dcbor-pattern";
import type { Path } from "../../format";
import type { Matcher } from "../matcher";
import { compileAsAtomic } from "../matcher";
import type { Instr } from "../vm";
import type { Pattern } from "../index";

// Forward declaration for Pattern factory
let createLeafKnownValuePattern: ((pattern: KnownValuePattern) => Pattern) | undefined;

export function registerKnownValuePatternFactory(factory: (pattern: KnownValuePattern) => Pattern): void {
  createLeafKnownValuePattern = factory;
}

/**
 * Pattern for matching known values.
 *
 * This is a wrapper around dcbor_pattern::KnownValuePattern that provides
 * envelope-specific integration.
 *
 * Corresponds to the Rust `KnownValuePattern` struct in known_value_pattern.rs
 */
export class KnownValuePattern implements Matcher {
  readonly #inner: DCBORKnownValuePattern;

  private constructor(inner: DCBORKnownValuePattern) {
    this.#inner = inner;
  }

  /**
   * Creates a new KnownValuePattern that matches any known value.
   */
  static any(): KnownValuePattern {
    return new KnownValuePattern(DCBORKnownValuePattern.any());
  }

  /**
   * Creates a new KnownValuePattern that matches the specific known value.
   */
  static value(value: KnownValue): KnownValuePattern {
    return new KnownValuePattern(DCBORKnownValuePattern.value(value));
  }

  /**
   * Creates a new KnownValuePattern that matches known values by name.
   */
  static named(name: string): KnownValuePattern {
    return new KnownValuePattern(DCBORKnownValuePattern.named(name));
  }

  /**
   * Creates a new KnownValuePattern that matches known values by regex on their name.
   */
  static regex(regex: RegExp): KnownValuePattern {
    return new KnownValuePattern(DCBORKnownValuePattern.regex(regex));
  }

  /**
   * Creates a new KnownValuePattern from a dcbor-pattern KnownValuePattern.
   */
  static fromDcborPattern(dcborPattern: DCBORKnownValuePattern): KnownValuePattern {
    return new KnownValuePattern(dcborPattern);
  }

  /**
   * Gets the underlying dcbor-pattern KnownValuePattern.
   */
  get inner(): DCBORKnownValuePattern {
    return this.#inner;
  }

  pathsWithCaptures(haystack: Envelope): [Path[], Map<string, Path[]>] {
    // Check if the envelope is a known value
    const subject = haystack.subject();
    const knownValue = subject.asKnownValue();

    if (knownValue !== undefined) {
      // Create CBOR from the KnownValue for pattern matching
      const knownValueCbor = knownValue.toCbor();
      const dcborPaths = (this.#inner as DCBORMatcher).paths(knownValueCbor);

      if (dcborPaths.length > 0) {
        return [[[haystack]], new Map<string, Path[]>()];
      }
    }

    // Also try matching as a leaf
    const cbor = subject.asLeaf();
    if (cbor !== undefined) {
      const dcborPaths = (this.#inner as DCBORMatcher).paths(cbor);
      if (dcborPaths.length > 0) {
        return [[[haystack]], new Map<string, Path[]>()];
      }
    }

    return [[], new Map<string, Path[]>()];
  }

  paths(haystack: Envelope): Path[] {
    return this.pathsWithCaptures(haystack)[0];
  }

  matches(haystack: Envelope): boolean {
    return this.paths(haystack).length > 0;
  }

  compile(code: Instr[], literals: Pattern[], captures: string[]): void {
    if (createLeafKnownValuePattern === undefined) {
      throw new Error("KnownValuePattern factory not registered");
    }
    compileAsAtomic(createLeafKnownValuePattern(this), code, literals, captures);
  }

  isComplex(): boolean {
    return false;
  }

  toString(): string {
    return this.#inner.toString();
  }

  /**
   * Equality comparison.
   */
  equals(other: KnownValuePattern): boolean {
    return this.#inner.equals(other.#inner);
  }

  /**
   * Hash code for use in Maps/Sets.
   */
  hashCode(): number {
    return this.#inner.hashCode();
  }
}
