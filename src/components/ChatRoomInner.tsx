import { ChevronLeft, Mic, Plus, MoreHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useMessages } from "@ably/chat/react";
import { useContext } from "react";
import { ClientIdContext } from "../main";


import { ChatMessageEventType } from "@ably/chat";
import axios from "axios";
import { API_BASE_URL } from "./ApiBaseUrl";

export interface ChatRoomProps {
  type?: "buddy" | "game" | "tribe";
  chatId: string;
  chatNames?: string;
  goBack: () => void;
  activeTab?: string;
  roomName?: string;
}

function isToday(date: Date) {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

function isYesterday(date: Date) {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  );
}

export default function ChatRoomInner({
  type,
  chatId,
  chatNames,
  goBack,
  activeTab,
}: ChatRoomProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const clientId = useContext(ClientIdContext);
  const clientsIds = clientId;

  // ✅ Real-time message listener
  // const { send } = useMessages({
  //   // @ts-ignore
  //   listener: (event: MessageEvent) => {
  //     // @ts-ignore
  //     const message = event.message;
  //     if (event.type === ChatMessageEventType.Created) {
  //       setMessages((prev) => [...prev, message]);
  //     }
  //   },
  // });

  const [chatName, setChatName] = useState<string | null>(null);

  const fetchChatName = async (chatId: string) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/human/${chatId}`
      );
      setChatName(response.data.name); // ✅ update state
    } catch (err) {
      console.error("Failed to fetch chat name", err);
      setChatName("Unknown");
    }
  };

  const containerHeightClass =
    activeTab === "My Tribe" ? "h-[83vh]" : "h-[80vh]";

  const { historyBeforeSubscribe, send } = useMessages({
    listener: (event) => {
      if (event.type === ChatMessageEventType.Created) {
        setMessages((prev) => [...prev, event.message]);
      }
    },
    onDiscontinuity: (error) => {
      console.warn("Discontinuity detected:", error);
      setLoading(true);
    },
  });

  useEffect(() => {
    if (historyBeforeSubscribe && loading) {
      historyBeforeSubscribe({ limit: 50 }).then((result) => {
        // result.items() returns an array of messages
        const messages = result.items;

        setMessages(messages);
        setLoading(false);
      });
    }
  }, [historyBeforeSubscribe, loading]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!inputValue.trim()) return;
    send({ text: inputValue.trim() }).catch((err) =>
      console.error("Send error", err)
    );
    setInputValue("");
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    fetchChatName(chatId);
  }, [chatId]);

  const lastMsgTimestamp = messages.length
    ? new Date(messages[messages.length - 1].timestamp)
    : new Date();

  let dateLabel = "Today";
  if (isYesterday(lastMsgTimestamp)) {
    dateLabel = "Yesterday";
  } else if (!isToday(lastMsgTimestamp)) {
    dateLabel = lastMsgTimestamp.toLocaleDateString();
  }

  return (
    <div className={`mt-4 shadow-lg flex flex-col ${containerHeightClass}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 bg-white shadow rounded-b-2xl">
        <div className="flex items-center gap-2">
          <button onClick={goBack}>
            <ChevronLeft className="h-6 w-6 text-gray-700" />
          </button>
          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-700">
            {chatId[0]}
          </div>
          <div>
            {(activeTab === "My Game") && (
              <p className="text-sm font-semibold">{chatId}</p>
            )}
            {(activeTab === "My Tribe") && (
              <p className="text-sm font-semibold">{chatId}</p>
            )}
            {(activeTab === "My Buddy") && (
              <p className="text-sm font-semibold">{chatName}</p>
            )}
            
            <p className="text-xs text-gray-500">
              {type === "buddy" ? "Online" : "Members: Divya, Alok"}
            </p>
          </div>
        </div>
        <MoreHorizontal className="h-5 w-5 text-gray-600" />
      </div>

      {/* Date label */}
      <div className="mt-5 ml-49 text-center max-w-[15%] text-xs text-gray-500 py-1 bg-gray-50 border-b border-gray-200">
        {dateLabel}
      </div>

      {/* Messages */}
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
        {loading && (
          <p className="rounded-lg bg-blue-50 w-fit p-2">
            Loading messages.....
          </p>
        )}
        {[...messages]
          .sort(
            (a, b) =>
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          )
          .map((msg: any, idx) => {
            const isMine = msg.clientId === clientsIds;
            const timestamp = msg.timestamp
              ? new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "";

            // Dummy avatar url (replace with msg.avatar if you have)
            const avatarUrl =
              msg.avatarUrl ||
              // "https://ui-avatars.com/api/?name=" +
              //   encodeURIComponent(msg.clientId || "U") +
              //   "&background=0D8ABC&color=fff&size=32"
              "https://randomuser.me/api/portraits/men/78.jpg";
            return (
              <div
                key={idx}
                className={`flex items-end ${
                  isMine ? "justify-end" : "justify-start"
                }`}
              >
                {/* Avatar ONLY for incoming (not me) */}
                {!isMine && (
                  <img
                    src={avatarUrl}
                    alt={msg.clientId}
                    className="w-7 h-7 rounded-full mr-2 mb-5 border-2 border-white shadow-sm object-cover"
                    style={{ alignSelf: "flex-start" }}
                  />
                )}

                <div
                  className={`relative max-w-[60%] min-w-[210px] px-3 py-1 rounded-2xl break-words whitespace-normal flex flex-col ${
                    isMine
                      ? "bg-green-100 text-gray-900 rounded-br-none ml-auto"
                      : "bg-blue-50 text-gray-900 rounded-bl-none"
                  }`}
                >
                  {/* Only show sender name if NOT me */}
                  {!isMine && msg.clientId && (
                    <div className="text-xs font-semibold text-blue-700 mb-1">
                      {chatName}
                    </div>
                  )}
                  {/* Message text */}
                  <div className="text-gray-900">{msg.text}</div>
                  {/* Timestamp: bottom right of bubble (even for multi-line) */}
                  <div
                    className="text-[11px] mt-1 text-gray-500 self-end"
                    style={{ minWidth: 60, textAlign: "right" }}
                  >
                    {timestamp}
                  </div>
                </div>
              </div>
            );
          })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex items-center px-4 py-2 gap-2">
        <Plus className="w-5 h-5 text-gray-500" />
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          className="flex-1 border border-gray-300 rounded-full px-4 py-1 text-sm focus:outline-none"
          placeholder="Type a message"
        />
        <Mic className="w-5 h-5 text-gray-500" />
      </div>
    </div>
  );
}
