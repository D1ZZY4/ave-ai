import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SettingsProvider, useSettings } from "./store/settings";
import { ChatProvider, useChat } from "./store/chat";
import { Home } from "./pages/Home";
import { Chat } from "./pages/Chat";
import { useTheme } from "./hooks/useTheme";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

function AppRouter() {
  const [view, setView] = useState<"home" | "chat">("home");
  const { activeSessionId } = useChat();
  const { settings } = useSettings();

  // Diagram 50: Apply theme class to document root
  useTheme(settings.theme);

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
          <AppRouter />
        </ChatProvider>
      </SettingsProvider>
    </QueryClientProvider>
  );
}
