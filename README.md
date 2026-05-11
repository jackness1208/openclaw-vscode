# OpenClaw VS Code Extension

OpenClaw AI Assistant for VS Code - Multi-agent conversation with Gateway integration.

## Features

- Multi-agent chat interface in VS Code sidebar
- WebSocket-based Gateway connection with token authentication
- Agent selection and switching
- Real-time streaming chat responses
- Status bar indicator for connection state

## Prerequisites

- Node.js 20+
- yarn

```bash
nvm install 20
npm i -g yarn
```

## Getting Started

### Install Dependencies

```bash
yarn
```

### Build

```bash
yarn prepare
```

### Development

Start watch mode for hot-reload during development:

```bash
yarn watch
```

Press `F5` in VS Code to launch the extension in a new Extension Development Host window.

### Package as VSIX

```bash
yarn vsce:package
```

## Configuration

Create `~/.openclaw/openclaw.json`:

```json
{
    "gateway": {
        "host": "127.0.0.1",
        "port": 18789,
        "token": "your-gateway-token"
    }
}
```

Or set the `OPENCLAW_CONFIG_PATH` environment variable to specify a custom config path.

### VS Code Settings

| Setting                 | Default                     | Description                     |
| ----------------------- | --------------------------- | ------------------------------- |
| `openclaw.defaultAgent` | `main`                      | Default agent for conversations |
| `openclaw.configPath`   | `~/.openclaw/openclaw.json` | Path to configuration file      |

## Commands

| Command                       | Description             |
| ----------------------------- | ----------------------- |
| `openclaw.refresh`            | Refresh chat view       |
| `openclaw.clearChat`          | Clear chat history      |
| `openclaw.gateway.connect`    | Connect to Gateway      |
| `openclaw.gateway.disconnect` | Disconnect from Gateway |

## Project Structure

```
openclaw-vscode/
├── openclaw-vscode-common/      # Shared types, config, client libraries
├── openclaw-vscode-extension/   # VS Code extension host code
├── openclaw-vscode-webviews/    # React-based webview UI
├── configs/                     # Shared build configs
└── scripts/                     # Build utilities
```

## License

MIT
