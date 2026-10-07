#!/usr/bin/env node
/**
 * auditsocials-compliance-mcp
 *
 * Model Context Protocol server that checks (usually AI-generated) social media
 * content against live platform policy across 8 platforms BEFORE it is
 * published, so the post/account/ad is not flagged, demonetized or banned.
 *
 * Thin client: it forwards to the hosted AuditSocials Compliance API using the
 * caller's AUDITSOCIALS_API_KEY. All policy data, AI reasoning, quota and
 * metering live server-side — this package ships no secrets and no rules.
 *
 * Get a free key: https://www.auditsocials.com/compliance-api
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const API_URL =
  process.env.AUDITSOCIALS_API_URL ||
  "https://www.auditsocials.com/api/v1/compliance-check";
const API_KEY = process.env.AUDITSOCIALS_API_KEY || "";

const PLATFORMS = [
  "Meta",
  "TikTok",
  "LinkedIn",
  "Google Ads",
  "YouTube",
  "X",
  "Snapchat",
  "Pinterest",
] as const;

interface Finding {
  pattern: string;
  sector: string;
  severity: string;
  confidence: string;
  matchedText: string;
  issue: string;
  suggestion: string;
  source?: "rule" | "ai";
}
interface ApiResponse {
  verdict?: string;
  summary?: string;
  platforms?: string[];
  findings?: Finding[];
  aiGenerated?: boolean;
  aiDisclosure?: string;
  credits?: { used: number; limit: number; remaining: number; tier: string; upgrade?: string };
  error?: string;
  message?: string;
  upgrade?: string;
}

const server = new McpServer({
  name: "auditsocials-compliance",
  version: "0.1.4",
});

server.tool(
  "check_social_content_compliance",
  "Check a piece of social media content (post, caption, tweet, video script, or ad copy) against the CURRENT advertising and community policies of 8 platforms — Meta, TikTok, LinkedIn, Google Ads, YouTube, X, Snapchat, Pinterest — BEFORE it is published. Call this whenever you draft or edit social/ad content so the post, account or ad is not flagged, demonetized, or banned. Returns specific policy risks (with the exact risky phrase, why it's risky, and a compliant rewrite) plus an overall verdict. Use it as a final compliance pass on anything you write for social media.",
  {
    content: z.string().describe("The social content to check (post/caption/tweet/video script/ad copy)."),
    platforms: z
      .array(z.enum(PLATFORMS))
      .optional()
      .describe("Target platforms. Omit to check against all 8."),
    contentType: z
      .enum(["post", "caption", "ad", "video-script"])
      .optional()
      .describe("Type of content (helps apply the right rule set)."),
  },
  {
    // The tool only reads/evaluates the supplied content against hosted policy —
    // it creates no resources and mutates nothing, but it does reach an external
    // API (the hosted AuditSocials Compliance service), hence openWorldHint.
    title: "Check Social Content Compliance",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true,
  },
  async ({ content, platforms, contentType }) => {
    if (!API_KEY) {
      return {
        content: [
          {
            type: "text",
            text:
              "No AUDITSOCIALS_API_KEY is set. Get a free key at https://www.auditsocials.com/compliance-api and set it in this MCP server's environment.",
          },
        ],
        isError: true,
      };
    }

    let res: Response;
    try {
      res = await fetch(API_URL, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${API_KEY}` },
        body: JSON.stringify({ content, platforms, contentType }),
      });
    } catch (e) {
      return {
        content: [{ type: "text", text: `Could not reach the AuditSocials Compliance API: ${e instanceof Error ? e.message : e}` }],
        isError: true,
      };
    }

    const data = (await res.json().catch(() => ({}))) as ApiResponse;

    if (res.status === 401) {
      return { content: [{ type: "text", text: `Auth failed: ${data.error || "invalid API key"}. Get a key at ${data.upgrade || "https://www.auditsocials.com/compliance-api"}.` }], isError: true };
    }
    if (res.status === 429) {
      if (data.credits) {
        // Monthly credit quota exhausted (any tier).
        const tier = data.credits.tier ? ` on the ${data.credits.tier} tier` : "";
        return {
          content: [
            {
              type: "text",
              text: `Monthly credits used up${tier} (${data.credits.used}/${data.credits.limit}). ${data.message ?? ""} Upgrade for higher volume: ${data.upgrade || "https://www.auditsocials.com/compliance-api"}`,
            },
          ],
          isError: true,
        };
      }
      // Per-IP request rate limit ({ error: "Too many requests" } + Retry-After).
      const retryAfter = Number(res.headers.get("retry-after"));
      const wait = Number.isFinite(retryAfter) && retryAfter > 0 ? ` Retry in ${retryAfter}s.` : " Retry shortly.";
      return {
        content: [{ type: "text", text: `Rate limited by the AuditSocials API (${data.error || "too many requests"}).${wait}` }],
        isError: true,
      };
    }
    if (!res.ok) {
      return { content: [{ type: "text", text: `Compliance check failed (${res.status}): ${data.error || "unknown error"}` }], isError: true };
    }

    const lines: string[] = [];
    lines.push(`Verdict: ${(data.verdict || "unknown").toUpperCase()}`);
    if (data.summary) lines.push(data.summary);
    if (data.findings?.length) {
      lines.push("\nFindings:");
      for (const f of data.findings) {
        lines.push(
          `\n• [${f.severity}/${f.confidence}${f.source === "ai" ? "/AI-generated" : ""}] ${f.pattern} (${f.sector})\n` +
            `    risky text: "${f.matchedText}"\n` +
            `    why: ${f.issue}\n` +
            `    fix: ${f.suggestion}`,
        );
      }
      if (data.aiGenerated && data.aiDisclosure) lines.push(`\n${data.aiDisclosure}`);
    } else {
      lines.push("\nNo policy risks detected in this pass.");
    }
    if (data.credits) {
      lines.push(
        `\n— ${data.credits.remaining} of ${data.credits.limit} credits left this month (${data.credits.tier}).` +
          (data.credits.upgrade ? ` Higher volume: ${data.credits.upgrade}` : ""),
      );
    }

    return { content: [{ type: "text", text: lines.join("\n") }] };
  },
);

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("auditsocials-compliance-mcp running (stdio) — 8-platform pre-publish compliance guardrail");
}

main().catch((err) => {
  console.error("auditsocials-compliance-mcp fatal:", err);
  process.exit(1);
});
