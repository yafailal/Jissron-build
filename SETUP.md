# Setting up Claude Code

## 1. Prerequisites

You need:
- **A terminal** (macOS Terminal, Windows Terminal, or any Linux shell)
- **A paid Claude account** — the free Claude.ai plan does NOT include Claude Code
  - Claude Pro ($20/month) is enough for most work
  - Claude Max is better if you'll build for many hours per day
- **(Optional) Node.js 18+** — only if you use the npm install method

## 2. Install Claude Code

Pick one of these two methods.

### Option A — Native installer (recommended, no Node.js needed)

**macOS / Linux:**
```bash
curl -fsSL https://claude.ai/install.sh | bash
```

**Windows (PowerShell):**
```powershell
irm https://claude.ai/install.ps1 | iex
```

### Option B — via npm (if you already use Node.js)

```bash
npm install -g @anthropic-ai/claude-code
```

⚠️ **Never use `sudo npm install`** — it causes permission problems.

### Verify it works

```bash
claude --version
```

You should see a version number. If you get "command not found," restart your terminal.

## 3. Log in

```bash
claude
```

On the first run, it will open your browser to authenticate with your Claude account. Click through the prompts. Your credentials are stored locally after that.

## 4. Navigate to this project folder and start

```bash
cd path/to/jissron-build
claude
```

Claude Code will read `CLAUDE.md` automatically on launch and know exactly what to do.

## 5. Your first command

Open `docs/05-first-prompts.md` and paste **Prompt 1** into the Claude Code session. It will scaffold the entire project.

---

## Useful shortcuts once you're in a Claude Code session

| Command | What it does |
|---|---|
| `/help` | Show all available commands |
| `/resume` | Continue a previous session |
| `/clear` | Clear the current conversation |
| `/bug` | Report a problem to Anthropic |
| `Esc` | Interrupt Claude mid-response |
| `↑` | See command history |
| `Tab` | Autocomplete slash commands |

## If something breaks

- `claude doctor` — diagnoses common problems
- Anthropic docs: https://docs.claude.com/en/docs/claude-code/overview
