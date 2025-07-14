import { useState } from "react";
import ChatClientReady from "./components/ChatClientReady";
import AllChats from "./components/AllChats";
import { ChatRoomProvider } from "@ably/chat/react";
import "./App.css"
import { useContext } from "react";
import { ClientIdContext } from "./main";

function App() {

  const clientId = useContext(ClientIdContext);
  // Manage the active chat room at app level
  const [activeRoom, setActiveRoom] = useState<string>("room-buddy-null");

  return (
    <ChatRoomProvider
      name={activeRoom}
      // @ts-ignore
      connection={{
        key: "0DwkUw.pjfyJw:CwXcw14bOIyzWPRLjX1W7MAoYQYEVgzk8ko3tn0dYUI",
        clientId,
      }}
    >
      <ChatClientReady>
        {/* Pass activeRoom and setter to AllChats */}
        <AllChats activeRoom={activeRoom} setActiveRoom={setActiveRoom} />
      </ChatClientReady>
    </ChatRoomProvider>
  );
}

export default App;
