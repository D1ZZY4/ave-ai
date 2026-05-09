/**
 * Diagram 21, 50: App initialization with theme application.
 * Theme (dark/light/system) applied as data-theme on <html> element.
 */
import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SettingsProvider, useSettings } from "./store/settings";
import { ChatProvider, useChat } from "./store/chat";
import { Home } from "./pages/Home";
import { Chat } from "./pages/Chat";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

/**
 * Diagram 50: Theme manager — applies dark/light class to <html>.
 */
function ThemeManager() {
  const { settings } = useSettings();

  useEffect(() => {
    const root = document.documentElement;
    const apply = (dark: boolean) => {
      root.classList.toggle("dark", dark);
      root.classList.toggle("light", !dark);
      root.setAttribute("data-theme", dark ? "dark" : "light");
    };

    if (settings.theme !== "system") {
      apply(settings.theme === "dark");
      return;
    }

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    apply(mq.matches);
    const handler = (e: MediaQueryListEvent) => apply(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [settings.theme]);

  return null;
}

/**
 * Diagram 21: App initialization — register service worker.
 */
function ServiceWorkerRegistrar() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch(() => {});
    }
  }, []);
  return null;
}

function AppRouter() {
  const [view, setView] = useState<"home" | "chat">("home");
  const { activeSessionId } = useChat();

  const handleChatStarted = () => setView("chat");
  const handleBack = () => setView("home");

  if (view === "chat" && activeSessionId) {
    return <Chat onBack={handleBack} />;
  }

  return <Home onChatStarted={handleChatStarted} />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SettingsProvider>
        <ChatProvider>
          <ThemeManager />
          <ServiceWorkerRegistrar />
          <AppRouter />
        </ChatProvider>
      </SettingsProvider>
    </QueryClientProvider>
  );
}
