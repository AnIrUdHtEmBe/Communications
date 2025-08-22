import React, { createContext, useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import * as Ably from "ably";
import { ChatClient, LogLevel } from "@ably/chat";
import { ChatClientProvider } from "@ably/chat/react";
import { AblyProvider } from "ably/react";
import App from "./App";
import { v4 as uuidv4 } from "uuid";
// src/main.tsx
import './index.css';

// Create a React Context for clientId
export const ClientIdContext = createContext<string>("");

function Root() {
  const [clientId, setClientId] = useState<string>("");

useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const idFromUrl = params.get("clientId");

  if (idFromUrl) {
    setClientId(idFromUrl);
  } else {
    // fallback if not provided in URL
    setClientId("default-client-" + uuidv4());
  }
}, []);


  if (!clientId) return null; // or loading spinner

  // Create Ably clients with generated clientId
  const realtimeClient = new Ably.Realtime({
    key: "0DwkUw.pjfyJw:CwXcw14bOIyzWPRLjX1W7MAoYQYEVgzk8ko3tn0dYUI",
    clientId,
  });

  const chatClient = new ChatClient(realtimeClient, {
    logLevel: LogLevel.Info,
  });

  return (
    <ClientIdContext.Provider value={clientId}>
      <AblyProvider client={realtimeClient}>
        <ChatClientProvider client={chatClient}>
          <App />
        </ChatClientProvider>
      </AblyProvider>
    </ClientIdContext.Provider>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);


