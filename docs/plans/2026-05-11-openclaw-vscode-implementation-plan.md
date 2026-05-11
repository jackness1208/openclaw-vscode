# OpenClaw VSCode 插件实现计划

**版本**: v1.0.0
**日期**: 2026-05-11
**状态**: 待执行

---

## 概述

基于 vscode-trace-extension 魔改为 OpenClaw VS Code 插件，实现 Agent 对话功能。

---

## Phase 1: 项目重命名和清理

### Step 1.1: 修改根 package.json

- [ ] 修改 name: `openclaw-vscode`
- [ ] 更新 workspaces 路径
- [ ] 移除 trace 相关 scripts

**文件**: `/Users/jackness/work/ai/openclaw-vscode/package.json`

### Step 1.2: 重命名子包目录

- [ ] `vscode-trace-extension` → `openclaw-vscode-extension`
- [ ] `vscode-trace-webviews` → `openclaw-vscode-webviews`
- [ ] `vscode-trace-common` → `openclaw-vscode-common`

### Step 1.3: 修改扩展包 package.json

**文件**: `openclaw-vscode-extension/package.json`

- [ ] name: `openclaw-vscode-extension`
- [ ] displayName: `OpenClaw`
- [ ] description: `OpenClaw AI Assistant for VS Code`
- [ ] publisher: `openclaw`
- [ ] 替换所有 `traceViewer` → `openclaw`
- [ ] 替换所有 `trace-explorer` → `openclaw-explorer`
- [ ] 替换所有 `trace-compass` → `openclaw`
- [ ] 移除 traceviewer-base、traceviewer-react-components 依赖
- [ ] 添加 uuid、zustand 依赖

### Step 1.4: 修改 webviews 包 package.json

**文件**: `openclaw-vscode-webviews/package.json`

- [ ] name: `openclaw-vscode-webviews`
- [ ] 移除 traceviewer-base、traceviewer-react-components 依赖

### Step 1.5: 修改 common 包 package.json

**文件**: `openclaw-vscode-common/package.json`

- [ ] name: `openclaw-vscode-common`

### Step 1.6: 清理不需要的文件

- [ ] 删除 `vscode-trace-extension/src/json-editor/`
- [ ] 删除 `vscode-trace-extension/src/test/`
- [ ] 删除 `local-libs/traceviewer-libs/`
- [ ] 删除 `doc/` (trace 文档)

---

## Phase 2: Gateway 客户端实现

### Step 2.1: 创建 Gateway 类型定义

**文件**: `openclaw-vscode-common/src/types/gateway.ts`

```typescript
// Gateway 消息类型
export interface GatewayRequest {
  type: 'req';
  id: string;
  method: string;
  params?: Record<string, unknown>;
}

export interface GatewayResponseOk {
  type: 'res';
  id: string;
  ok: true;
  payload: unknown;
}

export interface GatewayResponseError {
  type: 'res';
  id: string;
  ok: false;
  error: { code: number; message: string };
}

export type GatewayResponse = GatewayResponseOk | GatewayResponseError;

export interface GatewayEventFrame {
  type: 'event';
  event: string;
  payload: unknown;
}

export type GatewayMessage = GatewayRequest | GatewayResponse | GatewayEventFrame;

// Agent 类型
export interface AgentInfo {
  id: string;
  name: string;
  emoji: string;
  isDefault: boolean;
}

// 配置类型
export interface OpenClawConfig {
  gatewayUrl: string;
  gatewayToken: string;
}
```

### Step 2.2: 创建配置读取模块

**文件**: `openclaw-vscode-common/src/config/config-reader.ts`

