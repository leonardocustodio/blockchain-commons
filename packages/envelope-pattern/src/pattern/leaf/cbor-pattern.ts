/**
 * @bcts/envelope-pattern - CBOR pattern matching
 *
 * This is a 1:1 TypeScript port of bc-envelope-pattern-rust cbor_pattern.rs
 *
 * @module envelope-pattern/pattern/leaf/cbor-pattern
 */

import type { Envelope } from "@bcts/envelope";
import type { Cbor } from "@bcts/dcbor";
import { cbor as toCbor, type CborEncodable } from "@bcts/dcbor";
import {
  Pattern as DCBORPattern,
  type Matcher as DCBORMatcher,
} from "@bcts/dcbor-pattern";
import type { Path } from "../../format";
import type { Matcher } from "../matcher";
import { compileAsAtomic } from "../matcher";
import type { Instr } from "../vm";
import type { Pattern } from "../index";

// Forward declaration for Pattern factory
let createLeafCBORPattern: ((pattern: CBORPattern) => Pattern) | undefined;

export function registerCBORPatternFactory(factory: (pattern: CBORPattern) => Pattern): void {
  createLeafCBORPattern = factory;
}

/**
 * Pattern type for CBOR pattern matching.
 *
 * Corresponds to the Rust `CBORPattern` enum in cbor_pattern.rs
 */
export type CBORPatternType =
  | { readonly type: "Any" }
  | { readonly type: "Value"; readonly cbor: Cbor }
  | { readonly type: "Pattern"; readonly pattern: DCBORPattern };

/**
 * Pattern for matching CBOR values with support for exact values and advanced pattern matching.
 *
 * Corresponds to the Rust `CBORPattern` enum in cbor_pattern.rs
 */
export class CBORPattern implements Matcher {
  readonly #pattern: CBORPatternType;

  private constructor(pattern: CBORPatternType) {
    this.#pattern = pattern;
  }

  /**
   * Creates a new CBORPattern that matches any CBOR value.
   */
  static any(): CBORPattern {
    return new CBORPattern({ type: "Any" });
  }

  /**
   * Creates a new CBORPattern that matches a specific CBOR value.
   */
  static value(value: CborEncodable): CBORPattern {
    return new CBORPattern({ type: "Value", cbor: toCbor(value) });
  }

  /**
   * Creates a new CBORPattern that matches CBOR values using dcbor-pattern expressions.
   */
  static pattern(dcborPattern: DCBORPattern): CBORPattern {
    return new CBORPattern({ type: "Pattern", pattern: dcborPattern });
  }

  /**
   * Creates a new CBORPattern from a dcbor-pattern Pattern.
   */
  static fromDcborPattern(dcborPattern: DCBORPattern): CBORPattern {
    return new CBORPattern({ type: "Pattern", pattern: dcborPattern });
  }

  /**
   * Gets the pattern type.
   */
  get pattern(): CBORPatternType {
    return this.#pattern;
  }

