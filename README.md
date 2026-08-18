# AuditSocials Compliance MCP

**Check AI-generated social content against live platform policy — before it ships.**

An [MCP](https://modelcontextprotocol.io) server that lets an AI assistant check
any social media content (post, caption, tweet, video script, ad copy) against
the **current** advertising and community policies of 8 platforms — **Meta,
TikTok, LinkedIn, Google Ads, YouTube, X, Snapchat, Pinterest** — so the post,
account, or ad isn't flagged, demonetized, or banned.

Use it as a final compliance pass on anything an agent writes for social media.
It returns the exact risky phrase, *why* it's risky, and a compliant rewrite.

## Why

AI writes social/ad content fast — but it doesn't track the 8 platforms'
constantly-changing policies. One health claim, one "guaranteed returns," one
implied brand association, and the account gets restricted. This server puts a
live policy check inside the generation loop.

## Install

```jsonc
// Claude Desktop / any MCP client config
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

Get a **free API key** at <https://www.auditsocials.com/compliance-api>.

## Tool

### `check_social_content_compliance`

| Param | Type | Notes |
|-------|------|-------|
| `content` | string (required) | The social content to check. |
| `platforms` | string[] (optional) | Any of Meta, TikTok, LinkedIn, Google Ads, YouTube, X, Snapchat, Pinterest. Omit = all 8. |
| `contentType` | `post` \| `caption` \| `ad` \| `video-script` (optional) | Helps apply the right rule set. |

Returns an overall verdict plus findings — each with severity, confidence, the
matched phrase, the reason, and a suggested compliant rewrite.

## How it works

This package is a thin client. All policy data, AI reasoning, quota, and
metering live in the hosted AuditSocials Compliance API — the package ships no
secrets and no rules, and simply forwards your request with your API key. The
free tier gives full-quality checks up to a daily volume limit.

## License

MIT · © AuditSocials
