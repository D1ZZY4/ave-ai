import { Router } from "express";
import type { Request, Response } from "express";

const router = Router();

function cleanBaseUrl(url: string): string {
  return url.replace(/\/$/, "").trim();
}

/**
 * GET /api/ollama/models
 * Proxies to Ollama /api/tags — avoids CORS when using external URLs.
 * Query: ?baseUrl=https://your-tunnel.trycloudflare.com
 */
router.get("/ollama/models", async (req: Request, res: Response) => {
  const baseUrl = cleanBaseUrl((req.query["baseUrl"] as string) || "http://localhost:11434");

  try {
    const response = await fetch(`${baseUrl}/api/tags`, {
      signal: AbortSignal.timeout(10000),
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      const text = await response.text();
      res.status(response.status).json({ error: `Ollama error: ${text}` });
      return;
    }

    const data = await response.json() as { models?: unknown[] };
    res.json({ models: data.models || [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    req.log.warn({ baseUrl, err: message }, "Failed to fetch Ollama models");
    res.status(503).json({ error: `Cannot reach Ollama at ${baseUrl}: ${message}` });
  }
});

/**
 * POST /api/ollama/chat
 * Proxies streaming chat to Ollama — avoids CORS on external URLs.
 * Body: { baseUrl, model, messages, tools?, options?, stream }
 */
router.post("/ollama/chat", async (req: Request, res: Response) => {
  const { baseUrl: rawBase, ...ollamaBody } = req.body as {
    baseUrl?: string;
    model: string;
    messages: unknown[];
    tools?: unknown[];
    options?: Record<string, unknown>;
    stream?: boolean;
  };

  const baseUrl = cleanBaseUrl(rawBase || "http://localhost:11434");
  const isStream = ollamaBody.stream !== false;

  try {
    const upstream = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...ollamaBody, stream: isStream }),
      signal: AbortSignal.timeout(isStream ? 300000 : 60000),
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      res.status(upstream.status).json({ error: `Ollama error ${upstream.status}: ${text}` });
      return;
    }

    if (isStream && upstream.body) {
      res.setHeader("Content-Type", "application/x-ndjson");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("X-Accel-Buffering", "no");

      const reader = upstream.body.getReader();
      const flush = async () => {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(value);
        }
        res.end();
      };
      await flush();
    } else {
      const json = await upstream.json();
      res.json(json);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    req.log.warn({ baseUrl, err: message }, "Ollama chat proxy error");
    res.status(503).json({ error: `Cannot reach Ollama at ${baseUrl}: ${message}` });
  }
});

export default router;
