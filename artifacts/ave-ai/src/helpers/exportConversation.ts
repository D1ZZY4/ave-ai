/**
 * Diagram 48 — Export Conversation
 * Export to JSON, Markdown, or plain text.
 */

import type { ChatSession, Message } from "../store/chat";

function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleString();
}

export function exportToJSON(session: ChatSession): void {
  const data = JSON.stringify(session, null, 2);
  downloadFile(`${session.title || "conversation"}.json`, data, "application/json");
}

export function exportToMarkdown(session: ChatSession): void {
  const lines: string[] = [
    `# ${session.title || "Conversation"}`,
    ``,
    `**Date:** ${formatTimestamp(session.createdAt)}`,
    `**Persona:** ${session.persona}`,
    `**Model:** ${session.model}`,
    ``,
    `---`,
    ``,
  ];

  for (const msg of session.messages) {
    if (msg.isStreaming) continue;
    const role = msg.role === "user" ? "**You**" : "**Ave AI**";
    lines.push(`### ${role}`);
    lines.push(`*${formatTimestamp(msg.timestamp)}*`);
    lines.push(``);
    lines.push(msg.content);
    lines.push(``);
    lines.push(`---`);
    lines.push(``);
  }

  downloadFile(`${session.title || "conversation"}.md`, lines.join("\n"), "text/markdown");
}

export function exportToText(session: ChatSession): void {
  const lines: string[] = [
    `Conversation: ${session.title || "Untitled"}`,
    `Date: ${formatTimestamp(session.createdAt)}`,
    ``,
  ];

  for (const msg of session.messages) {
    if (msg.isStreaming) continue;
    const role = msg.role === "user" ? "You" : "Ave AI";
    lines.push(`[${role}] ${formatTimestamp(msg.timestamp)}`);
    lines.push(msg.content);
    lines.push(``);
  }

  downloadFile(`${session.title || "conversation"}.txt`, lines.join("\n"), "text/plain");
}

export function getShareableText(messages: Message[]): string {
  return messages
    .filter((m) => !m.isStreaming && m.content)
    .map((m) => `${m.role === "user" ? "You" : "Ave AI"}: ${m.content}`)
    .join("\n\n");
}

function downloadFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
