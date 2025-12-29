/**
 * @bcts/envelope-pattern - Array pattern matching
 *
 * This is a 1:1 TypeScript port of bc-envelope-pattern-rust array_pattern.rs
 *
 * @module envelope-pattern/pattern/leaf/array-pattern
 */

import type { Envelope } from "@bcts/envelope";
import type { Cbor } from "@bcts/dcbor";
import { asCborArray } from "@bcts/dcbor";
import {
  Pattern as DCBORPattern,
  Interval,
  type Matcher as DCBORMatcher,
} from "@bcts/dcbor-pattern";
import type { Path } from "../../format";
import type { Matcher } from "../matcher";
import { compileAsAtomic } from "../matcher";
import type { Instr } from "../vm";
import type { Pattern } from "../index";

// Forward declaration for Pattern factory
let createLeafArrayPattern: ((pattern: ArrayPattern) => Pattern) | undefined;

export function registerArrayPatternFactory(factory: (pattern: ArrayPattern) => Pattern): void {
  createLeafArrayPattern = factory;
}

/**
 * Pattern for matching array values.
 *
 * Corresponds to the Rust `ArrayPattern` enum in array_pattern.rs
 */
export type ArrayPatternType =
  | { readonly type: "Any" }
  | { readonly type: "Interval"; readonly interval: Interval }
  | { readonly type: "DCBORPattern"; readonly pattern: DCBORPattern };

/**
 * Pattern for matching array values in envelope leaf nodes.
 *
 * Corresponds to the Rust `ArrayPattern` struct in array_pattern.rs
 */
export class ArrayPattern implements Matcher {
  readonly #pattern: ArrayPatternType;

  private constructor(pattern: ArrayPatternType) {
    this.#pattern = pattern;
  }

  /**
   * Creates a new ArrayPattern that matches any array.
   */
  static any(): ArrayPattern {
    return new ArrayPattern({ type: "Any" });
  }

  /**
   * Creates a new ArrayPattern that matches arrays with a specific length.
   */
  static count(count: number): ArrayPattern {
    return new ArrayPattern({
      type: "Interval",
      interval: Interval.exact(count),
    });
  }

  /**
   * Creates a new ArrayPattern that matches arrays within a length range.
   */
  static interval(min: number, max?: number): ArrayPattern {
    const interval = max !== undefined
      ? Interval.range(min, max)
      : Interval.atLeast(min);
    return new ArrayPattern({ type: "Interval", interval });
  }

  /**
   * Creates a new ArrayPattern from a dcbor-pattern.
   */
  static fromDcborPattern(dcborPattern: DCBORPattern): ArrayPattern {
    return new ArrayPattern({ type: "DCBORPattern", pattern: dcborPattern });
  }

  /**
   * Gets the pattern type.
   */
  get pattern(): ArrayPatternType {
    return this.#pattern;
  }

  pathsWithCaptures(haystack: Envelope): [Path[], Map<string, Path[]>] {
    // Try to extract CBOR from the envelope
    const subject = haystack.subject();
    const cbor = subject.asLeaf();

    if (cbor === undefined) {
      return [[], new Map<string, Path[]>()];
    }

    // Check if it's an array
    const array = asCborArray(cbor);
    if (array === undefined) {
      return [[], new Map<string, Path[]>()];
    }

    switch (this.#pattern.type) {
      case "Any":
        return [[[haystack]], new Map<string, Path[]>()];

      case "Interval": {
        const length = array.length;
        if (this.#pattern.interval.contains(length)) {
          return [[[haystack]], new Map<string, Path[]>()];
        }
        return [[], new Map<string, Path[]>()];
      }

      case "DCBORPattern": {
        // Delegate to dcbor-pattern for matching
        const [dcborPaths, dcborCaptures] = (this.#pattern.pattern as DCBORMatcher).pathsWithCaptures(cbor);

        if (dcborPaths.length > 0) {
          // Convert dcbor paths to envelope paths
          const envelopePaths: Path[] = dcborPaths.map((dcborPath) => {
            const envPath: Path = [haystack];
            // Skip the first element (root) and convert rest to envelopes
            for (let i = 1; i < dcborPath.length; i++) {
              const elem = dcborPath[i];
              if (elem !== undefined) {
                envPath.push(subject.constructor.new(elem) as Envelope);
              }
            }
            return envPath;
          });

          // Convert dcbor captures to envelope captures
          const envelopeCaptures = new Map<string, Path[]>();
          for (const [name, paths] of dcborCaptures) {
            const envCapturePaths: Path[] = paths.map((dcborPath) => {
              const envPath: Path = [haystack];
              for (let i = 1; i < dcborPath.length; i++) {
                const elem = dcborPath[i];
                if (elem !== undefined) {
                  envPath.push(subject.constructor.new(elem) as Envelope);
                }
              }
              return envPath;
            });
            envelopeCaptures.set(name, envCapturePaths);
          }

          return [envelopePaths, envelopeCaptures];
        }

        return [[], new Map<string, Path[]>()];
      }
    }
  }

  paths(haystack: Envelope): Path[] {
    return this.pathsWithCaptures(haystack)[0];
  }

  matches(haystack: Envelope): boolean {
    return this.paths(haystack).length > 0;
  }

  compile(code: Instr[], literals: Pattern[], captures: string[]): void {
    if (createLeafArrayPattern === undefined) {
      throw new Error("ArrayPattern factory not registered");
    }
    compileAsAtomic(createLeafArrayPattern(this), code, literals, captures);
  }

  isComplex(): boolean {
    return false;
  }

  toString(): string {
    switch (this.#pattern.type) {
      case "Any":
        return "[*]";
      case "Interval":
        return `[{${this.#pattern.interval}}]`;
      case "DCBORPattern":
        return this.#pattern.pattern.toString();
    }
  }

  /**
   * Equality comparison.
   */
  equals(other: ArrayPattern): boolean {
    if (this.#pattern.type !== other.#pattern.type) {
      return false;
    }
    switch (this.#pattern.type) {
      case "Any":
        return true;
      case "Interval":
        return this.#pattern.interval.equals(
          (other.#pattern as { type: "Interval"; interval: Interval }).interval
        );
      case "DCBORPattern":
        return this.#pattern.pattern.equals(
          (other.#pattern as { type: "DCBORPattern"; pattern: DCBORPattern }).pattern
        );
    }
  }

  /**
   * Hash code for use in Maps/Sets.
   */
  hashCode(): number {
    switch (this.#pattern.type) {
      case "Any":
        return 0;
      case "Interval":
        return this.#pattern.interval.hashCode();
      case "DCBORPattern":
        return this.#pattern.pattern.hashCode();
    }
  }
}
