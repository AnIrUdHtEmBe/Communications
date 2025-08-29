import { ChevronLeft, Mic, Plus, MoreHorizontal, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useMessages } from "@ably/chat/react";
import { useContext } from "react";
import { ClientIdContext } from "../main";

import { ChatMessageEventType } from "@ably/chat";
import axios from "axios";
import { API_BASE_URL } from "./ApiBaseUrl";

export interface ChatRoomProps {
  type?:
    | "buddy"
    | "game"
    | "tribe"
    | "fitness"
    | "wellness"
    | "sports"
    | "nutrition"
    | "events"
    | "rm"
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
  roomName,
}: ChatRoomProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const clientId = useContext(ClientIdContext);
  const clientsIds = clientId;
  const [senderNames, setSenderNames] = useState<{ [key: string]: string }>({});
  const [displayName, setDisplayName] = useState<string>("");
  const [showMessage, setShowMessage] = useState(false);
  const [contextInfo, setContextInfo] = useState<string | null>(null);
  const [contextOwnerId, setContextOwnerId] = useState<string | null>(null);
  const [contextData, setContextData] = useState<any>(null);
  const [hasInitiallyMounted, setHasInitiallyMounted] = useState(false);
  const initialContextRoomRef = useRef<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [roomConnection, setRoomConnection] = useState<any>(null);
  const strictModeRef = useRef(false);
