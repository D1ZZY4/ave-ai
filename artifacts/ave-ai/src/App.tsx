import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SettingsProvider } from "./store/settings";
import { ChatProvider, useChat } from "./store/chat";
import { Home } from "./pages/Home";
import { Chat } from "./pages/Chat";

const queryClient = new QueryClient();

function AppRouter() {
  const [view, setView] = useState<"home" | "chat">("home");
  const { activeSessionId, setActiveSession } = useChat();

  const handleChatStarted = () => {
    setView("chat");
  };

  const handleBack = () => {
    setView("home");
  };

  // If there's an active session and we're in chat view, show chat
  if (view === "chat" && activeSessionId) {
    return <Chat onBack={handleBack} />;
  }

  return <Home onChatStarted={handleChatStarted} />;
}

function App() {
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

export default App;
