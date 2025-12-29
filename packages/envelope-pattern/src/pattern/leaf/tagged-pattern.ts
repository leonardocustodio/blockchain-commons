/**
 * @bcts/envelope-pattern - Tagged pattern matching
 *
 * This is a 1:1 TypeScript port of bc-envelope-pattern-rust tagged_pattern.rs
 *
 * @module envelope-pattern/pattern/leaf/tagged-pattern
 */

import type { Envelope } from "@bcts/envelope";
import type { Tag } from "@bcts/tags";
import {
  TaggedPattern as DCBORTaggedPattern,
  Pattern as DCBORPattern,
  type Matcher as DCBORMatcher,
} from "@bcts/dcbor-pattern";
import type { Path } from "../../format";
import type { Matcher } from "../matcher";
import { compileAsAtomic } from "../matcher";
import type { Instr } from "../vm";
import type { Pattern } from "../index";

// Forward declaration for Pattern factory
let createLeafTaggedPattern: ((pattern: TaggedPattern) => Pattern) | undefined;

export function registerTaggedPatternFactory(factory: (pattern: TaggedPattern) => Pattern): void {
  createLeafTaggedPattern = factory;
}

/**
 * Pattern for matching tagged CBOR values.
 *
 * This is a wrapper around dcbor_pattern::TaggedPattern that provides
 * envelope-specific integration.
 *
 * Corresponds to the Rust `TaggedPattern` struct in tagged_pattern.rs
 */
export class TaggedPattern implements Matcher {
  readonly #inner: DCBORTaggedPattern;

  private constructor(inner: DCBORTaggedPattern) {
    this.#inner = inner;
  }

  /**
   * Creates a new TaggedPattern that matches any tagged value.
   */
  static any(): TaggedPattern {
    return new TaggedPattern(DCBORTaggedPattern.any());
  }

  /**
   * Creates a new TaggedPattern with a specific tag and content pattern.
   */
  static withTag(tag: Tag, pattern: DCBORPattern): TaggedPattern {
    return new TaggedPattern(DCBORTaggedPattern.withTag(tag, pattern));
  }

  /**
   * Creates a new TaggedPattern with a specific tag name and content pattern.
   */
  static withName(name: string, pattern: DCBORPattern): TaggedPattern {
    return new TaggedPattern(DCBORTaggedPattern.withName(name, pattern));
  }

  /**
   * Creates a new TaggedPattern with a tag name matching regex and content pattern.
   */
  static withRegex(regex: RegExp, pattern: DCBORPattern): TaggedPattern {
    return new TaggedPattern(DCBORTaggedPattern.withRegex(regex, pattern));
  }

  /**
   * Creates a new TaggedPattern from a dcbor-pattern TaggedPattern.
   */
  static fromDcborPattern(dcborPattern: DCBORTaggedPattern): TaggedPattern {
    return new TaggedPattern(dcborPattern);
  }

  /**
   * Gets the underlying dcbor-pattern TaggedPattern.
   */
  get inner(): DCBORTaggedPattern {
    return this.#inner;
  }

  pathsWithCaptures(haystack: Envelope): [Path[], Map<string, Path[]>] {
    // Try to extract CBOR from the envelope
    const subject = haystack.subject();
    const cbor = subject.asLeaf();

    if (cbor !== undefined) {
      // Delegate to dcbor-pattern for CBOR matching
      const [dcborPaths, dcborCaptures] = (this.#inner as DCBORMatcher).pathsWithCaptures(cbor);

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
    if (createLeafTaggedPattern === undefined) {
      throw new Error("TaggedPattern factory not registered");
    }
    compileAsAtomic(createLeafTaggedPattern(this), code, literals, captures);
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
  equals(other: TaggedPattern): boolean {
    return this.#inner.equals(other.#inner);
  }

  /**
   * Hash code for use in Maps/Sets.
   */
  hashCode(): number {
    return this.#inner.hashCode();
  }
}