  /**
   * Convert dcbor captures to envelope captures.
   */
  #convertDcborCapturesToEnvelopeCaptures(
    dcborCaptures: Map<string, Cbor[][]>,
    baseEnvelope: Envelope
  ): Map<string, Path[]> {
    const envelopeCaptures = new Map<string, Path[]>();

    for (const [captureName, dcborCapturePaths] of dcborCaptures) {
      const envelopeCapturePaths: Path[] = dcborCapturePaths.map((dcborPath) =>
        this.#convertDcborPathToEnvelopePath(dcborPath, baseEnvelope)
      );
      envelopeCaptures.set(captureName, envelopeCapturePaths);
    }

    return envelopeCaptures;
  }

  /**
   * Convert a single dcbor path to an envelope path.
   */
  #convertDcborPathToEnvelopePath(dcborPath: Cbor[], baseEnvelope: Envelope): Envelope[] {
    const envelopePath: Envelope[] = [baseEnvelope];

    // Get the base CBOR from the envelope
    const subject = baseEnvelope.subject();
    const baseCbor = subject.asLeaf();

    // Skip first element if it matches the base envelope's CBOR content
    const skipFirst = baseCbor !== undefined &&
      dcborPath.length > 0 &&
      dcborPath[0] !== undefined &&
      dcborPath[0].equals(baseCbor);

    const elementsToAdd = skipFirst ? dcborPath.slice(1) : dcborPath;

    for (const cborElement of elementsToAdd) {
      envelopePath.push(subject.constructor.new(cborElement) as Envelope);
    }

    return envelopePath;
  }

  /**
   * Collect capture names from a dcbor pattern.
   */
  #collectDcborCaptureNames(dcborPattern: DCBORPattern, names: string[]): void {
    // Parse the pattern string to extract capture names
    const patternStr = dcborPattern.toString();

    // Simple parsing to find @name( patterns
    let i = 0;
    while (i < patternStr.length) {
      if (patternStr[i] === "@") {
        i++;
        let name = "";
        // Collect characters until we hit '('
        while (i < patternStr.length && patternStr[i] !== "(") {
          name += patternStr[i];
          i++;
        }
        if (name.length > 0 && !names.includes(name)) {
          names.push(name);
        }
      } else {
        i++;
      }
    }
  }

  pathsWithCaptures(haystack: Envelope): [Path[], Map<string, Path[]>] {
    const subject = haystack.subject();

    // Special case for KnownValue
    const knownValue = subject.asKnownValue();
    if (knownValue !== undefined) {
      switch (this.#pattern.type) {
        case "Any":
          return [[[haystack]], new Map<string, Path[]>()];
        case "Value": {
          // Create CBOR from the KnownValue for comparison
          const knownValueCbor = knownValue.toCbor();
          if (knownValueCbor.equals(this.#pattern.cbor)) {
            return [[[haystack]], new Map<string, Path[]>()];
          }
          return [[], new Map<string, Path[]>()];
        }
        case "Pattern": {
          // Create CBOR from the KnownValue for pattern matching
          const knownValueCbor = knownValue.toCbor();
          const [dcborPaths, dcborCaptures] = (this.#pattern.pattern as DCBORMatcher).pathsWithCaptures(knownValueCbor);

          if (dcborPaths.length > 0) {
            const basePath: Path = [haystack];
            const envelopePaths: Path[] = dcborPaths.map((dcborPath) => {
              const extendedPath = [...basePath];
              // Skip the first element as it represents the root CBOR
              for (let i = 1; i < dcborPath.length; i++) {
                const elem = dcborPath[i];
                if (elem !== undefined) {
                  extendedPath.push(subject.constructor.new(elem) as Envelope);
                }
              }
              return extendedPath;
            });

            const envelopeCaptures = this.#convertDcborCapturesToEnvelopeCaptures(dcborCaptures, haystack);
            return [envelopePaths, envelopeCaptures];
          }
          return [[], new Map<string, Path[]>()];
        }
      }
    }

    // Standard case for CBOR leaf
    const subjectCbor = subject.asLeaf();
    if (subjectCbor === undefined) {
      return [[], new Map<string, Path[]>()];
    }

    switch (this.#pattern.type) {
      case "Any":
        return [[[haystack]], new Map<string, Path[]>()];

      case "Value":
        if (subjectCbor.equals(this.#pattern.cbor)) {
          return [[[haystack]], new Map<string, Path[]>()];
        }
        return [[], new Map<string, Path[]>()];

      case "Pattern": {
        const [dcborPaths, dcborCaptures] = (this.#pattern.pattern as DCBORMatcher).pathsWithCaptures(subjectCbor);

        if (dcborPaths.length > 0) {
          const basePath: Path = [haystack];

          const envelopePaths: Path[] = dcborPaths.map((dcborPath) => {
            const extendedPath = [...basePath];
            // Skip the first element only if it exactly matches our root CBOR
            const skipFirst = dcborPath.length > 0 &&
              dcborPath[0] !== undefined &&
              dcborPath[0].equals(subjectCbor);

            const elementsToAdd = skipFirst ? dcborPath.slice(1) : dcborPath;

            for (const cborElement of elementsToAdd) {
              extendedPath.push(subject.constructor.new(cborElement) as Envelope);
            }
            return extendedPath;
          });

          const envelopeCaptures = this.#convertDcborCapturesToEnvelopeCaptures(dcborCaptures, haystack);
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
    // Register any capture names from this CBOR pattern
    if (this.#pattern.type === "Pattern") {
      const captureNames: string[] = [];
      this.#collectDcborCaptureNames(this.#pattern.pattern, captureNames);
      for (const name of captureNames) {
        if (!captures.includes(name)) {
          captures.push(name);
        }
      }
    }

    if (createLeafCBORPattern === undefined) {
      throw new Error("CBORPattern factory not registered");
    }
    compileAsAtomic(createLeafCBORPattern(this), code, literals, captures);
  }

  isComplex(): boolean {
    return false;
  }

  toString(): string {
    switch (this.#pattern.type) {
      case "Any":
        return "cbor";
      case "Value":
        return `cbor(${this.#pattern.cbor.toDiagnostic()})`;
      case "Pattern":
        return `cbor(/${this.#pattern.pattern}/)`;
    }
  }

  /**
   * Equality comparison.
   */
  equals(other: CBORPattern): boolean {
    if (this.#pattern.type !== other.#pattern.type) {
      return false;
    }
    switch (this.#pattern.type) {
      case "Any":
        return true;
      case "Value":
        return this.#pattern.cbor.equals(
          (other.#pattern as { type: "Value"; cbor: Cbor }).cbor
        );
      case "Pattern":
        return this.#pattern.pattern.equals(
          (other.#pattern as { type: "Pattern"; pattern: DCBORPattern }).pattern
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
      case "Value":
        return this.#pattern.cbor.hashCode();
      case "Pattern":
        return this.#pattern.pattern.hashCode();
    }
  }
}
