import { ChevronLeft, Mic, Plus, MoreHorizontal, Send } from "lucide-react";
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
  chatNames: string | null;
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
  // In ChatRoomInner.tsx - Add this state after existing useState
  const [senderNames, setSenderNames] = useState<{ [key: string]: string }>({});
  const [displayName, setDisplayName] = useState<string>("");
  const [showMessage, setShowMessage] = useState(false);

  const [chatName, setChatName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string>(
    "https://randomuser.me/api/portraits/men/78.jpg" // default avatar
  );

  useEffect(() => {
    if (!chatId) return;

    const fetchAvatar = async () => {
      try {
        // POST per API docs, sending chatId as a JSON string
        const response = await axios.post(
          `${API_BASE_URL}/human/human/get-photo`,
          `${chatId}` // note: stringify chatId because API expects `string` body
        );
        if (response.data) {
          setAvatarUrl(response.data);
        } else {
          setAvatarUrl("https://randomuser.me/api/portraits/men/78.jpg");
        }
      } catch (err) {
        console.error("Failed to fetch avatar photo", err);
        setAvatarUrl("https://randomuser.me/api/portraits/men/78.jpg");
      }
    };

    fetchAvatar();
  }, [chatId]);

  const fetchChatName = async (chatId: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/human/${chatId}`);
      setChatName(response.data.name); // ✅ update state
    } catch (err) {
      console.error("Failed to fetch chat name", err);
      setChatName("Admin");
    }
  };

  // In ChatRoomInner.tsx - Add this function after fetchChatName function
  const fetchSenderName = async (senderId: string) => {
    if (senderNames[senderId]) return senderNames[senderId]; // Already cached

    try {
      const response = await axios.get(`${API_BASE_URL}/human/${senderId}`);
      const name = response.data.name || "Admin";
      setSenderNames((prev) => ({ ...prev, [senderId]: name }));
      return name;
    } catch (err) {
      console.error("Failed to fetch sender name", err);
      setSenderNames((prev) => ({ ...prev, [senderId]: "Admin" }));
      return "Admin";
    }
  };

  const containerHeightClass =
    activeTab === "My Tribe" ? "h-[65vh]" : "h-[60vh]";

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

  // In ChatRoomInner.tsx - Add this useEffect to fetch sender names when messages change
  useEffect(() => {
    if (type !== "buddy" && messages.length > 0) {
      // Fetch names for all unique senders
      const uniqueSenders = [
        ...new Set(
          messages
            .filter((msg) => msg.clientId !== clientsIds)
            .map((msg) => msg.clientId)
        ),
      ];

      uniqueSenders.forEach((senderId) => {
        if (!senderNames[senderId]) {
          fetchSenderName(senderId);
        }
      });
    }
  }, [messages, type]);

  useEffect(() => {
    const fetchDisplayName = async () => {
      try {
        if (type === "buddy") {
          setDisplayName(chatName || "Buddy Chat");
        } else if (type === "game") {
          // Find game by matching chatId in the user's chat mappings
          const chatRes = await axios.get(
            `${API_BASE_URL}/human/getChatId/${clientId}`
          );
          const mapping = chatRes.data.find(
            (item: any) => item.chatId === chatId
          );

          if (mapping) {
            const gameResponse = await axios.get(
              `${API_BASE_URL}/game/${mapping.gameId}`
            );
            const sport = gameResponse.data.sport || "Unknown Sport";

            // Format sport name with date (same as ChatList)
            const gameDate = gameResponse.data.startTime
              ? new Date(gameResponse.data.startTime).toLocaleDateString(
                  "en-US",
                  {
                    month: "short",
                    day: "numeric",
                  }
                )
              : "";
            const formattedSportName = gameDate
              ? `${sport} - ${gameDate}`
              : sport;

            setDisplayName(formattedSportName);
          } else {
            setDisplayName("Game Chat");
          }
        } else if (type === "tribe") {
          // Get all sports and find the one with matching chatId
          const sportsResponse = await axios.get(`${API_BASE_URL}/sports/all`);
          const sport = sportsResponse.data.find(
            (s: any) => s.chatId === chatId
          );
          const sportName = sport?.name || "Tribe Chat";
          setDisplayName(sportName);
        }
      } catch (error) {
        console.error("Failed to fetch display name:", error);
        setDisplayName(
          type === "buddy"
            ? "Buddy Chat"
            : type === "game"
            ? "Game Chat"
            : "Tribe Chat"
        );
      }
    };

    fetchDisplayName();
  }, [chatId, type, chatName, clientId]);

  return (
    <div
      className={`shadow-lg flex pb-2 flex-col ${containerHeightClass} relative`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 bg-white shadow rounded-b-2xl ">
        <div className="flex items-center gap-2">
          <button onClick={goBack}>
            <ChevronLeft className="h-6 w-6 text-gray-700" />
          </button>
          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-700">
            <img
              src={avatarUrl}
              alt="avatar"
              className="h-8 w-8 rounded-full object-cover"
            />
          </div>

          <div>
            {activeTab === "My Buddy" && (
              <p className="text-sm font-semibold">{chatName}</p>
            )}
            {activeTab !== "My Buddy" && (
              <>
                {displayName}
                <p className="text-xs text-gray-500">
                  {type === "buddy" ? "Online" : ""}
                </p>
              </>
            )}
          </div>
        </div>
        {activeTab === "My Game" && (
        <button
          onClick={() => {
            window.location.href =
              `https://playbookingv2.forgehub.in/event-participants-details?gameId=${sessionStorage.getItem("gameId")}`;
          }}
          type="button" // good practice to prevent unintended form submits
          className="bg-blue-500 text-white text-xs font-semibold px-1 py-1 rounded shadow transition"

        >
          Game Details
        </button>
        )}
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
            const avatarUrlToShow = isMine ? undefined : avatarUrl;

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
                    src={
                      type === "buddy"
                        ? avatarUrl
                        : "https://randomuser.me/api/portraits/men/78.jpg"
                    }
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
                      {type === "buddy"
                        ? chatName
                        : senderNames[msg.clientId] || "Loading..."}
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
      <div className="flex items-center px-4 py-2 gap-2 sticky bottom-0 bg-white border-t border-gray-200 z-10">
        
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          className="flex-1 border border-gray-300 rounded-full px-4 py-1 text-sm focus:outline-none"
          placeholder="Type a message"
        />
        <button onClick={() => sendMessage()}>
        <Send className="w-5 h-5 text-gray-500" />
        </button>
      </div>
    </div>
  );
}
