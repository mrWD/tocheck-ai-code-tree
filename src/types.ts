// TOCHECK: Step 1. Type definitions — start here to understand the data model.
// These interfaces flow through every module: Scanner produces ToCheckComment[],
// Parser builds them into a ToCheckNode tree, and Provider renders nodes as tree items.

import * as vscode from "vscode";

/**
 * Raw comment extracted from a source file before hierarchy resolution.
 */
// TOCHECK: Step 1.1. A flat record produced by the parser's regex pass over a single file.
export interface ToCheckComment {
  /** Numeric step segments, e.g. [1, 2, 3] for "Step 1.2.3" */
  readonly stepParts: readonly number[];
  /** Original full label after "TOCHECK:", e.g. "Step 1.2.3. Fix the widget" */
  readonly label: string;
  /** Absolute URI of the file containing this comment */
  readonly fileUri: vscode.Uri;
  /** Zero-based line number where the comment appears */
  readonly line: number;
}

/**
 * Hierarchical node used by the tree provider.
 * Children are grouped under their parent step (e.g. 1.2 is child of 1).
 */
// TOCHECK: Step 1.2. A tree node that may contain children, built by the parser's hierarchy pass.
export interface ToCheckNode {
  readonly comment: ToCheckComment;
  readonly children: ToCheckNode[];
}