```typescript
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { OpenClawConfig } from '../types/gateway';

export function readOpenClawConfig(): OpenClawConfig | null {
  const configPath = path.join(os.homedir(), '.openclaw', 'openclaw.json');
  if (!fs.existsSync(configPath)) return null;
  
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  const host = config.gateway?.host || '127.0.0.1';
  const port = config.gateway?.port || 18789;
  
  return {
    gatewayUrl: `ws://${host}:${port}`,
    gatewayToken: config.gateway?.token || ''
  };
}
```

### Step 2.3: 实现 WebSocket 客户端

**文件**: `openclaw-vscode-common/src/client/ws-client.ts`

参考 `oooooooooooooffice/src/lib/gateway/ws-client.ts` 实现：
- WebSocket 连接管理
- 自动重连
- 事件分发

### Step 2.4: 实现 RPC 客户端

**文件**: `openclaw-vscode-common/src/client/rpc-client.ts`

参考 `oooooooooooooffice/src/lib/gateway/rpc-client.ts` 实现：
- Promise 封装
- 请求/响应匹配
- 超时处理

### Step 2.5: 实现 Gateway 客户端

**文件**: `openclaw-vscode-common/src/client/gateway-client.ts`

封装 Gateway 操作：
- `connect()` - 认证连接
- `getAgents()` - 获取 Agent 列表
- `sendMessage()` - 发送消息
- `onChatEvent()` - 监听聊天事件

---

## Phase 3: 扩展端实现

### Step 3.1: 重写入口文件

**文件**: `openclaw-vscode-extension/src/extension.ts`

- 移除所有 trace 相关代码
- 初始化 Gateway 客户端
- 注册 ChatViewProvider
- 注册命令

### Step 3.2: 实现 ChatViewProvider

**文件**: `openclaw-vscode-extension/src/chat-explorer/chat-view-provider.ts`

替代 `TraceExplorerOpenedTracesViewProvider`：
- 管理 Webview 生命周期
- 处理消息通信
- 提供 Agent 列表

### Step 3.3: 实现 Gateway 状态管理

**文件**: `openclaw-vscode-extension/src/utils/gateway-status.ts`

- 连接状态显示
- 状态栏指示器

### Step 3.4: 重写消息类型

**文件**: `openclaw-vscode-common/src/messages/vscode-messages.ts`

定义 OpenClaw 特定消息：
- `GET_AGENTS` - 获取 Agent 列表
- `SEND_MESSAGE` - 发送消息
- `CHAT_EVENT` - 聊天事件
- `SWITCH_AGENT` - 切换 Agent

---

## Phase 4: Webview 端实现

### Step 4.1: 创建聊天界面

**文件**: `openclaw-vscode-webviews/src/chat-view/`

- `index.tsx` - 入口
- `ChatContainer.tsx` - 主容器
- `MessageList.tsx` - 消息列表
- `MessageInput.tsx` - 输入框
- `AgentSelector.tsx` - Agent 选择器

### Step 4.2: 实现状态管理

**文件**: `openclaw-vscode-webviews/src/store/chat-store.ts`

使用 Zustand 管理：
- 当前 Agent
- 消息列表
- 连接状态

### Step 4.3: 实现 VS Code 消息通信

**文件**: `openclaw-vscode-webviews/src/common/vscode-message-manager.ts`

保留现有实现，适配 OpenClaw 消息类型。

---

## Phase 5: 测试和调试

### Step 5.1: 本地测试

- [ ] `yarn install`
- [ ] `yarn prepare`
- [ ] F5 启动调试
- [ ] 测试 Gateway 连接
- [ ] 测试 Agent 列表获取
- [ ] 测试消息发送

### Step 5.2: 打包测试

- [ ] `yarn vsce:package`
- [ ] 安装 .vsix 文件测试

---

## 文件修改清单

### 新增文件

| 文件 | 说明 |
|------|------|
| `openclaw-vscode-common/src/types/gateway.ts` | Gateway 类型 |
| `openclaw-vscode-common/src/config/config-reader.ts` | 配置读取 |
| `openclaw-vscode-common/src/client/ws-client.ts` | WebSocket 客户端 |
| `openclaw-vscode-common/src/client/rpc-client.ts` | RPC 客户端 |
| `openclaw-vscode-common/src/client/gateway-client.ts` | Gateway 客户端 |
| `openclaw-vscode-extension/src/chat-explorer/chat-view-provider.ts` | 聊天视图 |
| `openclaw-vscode-webviews/src/chat-view/` | 聊天界面 |
| `openclaw-vscode-webviews/src/store/chat-store.ts` | 状态管理 |

### 修改文件

| 文件 | 说明 |
|------|------|
| `package.json` (根) | 包名、workspaces |
| `openclaw-vscode-extension/package.json` | 扩展配置 |
| `openclaw-vscode-webviews/package.json` | Webview 配置 |
| `openclaw-vscode-common/package.json` | Common 配置 |
| `openclaw-vscode-extension/src/extension.ts` | 入口重写 |
| `openclaw-vscode-common/src/messages/vscode-messages.ts` | 消息类型 |

### 删除文件

| 文件 | 说明 |
|------|------|
| `openclaw-vscode-extension/src/json-editor/` | JSON 编辑器 |
| `openclaw-vscode-extension/src/test/` | 测试文件 |
| `local-libs/traceviewer-libs/` | Trace 库 |
| `doc/` | Trace 文档 |

---

## 预计工作量

| Phase | 预计任务数 |
|-------|-----------|
| Phase 1 | 15 |
| Phase 2 | 10 |
| Phase 3 | 8 |
| Phase 4 | 8 |
| Phase 5 | 5 |
| **总计** | **46** |