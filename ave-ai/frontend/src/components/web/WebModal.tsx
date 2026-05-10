/**
 * flow-11 diagram 8: WebModal — global toggle + per-tool enable/disable for web tools.
 */
import { useState } from "react";
import { X, Globe, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettings } from "../../store/settings";
import { Switch } from "@/components/ui/switch";

interface WebTool {
  id: string;
  name: string;
  description: string;
}

const WEB_TOOLS: WebTool[] = [
  { id: "web-api-caller", name: "API Caller", description: "Call REST APIs with custom headers and methods" },
  { id: "web-authenticator", name: "Authenticator", description: "Authenticate to web services with OAuth and API keys" },
  { id: "web-browser", name: "Browser", description: "Control a headless browser to interact with web pages" },
  { id: "web-cache-reader", name: "Cache Reader", description: "Read cached web resources for offline access" },
  { id: "web-crawling", name: "Crawling", description: "Recursively crawl websites following links" },
  { id: "web-diff", name: "Diff", description: "Compare two web pages or responses for changes" },
  { id: "web-downloader", name: "Downloader", description: "Download files and assets from URLs" },
  { id: "web-feed-parser", name: "Feed Parser", description: "Parse RSS and Atom feeds" },
  { id: "web-fetcher", name: "Fetcher", description: "Fetch raw HTML or JSON from any URL" },
  { id: "web-form-submitter", name: "Form Submitter", description: "Fill and submit web forms programmatically" },
  { id: "web-harvester", name: "Harvester", description: "Harvest structured data from multiple pages" },
  { id: "web-headless-scraper", name: "Headless Scraper", description: "Scrape JavaScript-rendered pages" },
  { id: "web-link-extractor", name: "Link Extractor", description: "Extract all links from a web page" },
  { id: "web-metadata-extractor", name: "Metadata Extractor", description: "Extract Open Graph and meta tags" },
  { id: "web-monitor", name: "Monitor", description: "Monitor web pages for changes over time" },
  { id: "web-navigator", name: "Navigator", description: "Navigate to URLs and interact with page elements" },
  { id: "web-paginator", name: "Paginator", description: "Handle paginated content and next-page links" },
  { id: "web-parser", name: "Parser", description: "Parse HTML into structured data" },
  { id: "web-qrcode-reader", name: "QR Code Reader", description: "Decode QR codes from images or URLs" },
  { id: "web-reader", name: "Reader", description: "Extract readable article content from web pages" },
  { id: "web-robots-txt", name: "Robots.txt", description: "Read and respect robots.txt rules" },
  { id: "web-scraping", name: "Scraping", description: "Scrape structured content using CSS selectors" },
  { id: "web-screenshot", name: "Screenshot", description: "Capture screenshots of web pages" },
  { id: "web-search", name: "Search", description: "Search the web using DuckDuckGo or custom engines" },
  { id: "web-sitemap-parser", name: "Sitemap Parser", description: "Parse XML sitemaps to discover all pages" },
  { id: "web-socket-listener", name: "WebSocket Listener", description: "Listen to WebSocket streams for real-time data" },
  { id: "web-spider", name: "Spider", description: "Spider a website to map its full structure" },
  { id: "web-summarizer", name: "Summarizer", description: "Summarize web page content with AI assistance" },
  { id: "web-validator", name: "Validator", description: "Validate HTML, accessibility, and page performance" },
  { id: "web-video-extractor", name: "Video Extractor", description: "Extract video streams and metadata from pages" },
];

interface WebModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WebModal({ isOpen, onClose }: WebModalProps) {
  const { settings, updateSettings } = useSettings();
  const [search, setSearch] = useState("");
  const [disabledTools, setDisabledTools] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const filtered = WEB_TOOLS.filter(
    (t) =>
      !search.trim() ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase())
  );

  const toggleTool = (id: string) => {
    setDisabledTools((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isToolEnabled = (id: string) => settings.enableWebSearch && !disabledTools.has(id);

  const statusDot = (id: string) => {
    if (!settings.enableWebSearch) return "bg-[hsl(265_15%_24%)]";
    if (disabledTools.has(id)) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-sm mx-auto bg-[hsl(258_28%_8%)] border border-[hsl(260_18%_16%)] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-[hsl(260_18%_13%)] flex-shrink-0">
          <h2 className="text-[13px] font-semibold text-[hsl(270_20%_90%)]">Web Tools</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[hsl(265_15%_40%)] hover:text-white hover:bg-[hsl(260_20%_13%)] transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        <div className="px-3 pt-3 pb-1 flex-shrink-0">
          {/* Global toggle */}
          <div className="flex items-center justify-between px-3.5 py-3 rounded-2xl bg-[hsl(258_25%_7%)] border border-[hsl(260_18%_14%)] mb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[hsl(260_20%_13%)] flex items-center justify-center">
                <Globe size={14} className={settings.enableWebSearch ? "text-purple-400" : "text-[hsl(265_15%_36%)]"} />
              </div>
              <div>
                <div className="text-[12px] font-semibold text-[hsl(270_20%_88%)]">Web Tools Enabled</div>
                <div className="text-[10px] text-[hsl(265_15%_42%)] mt-0.5">
                  {settings.enableWebSearch ? `${WEB_TOOLS.length - disabledTools.size} / ${WEB_TOOLS.length} tools active` : "All web tools disabled"}
                </div>
              </div>
            </div>
            <Switch
              checked={settings.enableWebSearch}
              onCheckedChange={(v) => updateSettings({ enableWebSearch: v })}
              className="data-[state=checked]:bg-purple-600 scale-90"
            />
          </div>

          {/* Search */}
          <div className="flex items-center gap-2 bg-[hsl(258_25%_10%)] rounded-xl px-3 py-2 border border-[hsl(260_18%_14%)]">
            <Search size={12} className="text-[hsl(265_15%_40%)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search web tools..."
              className="flex-1 bg-transparent text-[11px] text-[hsl(270_20%_88%)] placeholder:text-[hsl(265_15%_36%)] outline-none"
            />
          </div>
        </div>

        {/* Tool list */}
        <div className="overflow-y-auto px-3 pb-3 space-y-1.5 mt-2">
          {filtered.map((tool) => (
            <div
              key={tool.id}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2.5 rounded-2xl border transition-all",
                !settings.enableWebSearch
                  ? "border-[hsl(260_18%_13%)] bg-[hsl(258_25%_6%)] opacity-40"
                  : isToolEnabled(tool.id)
                  ? "border-[hsl(260_18%_16%)] bg-[hsl(258_25%_7%)]"
                  : "border-[hsl(260_18%_13%)] bg-[hsl(258_25%_6%)] opacity-60"
              )}
            >
              <div className={cn("w-2 h-2 rounded-full flex-shrink-0", statusDot(tool.id))} />
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-medium text-[hsl(270_20%_85%)]">{tool.name}</div>
                <div className="text-[9px] text-[hsl(265_15%_40%)] mt-0.5 leading-snug">{tool.description}</div>
              </div>
              {settings.enableWebSearch && (
                <Switch
                  checked={isToolEnabled(tool.id)}
                  onCheckedChange={() => toggleTool(tool.id)}
                  className="data-[state=checked]:bg-purple-600 scale-75 flex-shrink-0"
                />
              )}
            </div>
          ))}
        </div>

        <div className="px-4 pb-4">
          <p className="text-[10px] text-[hsl(265_15%_34%)] text-center">
            Web tools let Ave AI browse, search, and extract information from the internet
          </p>
        </div>
      </div>
    </div>
  );
}
