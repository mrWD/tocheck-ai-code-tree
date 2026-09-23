# TOCHECK Explorer

A VS Code / Cursor extension that scans your workspace for `// TOCHECK: Step X. ...` comments and displays them as a hierarchical tree in the sidebar. Click any item to jump straight to its source line.

I wrote it for reviewing code I did not write line by line: whoever (or whatever) produced the code leaves numbered `TOCHECK` comments at the places worth a look, and the sidebar turns them into an ordered walkthrough.

**Try it:** not on the Marketplace or Open VSX yet. Clone the repo, run `npm install && npm run compile`, then press F5 in VS Code or Cursor to open it in an Extension Development Host (see [Development](#development)).

## Usage

Add comments anywhere in your code using the pattern:

```
// TOCHECK: Step 1. Extension entry point
// TOCHECK: Step 1.1. Register tree view
// TOCHECK: Step 1.2. Connect scanner
// TOCHECK: Step 2. File scanning
// TOCHECK: Step 2.1. Discover files
```

The extension automatically builds a hierarchy based on step numbering:

```
- Step 1. Extension entry point
  - Step 1.1. Register tree view
  - Step 1.2. Connect scanner
- Step 2. File scanning
  - Step 2.1. Discover files
```

Multiple comment prefixes are supported: `//`, `#`, `--`, `;`, `%`, `/*`.

## Features

- **Hierarchical tree view** in the activity bar sidebar
- **Auto-refresh** on file create, change, delete, and while editing
- **Click to navigate**: opens the file and centers the editor on the comment line
- **Manual refresh** button in the view title bar
- **Configurable** include/exclude file glob patterns
- **Respects** `files.exclude` and `search.exclude` VS Code settings

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `tocheckExplorer.includePattern` | `**/*.{ts,tsx,js,...}` | Glob for files to scan |
| `tocheckExplorer.excludePattern` | `**/node_modules/**,...` | Comma-separated exclude globs |

## Development

```bash
npm install
npm run compile    # one-shot build
npm run watch      # rebuild on changes
```

Press **F5** in VS Code / Cursor to launch the Extension Development Host.

To install it into your own editor, package it with `npx @vscode/vsce package` and pick the resulting `.vsix` in "Extensions: Install from VSIX...".

## Architecture

See the `// TOCHECK: Step N.` comments in the source code itself for a guided walkthrough of the code flow:

| Step | File | Description |
|------|------|-------------|
| 1 | `src/types.ts` | Data model interfaces |
| 2 | `src/scanner.ts` | Workspace file discovery and watching |
| 3 | `src/parser.ts` | Regex parsing and hierarchy building |
| 4 | `src/provider.ts` | Tree data provider for the sidebar |
| 5 | `src/extension.ts` | Activation, commands, wiring |

## Status

Built in March 2026, version 0.1.0. It does what I need day to day; no tests and no Marketplace listing yet.

## License

MIT, see [LICENSE](LICENSE).
