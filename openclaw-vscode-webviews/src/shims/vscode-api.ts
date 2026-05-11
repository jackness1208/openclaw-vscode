/**
 * Shim for vscode-messenger-webview's vscode-api module
 *
 * The original vscode-api.js is empty (only has TypeScript declarations).
 * In VS Code webviews, acquireVsCodeApi() is a global function provided
 * by the VS Code runtime. This shim re-exports it so webpack can bundle it.
 */

const _w = window as any; // eslint-disable-line @typescript-eslint/no-explicit-any

export const acquireVsCodeApi = _w.acquireVsCodeApi;
