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
const API_URL = process.env.AUDITSOCIALS_API_URL ||
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
];
const server = new McpServer({
    name: "auditsocials-compliance",
    version: "0.1.0",
});
server.tool("check_social_content_compliance", "Check a piece of social media content (post, caption, tweet, video script, or ad copy) against the CURRENT advertising and community policies of 8 platforms — Meta, TikTok, LinkedIn, Google Ads, YouTube, X, Snapchat, Pinterest — BEFORE it is published. Call this whenever you draft or edit social/ad content so the post, account or ad is not flagged, demonetized, or banned. Returns specific policy risks (with the exact risky phrase, why it's risky, and a compliant rewrite) plus an overall verdict. Use it as a final compliance pass on anything you write for social media.", {
    content: z.string().describe("The social content to check (post/caption/tweet/video script/ad copy)."),
    platforms: z
        .array(z.enum(PLATFORMS))
        .optional()
        .describe("Target platforms. Omit to check against all 8."),
    contentType: z
        .enum(["post", "caption", "ad", "video-script"])
        .optional()
        .describe("Type of content (helps apply the right rule set)."),
}, async ({ content, platforms, contentType }) => {
    if (!API_KEY) {
        return {
            content: [
                {
                    type: "text",
                    text: "No AUDITSOCIALS_API_KEY is set. Get a free key at https://www.auditsocials.com/compliance-api and set it in this MCP server's environment.",
                },
            ],
            isError: true,
        };
    }
    let res;
    try {
        res = await fetch(API_URL, {
            method: "POST",
            headers: { "content-type": "application/json", authorization: `Bearer ${API_KEY}` },
            body: JSON.stringify({ content, platforms, contentType }),
        });
    }
    catch (e) {
        return {
            content: [{ type: "text", text: `Could not reach the AuditSocials Compliance API: ${e instanceof Error ? e.message : e}` }],
            isError: true,
        };
    }
    const data = (await res.json().catch(() => ({})));
    if (res.status === 401) {
        return { content: [{ type: "text", text: `Auth failed: ${data.error || "invalid API key"}. Get a key at ${data.upgrade || "https://www.auditsocials.com/compliance-api"}.` }], isError: true };
    }
    if (res.status === 429) {
        return {
            content: [
                {
                    type: "text",
                    text: `Free monthly credits used up (${data.credits?.used}/${data.credits?.limit}). ${data.message ?? ""} Upgrade for higher volume: ${data.upgrade || "https://www.auditsocials.com/compliance-api"}`,
                },
            ],
        };
    }
    if (!res.ok) {
        return { content: [{ type: "text", text: `Compliance check failed (${res.status}): ${data.error || "unknown error"}` }], isError: true };
    }
    const lines = [];
    lines.push(`Verdict: ${(data.verdict || "unknown").toUpperCase()}`);
    if (data.summary)
        lines.push(data.summary);
    if (data.findings?.length) {
        lines.push("\nFindings:");
        for (const f of data.findings) {
            lines.push(`\n• [${f.severity}/${f.confidence}] ${f.pattern} (${f.sector})\n` +
                `    risky text: "${f.matchedText}"\n` +
                `    why: ${f.issue}\n` +
                `    fix: ${f.suggestion}`);
        }
    }
    else {
        lines.push("\nNo policy risks detected in this pass.");
    }
    if (data.credits) {
        lines.push(`\n— ${data.credits.remaining} of ${data.credits.limit} credits left this month (${data.credits.tier}).` +
            (data.credits.upgrade ? ` Higher volume: ${data.credits.upgrade}` : ""));
    }
    return { content: [{ type: "text", text: lines.join("\n") }] };
});
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("auditsocials-compliance-mcp running (stdio) — 8-platform pre-publish compliance guardrail");
}
main().catch((err) => {
    console.error("auditsocials-compliance-mcp fatal:", err);
    process.exit(1);
});