const mountedRef = useRef(true);

  const [chatName, setChatName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string>(
    "https://randomuser.me/api/portraits/men/77.jpg" // default avatar
  );

useEffect(() => {
  if (!chatId) return;

  const fetchAvatar = async () => {
    try {
      console.log("🖼️ Fetching avatar for chatId:", chatId);
      
      const response = await axios.post(
        `${API_BASE_URL}/human/human/get-photo`,
        `${chatId}`
      );
      
      console.log("📸 Avatar API response:", response.data);
      
      // Check if response.data exists AND has a valid photoThumbUrl
      if (response.data && response.data.photoThumbUrl && response.data.photoThumbUrl.trim() !== '') {
        setAvatarUrl(response.data.photoThumbUrl);
        console.log("✅ Avatar loaded:", response.data.photoThumbUrl);
      } else {
        console.log("⚠️ No valid photoThumbUrl found, using fallback");
        setAvatarUrl("https://randomuser.me/api/portraits/men/77.jpg");
      }
    } catch (err) {
      console.error("❌ Failed to fetch avatar photo:", err);
      setAvatarUrl("https://randomuser.me/api/portraits/men/77.jpg");
    }
  };

  fetchAvatar();
}, [chatId]);

  // Add this useEffect after your existing useState declarations
  // Reset messages when roomName changes
// Replace the room change useEffect
// Replace the room change useEffect with better deduplication
useEffect(() => {
  console.log("🏠 Room changed to:", roomName, "chatId:", chatId);
  
  if (!roomName || !chatId || !mountedRef.current) {
    return;
  }

  // Prevent duplicate resets for the same room
  const currentRoomKey = `${chatId}`;
  if (roomConnection?.roomKey === currentRoomKey) {
    console.log("🔄 Same room, skipping reset");
    return;
  }
  
  // Check if this is NOT the initial room with context
  const shouldClearContext = initialContextRoomRef.current !== null && 
                             roomName !== initialContextRoomRef.current;
  
  console.log("🔄 Resetting chat state for new room");
  
  // Force complete reset of chat state
  setMessages([]);
  setLoading(true);
  setSenderNames({});
  setDisplayName("");
  setChatName(null);
  setRoomConnection({ roomKey: currentRoomKey });
  
  // Only clear context if switching to a different room
  if (shouldClearContext) {
    console.log("🗑️ Clearing context for room switch");
    setContextInfo(null);
    setContextData(null);
    setContextOwnerId(null);
  }

  // Small delay to ensure state is reset before fetching new data
  const timeoutId = setTimeout(() => {
    if (mountedRef.current) {
      fetchChatName(chatId);
    }
  }, 100);

  return () => clearTimeout(timeoutId);
}, [roomName, chatId]);


const fetchChatName = async (chatId: string) => {
  console.log("🔍 Fetching chat name for chatId:", chatId);
  
  // Don't try to fetch user data for chat room IDs that start with CHAT_ or EVENT_
  if (chatId.startsWith('CHAT_') || chatId.startsWith('EVENT_')) {
    console.log("📝 Chat room ID detected, skipping user fetch");
    setChatName("Chat Room");
    return;
  }
  
  try {
    const response = await axios.get(`${API_BASE_URL}/human/${chatId}`);
    console.log("✅ Chat name fetched:", response.data.name);
    setChatName(response.data.name);
  } catch (err) {
    console.error("❌ Failed to fetch chat name for:", chatId, err);
    setChatName("Chat Room");
  }
};

  // In ChatRoomInner.tsx - Add this function after fetchChatName function
  // Modify fetchSenderName to return the clientId itself if it looks like a name (not an ID like USER_ALBI32)
  const fetchSenderName = async (senderId: string) => {
    // If senderId looks like a readable name (no underscores, no USER_ prefix), return as is
    if (!/^USER_/.test(senderId) && !senderId.includes("_")) {
      // Cache and return senderId directly assuming it's a name
      setSenderNames((prev) => ({ ...prev, [senderId]: senderId }));
      return senderId;
    }

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
    activeTab === "My Tribe" ? "h-[65vh]" : "h-[75vh]";

const { historyBeforeSubscribe, send } = useMessages({
  listener: (event) => {
    console.log("📨 Message event received:", event.type, event.message?.clientId);
    if (event.type === ChatMessageEventType.Created) {
      // Skip adding message if it is from self (already appended locally)
      if (event.message.clientId === clientId) {
        console.log("🔄 Skipping own message");
        return;
      }
      console.log("➕ Adding new message from:", event.message.clientId);
      setMessages((prev) => [...prev, event.message]);
    }
  },
  onDiscontinuity: (error) => {
    console.error("❌ Discontinuity detected:", error);
    setLoading(true);
  },
});

// Replace the useEffect that loads message history
useEffect(() => {
  console.log("📚 Message history effect triggered:", {
    hasHistory: !!historyBeforeSubscribe,
    loading,
    roomName
  });

  if (historyBeforeSubscribe && loading) {
    console.log("⏳ Loading message history...");
    
    historyBeforeSubscribe({ limit: 50 })
      .then((result) => {
        console.log("✅ Message history loaded:", result.items.length, "messages");
        const messages = result.items;
        setMessages(messages);
        setLoading(false);
      })
      .catch((error) => {
        console.error("❌ Failed to load message history:", error);
        setMessages([]);
        setLoading(false);
      });
  }
}, [historyBeforeSubscribe, loading, roomName]); // Add roomName as dependency

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

// Replace the sendMessage function
const sendMessage = async () => {
  if (!inputValue.trim()) return;

  const trimmedText = inputValue.trim();
  console.log("📤 Sending message:", trimmedText);

  const messagePayload: any = { text: trimmedText };

  if (clientId === contextOwnerId && contextData) {
    messagePayload.metadata = { context: contextData };
    console.log("📎 Adding context to message:", contextData);
  }

  // Create local message object for immediate UI update
  const newMessage = {
    clientId: clientId,
    text: trimmedText,
    metadata: messagePayload.metadata,
    timestamp: new Date().toISOString(),
  };

  console.log("➕ Adding message locally:", newMessage.clientId);
  setMessages((prev) => [...prev, newMessage]);

  try {
    await send(messagePayload);
    console.log("✅ Message sent successfully");
  } catch (err) {
    console.error("❌ Send error:", err);
    setLoading(true);
    return;
  }

  // Only mark as seen if send was successful
  try {
    const seenByUser = await axios.patch(
      `https://play-os-backend.forgehub.in/human/human/mark-seen`,
      {
        userId: clientId,
        roomType: type ? type.toUpperCase() : "",
        userType: "user",
        handled: trimmedText
      }
    );
    console.log("✅ Message marked as seen:", seenByUser.data);
  } catch (err) {
    console.error("❌ Failed to mark message as seen:", err);
  }

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
    console.log("Messaegs", messages);
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

          // Extract newGames and pastGames from API response
          const responseData = chatRes.data;
          const newGames = Array.isArray(responseData?.newGames)
            ? responseData.newGames
            : [];
          const pastGames = Array.isArray(responseData?.pastGames)
            ? responseData.pastGames
            : [];
          console.log("newGameMap", newGames);
          console.log("pastGameMap", pastGames);

          // Combine both arrays to search for the chatId
          const allGames = [...newGames, ...pastGames];
          const mapping = allGames.find((item: any) => item.chatId === chatId);
          console.log("all games new,past", allGames);
          console.log("mapping chatId", mapping);

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
        else if (type === "rm") {
  // For RM rooms, use the room name from currentRoomData or chatNames
  if (chatNames) {
    setDisplayName(chatNames);
  } else {
    setDisplayName("RM Chat");
  }
} else if (["fitness", "wellness", "sports", "nutrition"].includes(type || "")) {
  // For other single room types, use chatNames or fallback
  setDisplayName(chatNames || `${type?.charAt(0).toUpperCase()}${type?.slice(1)} Chat`);
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const contextParam = params.get("context");
    const clientIdFromUrl = params.get("clientId");
    if (clientIdFromUrl) setContextOwnerId(clientIdFromUrl);

    if (contextParam) {
      try {
        const parsed = JSON.parse(contextParam);
        setContextData(parsed); // ✅ use for sending only in this room

        // For display we keep string form, but won't use for old messages
        const contextStr = Object.entries(parsed)
          .map(([key, val]) =>
            key === "sessionTemplateTitle" || key === "openDate"
              ? `${val}`
              : `${key}: ${val}`
          )
          .join(", ");

        setContextInfo(contextStr);
      } catch {
        setContextInfo(null);
        setContextData(null);
      }
    }
  }, []);



// Add this useEffect after the existing context parsing useEffect
useEffect(() => {
  // Store the initial room when context is first parsed (only once)
  if (initialContextRoomRef.current === null && (contextInfo || contextData)) {
    initialContextRoomRef.current = roomName || null;
    console.log("Initial context room set to:", roomName);
    return; // Don't clean up for the initial room
  }
  
  // Clear URL params only when switching to a DIFFERENT room
  if (roomName && 
      initialContextRoomRef.current !== null && 
      roomName !== initialContextRoomRef.current) {
    console.log("Switching from", initialContextRoomRef.current, "to", roomName, "- clearing context");
    const params = new URLSearchParams(window.location.search);
    if (params.has('context')) {
      // Remove context param
      params.delete('context');
      
      // Update URL without page reload
      const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
      window.history.replaceState({}, '', newUrl);
    }
  }
}, [roomName]);

useEffect(() => {
  mountedRef.current = true;
  return () => {
    mountedRef.current = false;
    console.log("🧹 ChatRoomInner unmounting, cleaning up connections");
  };
}, []);

useEffect(() => {
  if (strictModeRef.current) {
    console.log("🔄 React Strict Mode double-fire detected, skipping");
    return;
  }
  strictModeRef.current = true;
  
  return () => {
    strictModeRef.current = false;
  };
}, []);


useEffect(() => {
  const handleError = (event: ErrorEvent) => {
    console.error("🚨 Component error caught:", event.error);
    setError(event.error?.message || "An error occurred");
  };

  window.addEventListener('error', handleError);
  return () => window.removeEventListener('error', handleError);
}, []);

// Add this early return after the error state declaration
if (error) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <p className="text-red-500 mb-2">Something went wrong</p>
        <p className="text-sm text-gray-500 mb-4">{error}</p>
        <button 
          onClick={() => {
            setError(null);
            setLoading(true);
            setMessages([]);
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Retry
        </button>
      </div>
    </div>
  );
}


  return (
<div 
  className="shadow-lg flex flex-col relative"
  style={{
    height: activeTab === "Events" || activeTab === "My Tribe" 
      ? 'calc(100vh - 200px)' // Adjust height for extra header
      : 'calc(100vh - 152px)', // Original height for other tabs
    position: 'fixed',
    top: activeTab === "Events" || activeTab === "My Tribe" 
      ? '200px' // Adjust top for extra header
      : '150px', // Original top for other tabs
    left: 0,
    right: 0,
    width: '100%'
  }}
>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-white shadow rounded-b-2xl ">
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
            {chatNames ? (
              <>
                <p className="text-sm font-semibold">{chatNames}</p>
                {activeTab === "My Game" && (
                  <p className="text-xs text-gray-500">Online</p>
                )}
              </>
            ) : activeTab === "My Buddy" ? (
              <p className="text-sm font-semibold">{chatName}</p>
            ) : (
              <>
                {displayName}
                <p className="text-xs text-gray-500">
                  {type === "buddy" ? "Online" : ""}
                </p>
              </>
            )}
          </div>
        </div>
        {activeTab === "My Game" && !chatNames && (
          <button
            onClick={() => {
              window.location.href = `https://playbookingv2.forgehub.in/event-participants-details?gameId=${
                sessionStorage.getItem("newGameIdDirect") ||
                localStorage.getItem("newGameDetail")
              }`;
            }}
            type="button" // good practice to prevent unintended form submits
            className="bg-blue-500 text-white text-xs font-semibold px-1 py-1 rounded shadow transition"
          >
            Game Details
          </button>
        )}
      </div>

      {/* Date label */}
      <div className="mt-1 ml-49 text-center max-w-[15%] text-xs text-gray-500 py-1 bg-gray-50 border-b border-gray-200">
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
                        : "https://randomuser.me/api/portraits/men/77.jpg"
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
                  {/* Show context from message metadata if present */}
                  {/* Show context from message metadata if present */}
                  {msg?.metadata?.context && (
                    <div className="text-sm font-extrabold text-blue-400 mb-1">
                      {(() => {
                        const entries = Object.entries(msg.metadata.context);

                        // Extract values in order, hiding duplicate "Context:" labels
                        const formatted = entries.map(([key, val]) => {
                          if (
                            key === "sessionTemplateTitle" ||
                            key === "openDate"
                          ) {
                            return `${val}`; // Just value
                          }
                          return `${key}: ${val}`;
                        });

                        // Join all into a single Context: header
                        return `Context: ${formatted.join(", ")}`;
                      })()}
                    </div>
                  )}

                  {/* Fallback to URL-based context only if metadata.context is not present */}
                  {/* {!msg?.metadata?.context &&
                    contextInfo &&
                    contextOwnerId &&
                    msg.clientId === contextOwnerId && (
                      <div className="text-sm font-extrabold text-red-400 mb-1">
                        context: {contextInfo}
                      </div>
                    )} */}

                  {/* Only show sender name if NOT me */}

                  {!isMine && msg.clientId && (
                    <div className="text-xs font-semibold text-blue-700 mb-1">
                      {type === "buddy"
                        ? chatName
                        : type === "events"
                        ? chatName
                        : !/^USER_/.test(msg.clientId) &&
                          !msg.clientId.includes("_")
                        ? msg.clientId
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
      <div className="flex px-5 py-2 pb-34 gap-2 sticky bottom-0 bg-white border-t border-gray-200 z-10">
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
