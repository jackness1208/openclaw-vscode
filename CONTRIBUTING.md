# Contributing to OpenClaw VS Code Extension

Thanks for your interest in contributing to OpenClaw VS Code Extension!

## Development Setup

1. Install Node.js 20+ and yarn
2. Clone the repository
3. Run `yarn` to install dependencies
4. Run `yarn watch` for development with hot-reload
5. Press `F5` to launch the extension in Extension Development Host

## Project Structure

- `openclaw-vscode-common/` - Shared types, Gateway client, config reader
- `openclaw-vscode-extension/` - VS Code extension host (commands, webview provider, status bar)
- `openclaw-vscode-webviews/` - React webview UI (chat view, agent selector)

## Code Style

- TypeScript strict mode
- Run `yarn lint` before committing
- Run `yarn format:write` to auto-format with Prettier

## Pull Requests

1. Create a feature branch from `main`
2. Make your changes with clear commit messages
3. Ensure `yarn prepare` passes without errors
4. Submit a PR with a description of the changes

### Commit Message Format

- **Title**: Concise and complete, written in imperative (e.g. "Fix Gateway authentication handshake")
- **Problem**: What needs to be resolved and why
- **Solution**: What changes were made and why they are the right fix
- **Impact**: What effect the changes have

## Reporting Issues

Please open a GitHub issue with:

- Steps to reproduce
- Expected vs actual behavior
- VS Code version and OS

## License

MIT
