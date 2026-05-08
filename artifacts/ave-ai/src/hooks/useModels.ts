import { useState, useEffect, useCallback } from "react";
import { listModels, type OllamaModel } from "../helpers/ollama";
import { useSettings } from "../store/settings";

export interface ModelEntry {
  name: string;
  label: string;
  paramSize?: string;
  family?: string;
  isCustom?: boolean;
}

function toEntry(m: OllamaModel): ModelEntry {
  return {
    name: m.name,
    label: m.name,
    paramSize: m.details?.parameter_size,
    family: m.details?.family,
    isCustom: false,
  };
}

export function useModels() {
  const { settings } = useSettings();
  const [fetched, setFetched] = useState<OllamaModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchModels = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listModels(settings.baseUrl);
      setFetched(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect");
      setFetched([]);
    } finally {
      setLoading(false);
    }
  }, [settings.baseUrl]);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  // Merge: fetched Ollama models + user-added custom model names
  const fetchedNames = new Set(fetched.map((m) => m.name));
  const customEntries: ModelEntry[] = (settings.customModels ?? [])
    .filter((name) => name && !fetchedNames.has(name))
    .map((name) => ({ name, label: name, isCustom: true }));

  const models: ModelEntry[] = [
    ...fetched.map(toEntry),
    ...customEntries,
  ];

  return { models, loading, error, refetch: fetchModels };
}
