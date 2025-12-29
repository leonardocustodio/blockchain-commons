/**
 * @bcts/envelope-pattern - VM instructions and executor
 *
 * This is a 1:1 TypeScript port of bc-envelope-pattern-rust vm.rs
 * Stub file - full implementation will be added later.
 *
 * @module envelope-pattern/pattern/vm
 */

import type { Quantifier } from "@bcts/dcbor-pattern";
import type { Pattern } from "./index";

/**
 * Axis for envelope traversal.
 *
 * Corresponds to the Rust `Axis` enum in vm.rs
 */
export type Axis = "Subject" | "Assertion" | "Predicate" | "Object" | "Wrapped";

/**
 * VM instructions for pattern matching.
 *
 * Corresponds to the Rust `Instr` enum in vm.rs
 */
export type Instr =
  | { readonly type: "MatchPredicate"; readonly literalIndex: number }
  | { readonly type: "MatchStructure"; readonly literalIndex: number }
  | { readonly type: "Split"; readonly a: number; readonly b: number }
  | { readonly type: "Jump"; readonly address: number }
  | { readonly type: "PushAxis"; readonly axis: Axis }
  | { readonly type: "Pop" }
  | { readonly type: "Save" }
  | { readonly type: "Accept" }
  | { readonly type: "Search"; readonly patternIndex: number; readonly captureMap: [string, number][] }
  | { readonly type: "ExtendTraversal" }
  | { readonly type: "CombineTraversal" }
  | { readonly type: "NavigateSubject" }
  | { readonly type: "NotMatch"; readonly patternIndex: number }
  | { readonly type: "Repeat"; readonly patternIndex: number; readonly quantifier: Quantifier }
  | { readonly type: "CaptureStart"; readonly captureIndex: number }
  | { readonly type: "CaptureEnd"; readonly captureIndex: number };

/**
 * Compiled program for the VM.
 */
export interface Program {
  readonly code: Instr[];
  readonly literals: Pattern[];
  readonly captureNames: string[];
}

// Note: Full VM implementation will be added in Phase 8
