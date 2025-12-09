/// Gordian Envelope TypeScript Library
///
/// A TypeScript implementation of Blockchain Commons' Gordian Envelope
/// specification for structured, privacy-focused data containers.
///
/// This is a 1:1 port of the Rust bc-envelope library, maintaining the same
/// API structure and functionality.
///
/// @module bc-envelope

// Re-export everything from the base module
export * from "./base";

// Re-export everything from the extension module
export * from "./extension";

// Re-export everything from the format module
// Import for side effects (registers prototype extensions like treeFormat)
// NOTE: This must be a regular export (not `export type *`) to include
// the module augmentation declarations for treeFormat, shortId, summary
import "./format";
export * from "./format";

// Re-export everything from the utils module
export * from "./utils";

// Version information
export const VERSION = "0.37.0";
