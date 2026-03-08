// TOCHECK: Step 3. Comment parsing — converts raw file text into a sorted hierarchy of ToCheckNodes.

import * as vscode from "vscode";
import { ToCheckComment, ToCheckNode } from "./types";

// TOCHECK: Step 3.1. Pre-compiled regex avoids repeated compilation and prevents ReDoS
// by using possessive-style greedy quantifiers on bounded character classes.
// Supports any comment prefix: //, #, --, ;, %, /* ... */
const TOCHECK_PATTERN =
  /(?:\/\/|#|--|;|%|\/\*)\s*TOCHECK:\s*(Step\s+([\d]+(?:\.[\d]+)*)\.?\s*(.*))/;

/**
 * Parse a single line for a TOCHECK comment.
 * Returns null if the line doesn't contain one.
 */
// TOCHECK: Step 3.2. Single-line extraction — returns a ToCheckComment or null.
export function parseLine(
  line: string,
  lineIndex: number,
  fileUri: vscode.Uri
): ToCheckComment | null {
  const match = TOCHECK_PATTERN.exec(line);
  if (!match) {
    return null;
  }

  const fullLabel = match[1].trim();
  const stepString = match[2];
  const stepParts = stepString.split(".").map(Number);

  return { stepParts, label: fullLabel, fileUri, line: lineIndex };
}

/**
 * Parse all TOCHECK comments from file contents.
 */
// TOCHECK: Step 3.3. Batch extraction — scans every line of a file.
export function parseFileContents(
  text: string,
  fileUri: vscode.Uri
): ToCheckComment[] {
  const results: ToCheckComment[] = [];
  const lines = text.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const comment = parseLine(lines[i], i, fileUri);
    if (comment) {
      results.push(comment);
    }
  }

  return results;
}

/**
 * Compare two step-part arrays numerically, segment by segment.
 * Returns negative if a < b, positive if a > b, 0 if equal.
 */
// TOCHECK: Step 3.4. Numeric comparison ensures Step 2 sorts before Step 10.
function compareStepParts(a: readonly number[], b: readonly number[]): number {
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const ai = i < a.length ? a[i] : 0;
    const bi = i < b.length ? b[i] : 0;
    if (ai !== bi) {
      return ai - bi;
    }
  }
  return 0;
}

/**
 * Determine if `parent` step parts are a direct parent of `child`.
 * E.g. [1,2] is parent of [1,2,3] but not of [1,2,3,4].
 */
function isDirectParent(
  parent: readonly number[],
  child: readonly number[]
): boolean {
  if (child.length !== parent.length + 1) {
    return false;
  }
  for (let i = 0; i < parent.length; i++) {
    if (parent[i] !== child[i]) {
      return false;
    }
  }
  return true;
}

/**
 * Build a sorted, hierarchical tree from a flat list of comments.
 *
 * Algorithm: sort all comments, then greedily assign each comment as a child
 * of the deepest matching parent already seen.  This runs in O(n * d) where
 * d is the max nesting depth (typically < 5).
 */
// TOCHECK: Step 3.5. Tree construction — the core hierarchy builder.
export function buildTree(comments: ToCheckComment[]): ToCheckNode[] {
  const sorted = [...comments].sort((a, b) =>
    compareStepParts(a.stepParts, b.stepParts)
  );

  const roots: ToCheckNode[] = [];
  const allNodes: ToCheckNode[] = [];

  for (const comment of sorted) {
    const node: ToCheckNode = { comment, children: [] };

    let placed = false;
    for (let i = allNodes.length - 1; i >= 0; i--) {
      if (isDirectParent(allNodes[i].comment.stepParts, comment.stepParts)) {
        allNodes[i].children.push(node);
        placed = true;
        break;
      }
    }

    if (!placed) {
      roots.push(node);
    }
    allNodes.push(node);
  }

  return roots;
}
