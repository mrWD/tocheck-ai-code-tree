// TOCHECK: Step 5. Extension entry point — wires scanner, provider, and commands together.
// This is where VS Code's lifecycle hooks (activate / deactivate) live.

import * as vscode from "vscode";
import { CommentScanner } from "./scanner";
import { ToCheckTreeProvider } from "./provider";

// TOCHECK: Step 5.1. activate() is called once when the extension loads (onStartupFinished).
export function activate(context: vscode.ExtensionContext): void {
  const scanner = new CommentScanner();
  const provider = new ToCheckTreeProvider();

  // TOCHECK: Step 5.2. Register the tree view — binds our provider to the sidebar panel declared in package.json.
  const treeView = vscode.window.createTreeView("tocheckView", {
    treeDataProvider: provider,
    showCollapseAll: true,
  });

  // TOCHECK: Step 5.3. Connect scanner output to provider — every rescan refreshes the tree.
  scanner.onDidUpdate(
    (comments) => provider.updateComments(comments),
    undefined,
    context.subscriptions
  );

  // TOCHECK: Step 5.4. Navigation command — opens the file and reveals the comment line.
  const openCmd = vscode.commands.registerCommand(
    "tocheck.openComment",
    async (fileUri: vscode.Uri, line: number) => {
      const doc = await vscode.workspace.openTextDocument(fileUri);
      const editor = await vscode.window.showTextDocument(doc, {
        preserveFocus: false,
      });

      const range = new vscode.Range(line, 0, line, 0);
      editor.selection = new vscode.Selection(range.start, range.start);
      editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
    }
  );

  // TOCHECK: Step 5.5. Refresh command — lets users manually trigger a full rescan.
  const refreshCmd = vscode.commands.registerCommand("tocheck.refresh", () =>
    scanner.scan()
  );

  context.subscriptions.push(scanner, provider, treeView, openCmd, refreshCmd);

  // TOCHECK: Step 5.6. Initial scan — populate the tree immediately on activation.
  scanner.scan().catch((err) => {
    vscode.window.showWarningMessage(`TOCHECK Explorer: initial scan failed — ${err}`);
  });
}

// TOCHECK: Step 5.7. deactivate() — all cleanup is handled by context.subscriptions disposal.
export function deactivate(): void {
  // Intentionally empty: VS Code disposes subscriptions automatically.
}
