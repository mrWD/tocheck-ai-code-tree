// TOCHECK: Step 2. Workspace scanner — discovers files, reads them, watches for changes,
// and feeds parsed comments to the tree provider via a callback.

import * as vscode from "vscode";
import { ToCheckComment } from "./types";
import { parseFileContents } from "./parser";

// TOCHECK: Step 2.1. Scanner class owns file discovery, I/O, and change watching.
export class CommentScanner implements vscode.Disposable {
  private readonly disposables: vscode.Disposable[] = [];
  private debounceTimer: ReturnType<typeof setTimeout> | undefined;

  private readonly onDidUpdateEmitter = new vscode.EventEmitter<
    ToCheckComment[]
  >();
  /** Fires whenever the full set of comments has been re-scanned. */
  // TOCHECK: Step 2.2. Public event that the tree provider subscribes to.
  readonly onDidUpdate = this.onDidUpdateEmitter.event;

  constructor() {
    // TOCHECK: Step 2.3. File system watcher — triggers debounced rescan on create/change/delete.
    const watcher = vscode.workspace.createFileSystemWatcher("**/*");
    watcher.onDidCreate(() => this.debouncedScan(), undefined, this.disposables);
    watcher.onDidChange(() => this.debouncedScan(), undefined, this.disposables);
    watcher.onDidDelete(() => this.debouncedScan(), undefined, this.disposables);
    this.disposables.push(watcher);

    // TOCHECK: Step 2.4. Text document listener — provides live updates while the user edits
    // without waiting for a file-save, using the in-memory buffer instead of disk.
    vscode.workspace.onDidChangeTextDocument(
      () => this.debouncedScan(),
      undefined,
      this.disposables
    );
  }

  // TOCHECK: Step 2.5. Debounce prevents excessive rescans during rapid typing or bulk file ops.
  private debouncedScan(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      this.scan().catch(() => {});
    }, 300);
  }

  /**
   * Perform a full workspace scan.  Reads configuration for include/exclude globs,
   * merges VS Code's `files.exclude` and `search.exclude`, then reads each file.
   */
  // TOCHECK: Step 2.6. Full scan — the main I/O routine called on startup and after changes.
  async scan(): Promise<void> {
    const config = vscode.workspace.getConfiguration("tocheckExplorer");
    const includePattern = config.get<string>(
      "includePattern",
      "**/*.{ts,tsx,js,jsx,py,go,rs,java,c,cpp,h,hpp,cs,rb,php,swift,kt,scala,sh,yaml,yml,json,md,html,css,scss,vue,svelte}"
    );
    const excludeRaw = config.get<string>(
      "excludePattern",
      "**/node_modules/**,**/dist/**,**/build/**,**/.git/**,**/vendor/**,**/target/**"
    );

    // TOCHECK: Step 2.6.1. Merge user-configured excludes with VS Code's built-in file/search excludes.
    const mergedExclude = this.buildExcludePattern(excludeRaw);
    const uris = await vscode.workspace.findFiles(includePattern, mergedExclude);

    const allComments: ToCheckComment[] = [];
    for (const uri of uris) {
      const comments = await this.scanFile(uri);
      allComments.push(...comments);
    }

    this.onDidUpdateEmitter.fire(allComments);
  }

  // TOCHECK: Step 2.7. Reads a single file, preferring the in-memory editor buffer over disk.
  private async scanFile(uri: vscode.Uri): Promise<ToCheckComment[]> {
    try {
      const openDoc = vscode.workspace.textDocuments.find(
        (d) => d.uri.toString() === uri.toString()
      );
      const text = openDoc
        ? openDoc.getText()
        : new TextDecoder("utf-8").decode(
            await vscode.workspace.fs.readFile(uri)
          );

      return parseFileContents(text, uri);
    } catch {
      return [];
    }
  }

  /**
   * Build a single exclude glob by merging the user's exclude pattern
   * with `files.exclude` and `search.exclude` from VS Code settings.
   */
  // TOCHECK: Step 2.8. Exclude-pattern merging — respects the user's editor settings.
  private buildExcludePattern(userExcludes: string): string {
    const patterns = new Set(
      userExcludes.split(",").map((p) => p.trim()).filter(Boolean)
    );

    const addFromConfig = (section: string) => {
      const cfg = vscode.workspace.getConfiguration(section);
      const obj = cfg.get<Record<string, boolean>>("");
      if (obj) {
        for (const [pattern, enabled] of Object.entries(obj)) {
          if (enabled) {
            patterns.add(pattern);
          }
        }
      }
    };

    addFromConfig("files.exclude");
    addFromConfig("search.exclude");

    return `{${[...patterns].join(",")}}`;
  }

  dispose(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.onDidUpdateEmitter.dispose();
    for (const d of this.disposables) {
      d.dispose();
    }
  }
}
