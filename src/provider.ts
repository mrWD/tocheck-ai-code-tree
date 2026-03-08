// TOCHECK: Step 4. Tree data provider — transforms ToCheckNodes into VS Code tree items
// and exposes them to the sidebar view.

import * as vscode from "vscode";
import * as path from "path";
import { ToCheckComment, ToCheckNode } from "./types";
import { buildTree } from "./parser";

// TOCHECK: Step 4.1. ToCheckTreeItem wraps a ToCheckNode for the VS Code tree view API.
class ToCheckTreeItem extends vscode.TreeItem {
  constructor(
    public readonly node: ToCheckNode,
    private readonly workspaceRoot: string | undefined
  ) {
    super(
      node.comment.label,
      node.children.length > 0
        ? vscode.TreeItemCollapsibleState.Expanded
        : vscode.TreeItemCollapsibleState.None
    );

    // TOCHECK: Step 4.1.1. Show relative file path and line number as secondary info.
    const filePath = node.comment.fileUri.fsPath;
    const relativePath = workspaceRoot
      ? path.relative(workspaceRoot, filePath)
      : path.basename(filePath);
    const lineDisplay = node.comment.line + 1;

    this.description = `${relativePath}:${lineDisplay}`;
    const tooltip = new vscode.MarkdownString(
      `**${node.comment.label}**\n\n\`${relativePath}\` — line ${lineDisplay}`
    );
    tooltip.isTrusted = false;
    tooltip.supportHtml = false;
    this.tooltip = tooltip;
    this.iconPath = new vscode.ThemeIcon("bookmark");
    this.contextValue = "tocheckItem";

    // TOCHECK: Step 4.1.2. Clicking an item fires the openComment command with location args.
    this.command = {
      command: "tocheck.openComment",
      title: "Go to Comment",
      arguments: [node.comment.fileUri, node.comment.line],
    };
  }
}

// TOCHECK: Step 4.2. The provider implements TreeDataProvider and rebuilds its tree on every scan update.
export class ToCheckTreeProvider
  implements vscode.TreeDataProvider<ToCheckTreeItem>
{
  private tree: ToCheckNode[] = [];
  private workspaceRoot: string | undefined;

  private readonly onDidChangeTreeDataEmitter =
    new vscode.EventEmitter<ToCheckTreeItem | undefined | void>();
  readonly onDidChangeTreeData = this.onDidChangeTreeDataEmitter.event;

  constructor() {
    this.workspaceRoot =
      vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  }

  // TOCHECK: Step 4.3. Called by the scanner's onDidUpdate — replaces the tree and notifies VS Code.
  updateComments(comments: ToCheckComment[]): void {
    this.tree = buildTree(comments);
    this.onDidChangeTreeDataEmitter.fire();
  }

  getTreeItem(element: ToCheckTreeItem): vscode.TreeItem {
    return element;
  }

  // TOCHECK: Step 4.4. Returns root nodes when element is undefined, or children of a parent node.
  getChildren(element?: ToCheckTreeItem): ToCheckTreeItem[] {
    const nodes = element ? element.node.children : this.tree;
    return nodes.map((n) => new ToCheckTreeItem(n, this.workspaceRoot));
  }

  dispose(): void {
    this.onDidChangeTreeDataEmitter.dispose();
  }
}
