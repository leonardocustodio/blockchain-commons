/**
 * @bcts/envelope-pattern - Node pattern matching
 *
 * This is a 1:1 TypeScript port of bc-envelope-pattern-rust node_pattern.rs
 *
 * @module envelope-pattern/pattern/structure/node-pattern
 */

import type { Envelope } from "@bcts/envelope";
import { Interval } from "@bcts/dcbor-pattern";
import type { Path } from "../../format";
import type { Matcher } from "../matcher";
import { compileAsAtomic } from "../matcher";
import type { Instr } from "../vm";
import type { Pattern } from "../index";

// Forward declaration for Pattern factory
let createStructureNodePattern: ((pattern: NodePattern) => Pattern) | undefined;

export function registerNodePatternFactory(factory: (pattern: NodePattern) => Pattern): void {
  createStructureNodePattern = factory;
}

/**
 * Pattern type for node pattern matching.
 *
 * Corresponds to the Rust `NodePattern` enum in node_pattern.rs
 */
export type NodePatternType =
  | { readonly type: "Any" }
  | { readonly type: "AssertionsInterval"; readonly interval: Interval };

/**
 * Pattern for matching node envelopes.
 *
 * Corresponds to the Rust `NodePattern` enum in node_pattern.rs
 */
export class NodePattern implements Matcher {
  readonly #pattern: NodePatternType;

  private constructor(pattern: NodePatternType) {
    this.#pattern = pattern;
  }

  /**
   * Creates a new NodePattern that matches any node.
   */
  static any(): NodePattern {
    return new NodePattern({ type: "Any" });
  }

  /**
   * Creates a new NodePattern that matches a node with the specified count of assertions.
   */
  static interval(min: number, max?: number): NodePattern {
    const interval = max !== undefined
      ? Interval.range(min, max)
      : Interval.atLeast(min);
    return new NodePattern({ type: "AssertionsInterval", interval });
  }

  /**
   * Creates a new NodePattern from an Interval.
   */
  static fromInterval(interval: Interval): NodePattern {
    return new NodePattern({ type: "AssertionsInterval", interval });
  }

  /**
   * Gets the pattern type.
   */
  get patternType(): NodePatternType {
    return this.#pattern;
  }

  pathsWithCaptures(haystack: Envelope): [Path[], Map<string, Path[]>] {
    if (!haystack.isNode()) {
      return [[], new Map<string, Path[]>()];
    }

    let isHit = false;

    switch (this.#pattern.type) {
      case "Any":
        isHit = true;
        break;
      case "AssertionsInterval":
        isHit = this.#pattern.interval.contains(haystack.assertions().length);
        break;
    }

    const paths = isHit ? [[haystack]] : [];
    return [paths, new Map<string, Path[]>()];
  }

  paths(haystack: Envelope): Path[] {
    return this.pathsWithCaptures(haystack)[0];
  }

  matches(haystack: Envelope): boolean {
    return this.paths(haystack).length > 0;
  }

  compile(code: Instr[], literals: Pattern[], captures: string[]): void {
    if (createStructureNodePattern === undefined) {
      throw new Error("NodePattern factory not registered");
    }
    compileAsAtomic(createStructureNodePattern(this), code, literals, captures);
  }

  isComplex(): boolean {
    return false;
  }

  toString(): string {
    switch (this.#pattern.type) {
      case "Any":
        return "node";
      case "AssertionsInterval":
        return `node(${this.#pattern.interval})`;
    }
  }

  /**
   * Equality comparison.
   */
  equals(other: NodePattern): boolean {
    if (this.#pattern.type !== other.#pattern.type) {
      return false;
    }
    if (this.#pattern.type === "Any") {
      return true;
    }
    return this.#pattern.interval.equals(
      (other.#pattern as { type: "AssertionsInterval"; interval: Interval }).interval
    );
  }

  /**
   * Hash code for use in Maps/Sets.
   */
  hashCode(): number {
    switch (this.#pattern.type) {
      case "Any":
        return 0;
      case "AssertionsInterval":
        return this.#pattern.interval.hashCode();
    }
  }
}
