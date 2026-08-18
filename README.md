# AuditSocials Compliance MCP — Pre‑Publish Ad & Social Policy Check for AI Agents

[![npm version](https://img.shields.io/npm/v/auditsocials-compliance-mcp)](https://www.npmjs.com/package/auditsocials-compliance-mcp)
[![npm downloads](https://img.shields.io/npm/dm/auditsocials-compliance-mcp)](https://www.npmjs.com/package/auditsocials-compliance-mcp)
[![license](https://img.shields.io/npm/l/auditsocials-compliance-mcp)](./LICENSE)
[![MCP](https://img.shields.io/badge/Model_Context_Protocol-server-blue)](https://modelcontextprotocol.io)

> **A [Model Context Protocol](https://modelcontextprotocol.io) (MCP) server that checks AI‑generated social media and ad content against the *current* advertising and community policies of 8 platforms — Meta (Facebook/Instagram), TikTok, LinkedIn, Google Ads, YouTube, X (Twitter), Snapchat and Pinterest — *before* it is published.** It returns the exact risky phrase, why it's risky, and a compliant rewrite, so posts, ad accounts and campaigns aren't flagged, demonetized, shadow‑limited or banned.

Give your AI writing assistant or agent a **pre‑publish compliance guardrail**: one self‑describing tool it can call on any draft — no prompt engineering, no SDK.

- 🛡️ **8 platforms, current policy** — advertising + community guidelines for Meta, TikTok, LinkedIn, Google Ads, YouTube, X, Snapchat, Pinterest.
- 🎯 **Actionable findings** — the exact risky phrase, the severity, a confidence label, *why* it violates policy, and a **compliant rewrite**.
- 🤖 **Built for agents** — a single MCP tool with a rich description; your agent discovers and calls it automatically.
- ⚡ **30‑second setup** — `npx`, drop in a free key, done. Works with Claude, Cursor, VS Code, Windsurf, Cline and any MCP client.
- 🆓 **Free tier** — 50 checks / month, no credit card.

---

## Table of contents

- [Who is this for](#who-is-this-for)
- [What it catches](#what-it-catches)
- [Quickstart](#quickstart)
- [Client setup (Claude, Cursor, VS Code, Windsurf, Cline…)](#client-setup)
- [Usage — just ask your agent](#usage--just-ask-your-agent)
- [The tool](#the-tool)
- [Example response](#example-response)
- [Pricing & limits](#pricing--limits)
- [How it works](#how-it-works)
- [FAQ](#faq)
- [Links](#links)

---

## Who is this for

- **AI content & ad‑copy tools** that generate social posts, captions, tweets, video scripts or ad creative and need a moderation / brand‑safety pass before publishing.
- **Agentic workflows & autopilots** (Claude, Cursor, custom agents) that draft and schedule content and must not get the account restricted.
- **Marketing & growth teams and agencies** running paid social across many platforms who want to catch policy risk *before* an ad is rejected or an account is flagged.
- **Developers** building social schedulers, DTC marketing SaaS, influencer tooling, or compliance features who want a policy check as an API/MCP call instead of maintaining 8 platforms' rulebooks themselves.

## What it catches

The guardrail combines deterministic pattern rules with AI reasoning over live platform policy. It surfaces risk across categories such as:

- **Health, wellness & supplements** — unrealistic weight‑loss claims, "miracle" / "cure" language, unverifiable "clinically proven" endorsements.
- **Finance & crypto** — "guaranteed returns", "risk‑free", "get rich quick", "zero risk", unsubstantiated return figures.
- **Misleading & unsubstantiated claims** — superlatives, false urgency, implied outcomes you can't back up.
- **Prohibited & restricted content** — categories platforms disallow or gate (regulated goods, sensitive attributes, etc.).
- **Platform‑specific advertising rules** — the things that quietly get ads rejected or distribution reduced rather than outright banned.

Every finding carries a **confidence label** (`firm` vs `possibly_risky`) so your agent can act proportionately — fix the firm ones, review the borderline ones. Findings are grounded in the same live policy engine behind the [AuditSocials Policy Tracker](https://www.auditsocials.com/policy-tracker); they're never fabricated and are hedged when uncertain.

## Quickstart

1. **Get a free API key** → <https://www.auditsocials.com/compliance-api> (50 checks/month, no card).
2. Add the server to your MCP client (config below) with your key as `AUDITSOCIALS_API_KEY`.
3. Ask your agent: *"Check this before I post it: …"*

```jsonc
{
  "mcpServers": {
    "auditsocials-compliance": {
      "command": "npx",
      "args": ["-y", "auditsocials-compliance-mcp"],
      "env": { "AUDITSOCIALS_API_KEY": "as_live_..." }
    }
  }
}
```

## Client setup

The server speaks MCP over **stdio**, so it works with any MCP‑compatible client. Paste the config into your client and drop in your key.

- **Claude Desktop** — `claude_desktop_config.json` → `mcpServers` (config above).
- **Claude Code** — `claude mcp add` or your `.mcp.json` → `mcpServers`.
- **Cursor** — Settings → MCP → add the server (same `mcpServers` shape).
- **VS Code (GitHub Copilot / MCP)** — add to your MCP config with the `command`/`args`/`env` above.
- **Windsurf, Cline, Continue, Zed, and other MCP clients** — point them at the `npx -y auditsocials-compliance-mcp` command with `AUDITSOCIALS_API_KEY` in the environment.

> Restart the client after adding the server so it discovers the tool.

## Usage — just ask your agent

No prompt engineering. Your agent picks the tool automatically. Examples:

- *"Check this caption against TikTok and Meta before I post it: '…'"*
- *"Write 3 Instagram captions for my supplement brand — run each through a compliance check first."*
- *"Is this ad copy safe to run on Meta and Google Ads? Rewrite anything risky."*
- *"Review my launch tweet for all 8 platforms and flag policy risks."*

## The tool

### `check_social_content_compliance`

Checks a piece of social/ad content against the current policies of the 8 platforms and returns an overall verdict plus specific findings.

| Param | Type | Notes |
|-------|------|-------|
| `content` | `string` (required) | The post / caption / tweet / video script / ad copy to check. Up to 10,000 characters. |
| `platforms` | `string[]` (optional) | Any of `Meta`, `TikTok`, `LinkedIn`, `Google Ads`, `YouTube`, `X`, `Snapchat`, `Pinterest`. Omit to check against all 8. |
| `contentType` | `post` \| `caption` \| `ad` \| `video-script` (optional) | Helps apply the right rule set. |

**Returns:** an overall `verdict` (e.g. `ok` / `needs_changes`), a short `summary`, and a list of `findings` — each with `severity`, `confidence`, the matched phrase, the reason it's risky, and a suggested compliant rewrite. Each response also reports your remaining monthly credits.

## Example response

Input — an ad draft: *"Get rich quick! Guaranteed 500% crypto returns, zero risk, invest today."*

```
Verdict: NEEDS_CHANGES
4 potential issue(s) (2 firm) for LinkedIn. Review and apply the suggested fixes before publishing.

• [critical/firm] Guaranteed returns language (Finance & Crypto)
    risky text: "Guaranteed"
    why: Any language suggesting guaranteed investment outcomes ("guaranteed", "risk-free", "100% returns", …).
    fix: Remove any guarantee of financial outcome; state that returns vary and capital is at risk.

• [high/firm] High-risk claim language (Finance & Crypto)
    risky text: "Get rich quick"
    fix: Rephrase to a hedged, substantiable statement and add any required disclaimer.

… + 2 more
— 49 of 50 credits left this month (free).
```

## Pricing & limits

One credit = one full‑quality check (deterministic + AI, all 8 platforms). You're charged on **volume, not depth** — every tier returns the full result.

| Tier | Checks / month | Price |
|------|----------------|-------|
| **Free** | 50 | $0 — no card |
| **Starter** | 5,000 | $99 / mo |
| **Growth** | 25,000 | $299 / mo |
| **Scale** | custom / OEM | [talk to us](https://www.auditsocials.com/compliance-api) |

Check your balance any time at <https://www.auditsocials.com/compliance-api/usage> or `GET /api/v1/credits`.

## How it works

This package is a **thin, open‑source client** (~160 lines). All policy data, AI reasoning, quota and metering live server‑side in the hosted **AuditSocials Compliance API** — the package ships **no secrets, no rules, no policy data**, and simply forwards your content with your API key over HTTPS. That means the guardrail stays current as platform policies change, without you shipping an update.

```
your agent ──(MCP/stdio)──▶ auditsocials-compliance-mcp ──(HTTPS + your key)──▶ AuditSocials Compliance API ──▶ live 8‑platform policy engine
```

## FAQ

**What is the AuditSocials Compliance MCP?**
An MCP server that gives an AI assistant a single tool to check social media / advertising content against the current policies of 8 major platforms before it's published, returning specific risks and compliant rewrites.

**Which platforms are covered?**
Meta (Facebook & Instagram), TikTok, LinkedIn, Google Ads, YouTube, X (Twitter), Snapchat and Pinterest — advertising and community policies.

**Does it guarantee my content will be approved?**
No. It's a risk‑flagging layer, not a guarantee. Platform review is opaque and changes constantly; the tool surfaces known policy risk and cites the rule behind each flag so you can decide. It deliberately does not claim to predict or guarantee approval.

**Do I need an API key?**
Yes — a free key (50 checks/month, no card) at <https://www.auditsocials.com/compliance-api>. Set it as `AUDITSOCIALS_API_KEY`.

**Which MCP clients work?**
Any MCP client that supports stdio servers — Claude Desktop, Claude Code, Cursor, VS Code, Windsurf, Cline, Continue, Zed and others.

**Is my content or key stored?**
The package sends your content and key over HTTPS to the API to run the check. It ships no secrets itself. See the [privacy policy](https://www.auditsocials.com/privacy).

**How is this different from a generic moderation API?**
Generic moderation flags toxicity/safety. This checks *platform advertising & community policy* — the rules that get ads rejected, accounts restricted, or content demonetized — across 8 platforms, with the exact policy reason and a rewrite.

## Links

- 🔑 **Get a free API key:** <https://www.auditsocials.com/compliance-api>
- 📖 **API + MCP docs:** <https://www.auditsocials.com/compliance-api/mcp>
- 📊 **Check your usage:** <https://www.auditsocials.com/compliance-api/usage>
- 📡 **Policy Tracker (the live engine behind it):** <https://www.auditsocials.com/policy-tracker>
- 📦 **npm:** <https://www.npmjs.com/package/auditsocials-compliance-mcp>

---

**Keywords:** MCP server, Model Context Protocol, AI content compliance, social media policy checker, ad policy compliance API, pre‑publish moderation, brand safety, Meta ad policy, TikTok community guidelines, Google Ads policy, LinkedIn advertising policy, YouTube advertiser‑friendly guidelines, X ads policy, Snapchat ads, Pinterest advertising, compliance guardrail for AI agents.

## License

MIT · © AuditSocials
