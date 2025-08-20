// ChatRoom.tsx
import { ChatRoomProvider } from "@ably/chat/react";
import ChatRoomInner from "./ChatRoomInner"; // this is your old ChatRoom component
import type { ChatRoomProps } from "../components/ChatRoomInner"; // optional: export the type
import { useContext } from "react";
import { ClientIdContext } from "../main";
// optional: export the type

export default function ChatRoomWrapper(props: ChatRoomProps) {
  const clientId = useContext(ClientIdContext);
  return (
    <ChatRoomProvider
      name={props.roomName || `${props.chatId}`}
      // @ts-ignore
      
    >
      <ChatRoomInner {...props} />
    </ChatRoomProvider>
  );
}
