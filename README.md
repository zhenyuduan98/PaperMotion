# PaperMotion

**Bring Learning PDFs to Life**

Open a learning PDF or Markdown document in your browser, explore its concepts through interactive visualizations, and study with document chat, flashcards, quizzes, and a knowledge graph.

This repository packages the working browser version with a configurable, server-side AI connection. The original Get It. interface and desktop source are retained; this version focuses on local web use.

## Run locally

Use Node.js 22 or newer and npm. Node.js 24 has been tested on Windows.

```sh
git clone https://github.com/zhenyuduan98/PaperMotion.git
cd PaperMotion
npm ci
```

Copy `.env.example` to `.env.local` (`Copy-Item .env.example .env.local` in PowerShell, or `cp .env.example .env.local` on macOS/Linux), then replace `PI_API_KEY` with your own key.

The example uses `https://copilot.chillicurry.uk/v1`, model `gpt-6-astra`, and `openai-responses`. This model requires the Responses endpoint on that service. You can use another compatible provider by changing the base URL, API type, and both model settings. The repository does not include an API key or API access.

```sh
npm run check:api
npm run browser:build
npm run browser:start
```

Open **http://127.0.0.1:3000**. Keep the terminal open while using the app; press Ctrl+C to stop it. For development, use `npm run browser:dev` instead of building and starting.

## 本机使用

1. 安装 Node.js 22 或以上版本，下载仓库后运行 `npm ci`。
2. 将 `.env.example` 复制为 `.env.local`，把 `PI_API_KEY` 改为自己的密钥。
3. 运行 `npm run check:api` 检查连接，再运行 `npm run browser:build` 和 `npm run browser:start`。
4. 浏览器打开 **http://127.0.0.1:3000**，上传含有可选中文字的 PDF 或 Markdown 文件，也可以打开内置示例。

## Configuration and saved work

| Setting | Purpose |
| --- | --- |
| `GETIT_WEB=1` | Enable direct HTTP API calls for the local web version. |
| `GETIT_DEFAULT_PROVIDER=pi` | Use the Custom API (BYOK) provider by default. |
| `PI_URL` | API base URL, including `/v1` where required. |
| `PI_API_TYPE` | `openai-responses` or `openai-completions` for direct web requests. |
| `PI_API_KEY` | Server-side credential, stored only in your local configuration. |
| `PI_MODEL_FAST` / `PI_MODEL_SMART` | Models for generation tasks and conversations. |
| `GETIT_DATA_DIR` | Local storage directory; defaults here to `./data`. |

Documents, conversations, settings, and generated study material persist in `data/`. Back up that directory to preserve your work. `.env.local`, `data/`, dependencies, and build output are excluded from Git. The PDFs in `public/pdfs/` are upstream sample documents.

AI requests send the relevant document text and conversation to the API provider you configure. Environment-managed keys stay on the server and are hidden in the settings response. This version listens on localhost and is intended for one person on one computer; public hosting requires authentication and access controls.

## Web adaptation

- Direct server-side support for Responses and Chat Completions APIs, with JSON output and persisted multi-turn conversations.
- Configurable default provider and models, plus masked server-managed API settings.
- Local browser launch commands, an API connectivity check, and `/api/health`.
- Windows subprocess handling and Git exclusions for local documents and credentials.

The local version has been checked with a production build, TypeScript, browser upload/PDF rendering, document chat with follow-up context, and flashcard generation. Real API checks require your own credentials.

