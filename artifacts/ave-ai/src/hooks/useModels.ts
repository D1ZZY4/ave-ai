import { useState, useEffect, useCallback } from "react";
import { listModels, type OllamaModel } from "../lib/ollama";

export function useModels(baseUrl: string) {
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchModels = useCallback(async () => {
    if (!baseUrl) return;
    setLoading(true);
    setError(null);
    try {
      const data = await listModels(baseUrl);
      setModels(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect to Ollama");
      setModels([]);
    } finally {
      setLoading(false);
    }
  }, [baseUrl]);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  return { models, loading, error, refetch: fetchModels };
}
