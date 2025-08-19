import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import Header from "../components/Header";
import ChatList from "./ChatList";
import ChatRoom from "../components/ChatRoom";

import ChatCard from "./ChatCard";
import { ChatClientProvider, ChatRoomProvider } from "@ably/chat/react";
import { ClientIdContext } from "../main";
import axios from "axios";
import { API_BASE_URL } from "./ApiBaseUrl";

import { IoFootballOutline } from "react-icons/io5";
import { GiBodyBalance } from "react-icons/gi"; // Game Icons
import * as Ably from "ably";
// import {
//   ChatClient,
//   ChatMessageEvent,
//   ChatMessageEventType,
//   LogLevel,
// } from "@ably/chat";
// import { AblyProvider, ChatClientProvider } from "@ably/chat/react";

import {
  FaSwimmer,
  FaDumbbell,
  FaBasketballBall,
  FaSkating,
} from "react-icons/fa";
import {
  GiCricketBat,
  GiMuscleUp,
  GiMeditation,
  GiTennisRacket,
  GiTennisCourt,
} from "react-icons/gi";
import { MdSportsTennis } from "react-icons/md";
import { TbSkateboard } from "react-icons/tb";
import { HockeyIcon } from "../icons/HockeyIcon";
import NavForge from "./HeaderForge";
import { ChatClient, LogLevel } from "@ably/chat";
import { AblyProvider } from "ably/react";
export const PLAY_CONFIG = {
  startTime: "6:00",
  endTime: "24:00",
  turfGap: 30,
  TURF_BOX_BUFFER_HEIGHT: 40,
};
// turfGap is adjusted based on timeinterval if the timeinterval in timeConstants.ts is 30 then we set gap to 30

const size = 100;

export const DEFAULT_ICON_SIZE = size;

export const games = [
  {
    name: "Football 7 a side",
    icon: () => <IoFootballOutline size={DEFAULT_ICON_SIZE - 5} />,
  },
  {
    name: "Box Cricket",
    icon: () => <GiCricketBat size={DEFAULT_ICON_SIZE - 5} />,
  },
  { name: "yoga", icon: () => <GiMeditation size={DEFAULT_ICON_SIZE - 5} /> },
  {
    name: "bodybuilding",
    icon: () => <GiMuscleUp size={DEFAULT_ICON_SIZE - 5} />,
  },
  { name: "strength", icon: () => <FaDumbbell size={DEFAULT_ICON_SIZE - 5} /> },
  {
    name: "Swimmining",
    icon: () => <FaSwimmer size={DEFAULT_ICON_SIZE - 5} />,
  },
  {
    name: "Roller Skating",
    icon: () => <FaSkating size={DEFAULT_ICON_SIZE - 5} />,
  },
  {
    name: "Skateboarding",
    icon: () => <TbSkateboard size={DEFAULT_ICON_SIZE - 5} />,
  },
  {
    name: "Pickleball",
    icon: () => <GiTennisRacket size={DEFAULT_ICON_SIZE - 5} />,
  },
  {
    name: "Squash",
    icon: () => <GiTennisCourt size={DEFAULT_ICON_SIZE - 5} />,
  },
  {
    name: "Basketball",
    icon: () => <FaBasketballBall size={DEFAULT_ICON_SIZE - 5} />,
  },
  {
    name: "Badminton",
    icon: () => <MdSportsTennis size={DEFAULT_ICON_SIZE - 5} />,
  },
  {
    name: "Cricket Practice Nets",
    icon: () => (
      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        <GiCricketBat size={20} />
        <GiTennisCourt size={20} />
      </div>
    ),
  },
  {
    name: "Physio",
    icon: () => <GiBodyBalance size={DEFAULT_ICON_SIZE - 5} />,
  },
];

type AllChatsProps = {
  activeRoom?: string; // optional as not used here
  setActiveRoom?: (room: string) => void; // optional as not used here
};

const AllChats = ({}: AllChatsProps) => {
  const [mySport, setMySports] = useState<any[]>([]);
  // Add this state after your existing useState declarations
  const [selectedSport, setSelectedSport] = useState<string | null>(null);

  // Your getIconForSport function remains exactly the same - no changes needed!
  const getIconForSport = (sportName: string) => {
    const name = sportName.toLowerCase();
    if (name.includes("box cricket")) return GiCricketBat;
    if (name.includes("physio")) return GiBodyBalance;
    if (name.includes("roller skating")) return FaSkating;
    if (name.includes("squash")) return GiTennisCourt;
    if (name.includes("basketball")) return FaBasketballBall;
    if (name.includes("cricket practice nets") || name.includes("cricket nets"))
      return GiCricketBat;
    if (name.includes("strength")) return FaDumbbell;
    if (name.includes("football")) return IoFootballOutline;
    if (name.includes("yoga")) return GiMeditation;
    if (name.includes("badminton")) return MdSportsTennis;
    if (name.includes("skateboarding")) return TbSkateboard;
    if (name.includes("pickleball")) return GiTennisRacket;
    if (name.includes("bodybuilding")) return GiMuscleUp;
    if (name.includes("swimming") || name.includes("swimmining"))
      return FaSwimmer;
    if (name.includes("cricket")) return GiCricketBat;
    if (name.includes("tennis")) return GiTennisRacket;
    if (name.includes("hockey")) return HockeyIcon;
    // Default icon for unmatched sports
    return () => <div className="text-xl">🏃</div>;
  };

  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("My Buddy");
  const [hasUrlParams, setHasUrlParams] = useState(false);
  const [urlRoomType, setUrlRoomType] = useState<string>("");
  const [urlType, setUrlType] = useState<1 | 2 | 3>(1);
  const [singleRoomData, setSingleRoomData] = useState<{
    chatId: string;
    displayName: string;
    roomType: string;
    userId: string;
  } | null>(null);
  const [allRoomsData, setAllRoomsData] = useState<{
    [key: string]: {
      chatId: string;
      roomName: string;
      roomType: string;
    };
  }>({});
  const clientId = useContext(ClientIdContext);
  const [showNotifications, setShowNotifications] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<
    { id: number; text: string; actions: string[]; userId: string }[]
  >([]);
  const [monitoredRooms, setMonitoredRooms] = useState<Set<string>>(new Set());
  const [paramChatType, setParamChatType] = useState(false);
  const strictModeRef = useRef(false);
  const subscribedRooms = useRef<Set<string>>(new Set());
  // Add after existing useState declarations
const [roomNotifications, setRoomNotifications] = useState<{
  [key: string]: boolean;
}>({
  FITNESS: false,
  WELLNESS: false,
  SPORTS: false,
  NUTRITION: false,
  RM: false,
});

  // Add loading states to prevent race conditions
  const [isLoadingRoom, setIsLoadingRoom] = useState(false);
  const [chatLoadingStates, setChatLoadingStates] = useState<{[key: string]: boolean}>({});

  // Add abort controller for request cancellation
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Add debounce for tab switching
  const tabSwitchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

const [userRoomsData, setUserRoomsData] = useState<any[]>([]);

// Ably setup
const API_KEY = "0DwkUw.pjfyJw:CwXcw14bOIyzWPRLjX1W7MAoYQYEVgzk8ko3tn0dYUI";
const realtimeClient = useMemo(
  () =>
    new Ably.Realtime({
      key: API_KEY,
      clientId: clientId || "Guest",
    }),
  [clientId]
);
const chatClient = useMemo(
  () =>
    new ChatClient(realtimeClient, {
      logLevel: LogLevel.Info,
    }),
  [realtimeClient]
);

const roomConnections = useRef<{ [key: string]: any }>({});

  const [customRoomNameForParam, setCustomRoomNameForParam] = useState<{
    roomDisplayName: string;
    roomType: string;
    roomChatId: string;
    userId: string;
  } | null>(null);

  const isInChatRoom = activeChat !== null;

  const tabToType = (
    tab: string
  ):
    | "buddy"
    | "game"
    | "tribe"
    | "fitness"
    | "wellness"
    | "sports"
    | "nutrition"
    | "events"
    | "rm" => // Add "rm" type here
    tab === "My Game"
      ? "game"
      : tab === "My Tribe"
      ? "tribe"
      : tab === "Fitness"
      ? "fitness"
      : tab === "Wellness"
      ? "wellness"
      : tab === "Sports"
      ? "sports"
      : tab === "Nutrition"
      ? "nutrition"
      : tab === "Events"
      ? "events"
      : tab === "RM"
      ? "rm" // Add this line
      : "buddy";
  const chatType = tabToType(activeTab);

  const getTabsArray = (hasUrlParams: boolean, urlRoomType?: string) => {
    const baseTabs = [
      "My Buddy",
      "My Tribe",
      "Events",
      "Fitness",
      "Wellness",
      "Sports",
      "Nutrition",
    ];

    if (hasUrlParams && urlRoomType) {
      // For URL Type 3, don't show My Game and don't duplicate the roomType tab
      const roomTypeTab =
        urlRoomType.charAt(0) + urlRoomType.slice(1).toLowerCase();
      return baseTabs.filter((tab) => tab !== roomTypeTab); // Remove duplicate
    }

    // For URL Type 1 and 2, show My Game
    return [
      "My Buddy",
      "My Game",
      "My Tribe",
      "Events",
      "Fitness",
      "Wellness",
      "Sports",
      "Nutrition",
    ];
  };

  

  console.log(`hello from room-${chatType}-${activeChat}`);
  const [chatIdFromParams, setChatIdFromParams] = useState(false);


// Replace the cleanupConnections function
const cleanupConnections = useCallback(async () => {
  console.log("🧹 Starting connection cleanup");
  
  // Cancel any pending requests
  if (abortControllerRef.current) {
    abortControllerRef.current.abort();
    abortControllerRef.current = null;
  }

  // Clear any pending timeouts
  if (tabSwitchTimeoutRef.current) {
    clearTimeout(tabSwitchTimeoutRef.current);
    tabSwitchTimeoutRef.current = null;
  }

  // Cleanup room connections with better error handling
  const connectionsToCleanup = Object.entries(roomConnections.current);
  
  for (const [roomKey, room] of connectionsToCleanup) {
    try {
      console.log("🗑️ Cleaning up room:", roomKey);
      if (room && room.status !== "released" && typeof room.detach === 'function') {
        await room.detach();
      }
    } catch (error) {
      console.error(`Error detaching room ${roomKey}:`, error);
    }
  }
  
  roomConnections.current = {};
  setMonitoredRooms(new Set());
  subscribedRooms.current = new Set();
  
  console.log("✅ Connection cleanup completed");
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

  // Improved fetchRoomData with better error handling and loading states
  const fetchRoomData = useCallback(async (roomType: string) => {
    if (allRoomsData[roomType]) {
      setCurrentRoomData(allRoomsData[roomType]);
      return allRoomsData[roomType];
    }

    // Cancel previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();
    
    setIsLoadingRoom(true);
    setChatLoadingStates(prev => ({ ...prev, [roomType]: true }));

    try {
      const response = await axios.get(
        `${API_BASE_URL}/human/human/${clientId}`,
        { signal: abortControllerRef.current.signal }
      );
      
      const roomsData = response.data;

      const roomsMap: {
        [key: string]: { chatId: string; roomName: string; roomType: string };
      } = {};
      
      roomsData.forEach((room: any) => {
        const typeKey =
          room.roomType.charAt(0) + room.roomType.slice(1).toLowerCase();
        roomsMap[typeKey] = {
          chatId: room.chatId,
          roomName: room.roomName,
          roomType: room.roomType,
        };
      });

      setAllRoomsData(prev => ({ ...prev, ...roomsMap }));
      setCurrentRoomData(roomsMap[roomType]);
      
      return roomsMap[roomType];
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error("Error fetching room data:", error);
        setCurrentRoomData(null);
      }
      return null;
    } finally {
      setIsLoadingRoom(false);
      setChatLoadingStates(prev => ({ ...prev, [roomType]: false }));
    }
  }, [allRoomsData, clientId]);

  // Debounced chat opening function
  const openChatWithDelay = useCallback((chatId: string, roomData?: any) => {
    if (tabSwitchTimeoutRef.current) {
      clearTimeout(tabSwitchTimeoutRef.current);
    }

    tabSwitchTimeoutRef.current = setTimeout(() => {
      setActiveChat(chatId);
      if (roomData) {
        setCurrentRoomData(roomData);
      }
    }, 100); // Small delay to prevent rapid switching issues
  }, []);

  // Add this state to store current room data for single room tabs
  const [currentRoomData, setCurrentRoomData] = useState<{
    chatId: string;
    roomName: string;
    roomType: string;
  } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paramChatId = params.get("chatId");
    if (paramChatId) {
      setChatIdFromParams(true);
      openChatWithDelay(paramChatId);
      setActiveTab("My Game");
    }
  }, [openChatWithDelay]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paramChatId = params.get("chatId");
    if (paramChatId) {
      setChatIdFromParams(true);
      setActiveChat(paramChatId);
      setActiveTab("My Game"); // set activeTab because ChatRoom expects it
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paramRoomChatId = params.get("roomChatId");
    const paramRoomNames = params.get("roomnames");
    const paramRoomType = params.get("roomType");
    const paramChatId = params.get("chatId");
    const paramClientId = params.get("clientId");
    const currentClientId = paramClientId || clientId;

    // Determine URL type
    if (paramRoomChatId && paramRoomNames && paramRoomType) {
      // URL Type 3
      setUrlType(3);
      setHasUrlParams(true);
      setUrlRoomType(paramRoomType);
      setParamChatType(true);
      setActiveChat(paramRoomChatId);

      const tabName =
        paramRoomType.charAt(0) + paramRoomType.slice(1).toLowerCase();
      setActiveTab(tabName);

      setSingleRoomData({
        chatId: paramRoomChatId,
        displayName: decodeURIComponent(paramRoomNames),
        roomType: paramRoomType,
        userId: currentClientId,
      });
      console.log(singleRoomData, "single room data");

      setCustomRoomNameForParam({
        roomDisplayName: decodeURIComponent(paramRoomNames),
        roomType: paramRoomType,
        roomChatId: paramRoomChatId,
        userId: currentClientId,
      });
    } else if (paramChatId) {
      // URL Type 2
      setUrlType(2);
      setChatIdFromParams(true);
      setActiveChat(paramChatId);
      setActiveTab("My Game");
    } else {
      // URL Type 1
      setUrlType(1);
      setActiveTab("My Buddy"); // Default to My Buddy
    }
  }, [clientId]); // Add clientId as dependency

  function getRoomName(chatType: string, user1: string, user2: string) {
    if (chatType !== "buddy" && chatType !== "game" && chatType !== "tribe") {
      return `room-${chatType}-${user1}`; // for game or tribe, just use user1 or chatId
    }
    if (chatType === "game") {
      return `room-${chatType}-${user2}`;
    }

    if (chatType === "tribe") {
      return `room-${chatType}-${user2}`;
    }
    // sort the two user IDs alphabetically
    const sorted = [user1.toLowerCase(), user2.toLowerCase()].sort();
    console.log("Roooom", `room-${chatType}-${sorted[0]}-${sorted[1]}`);

    return `room-${chatType}-${sorted[0]}-${sorted[1]}`;
  }

  useEffect(() => {
    async function fetchPendingNotifications() {
      try {
        const res = await axios.get(`${API_BASE_URL}/human/${clientId}`);
        const pendingRequestIds: string[] = res.data.pendingRequest || [];
        if (pendingRequestIds.length === 0) {
          sessionStorage.setItem("hasNotif", "false");
          // No pending requests - set notification accordingly
          setPendingRequests([
            {
              id: 0,
              userId: "", // or null
              text: "You have no pending requests",
              actions: [], // no actions
            },
          ]);
          return; // No need to proceed further
        }
        if (pendingRequestIds.length > 0) {
          sessionStorage.setItem("hasNotif", "true");
        }
        // Fetch all requester names in parallel
        const notifications = await Promise.all(
          pendingRequestIds.map(async (userId, index) => {
            try {
              const userRes = await axios.get(
                `${API_BASE_URL}/human/${userId}`
              );
              const requesterName = userRes.data.name || "Unknown";
              return {
                id: index + 1,
                userId: userId,
                text: `You have a pending friend request from ${requesterName}`,
                actions: ["Accept", "Decline"],
              };
            } catch {
              return {
                id: index + 1,
                userId: userId,
                text: `You have a pending friend request from Unknown`,
                actions: ["Accept", "Decline"],
              };
            }
          })
        );

        setPendingRequests(notifications);
      } catch (error) {
        setPendingRequests([]);
      }
    }
    fetchPendingNotifications();
  }, [clientId]);

  // Add this useEffect to fetch sports when type is tribe
  useEffect(() => {
    if (chatType === "tribe") {
      async function fetchSportDetails() {
        try {
          const res = await axios.get(`${API_BASE_URL}/sports/all`);
          const data = res.data;
          setMySports(data);
          setActiveChat("CHAT_SOTD47");
        } catch (error) {
          console.error("Error fetching sport details", error);
          setMySports([]);
        }
      }
      fetchSportDetails();
    }
  }, [chatType]);

  const acceptNotification = async (userIdToAdd: string) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/human/user/connections/add`,
        {
          userId: clientId,
          addTheseUserIds: [userIdToAdd], // Pass in the accepted user's ID here
          addHereTargetList: "faveUsers",
        }
      );
      console.log("Accepted user response:", response.data);

      // Optionally, update local notifications state to remove accepted user
      setPendingRequests((prev) =>
        prev.filter((notif) => notif.userId !== userIdToAdd)
      );
    } catch (error) {
      console.error("Error accepting user:", error);
    }
  };

  const deleteNotification = async (userIdToAdd: string) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/human/user/connections/add`,
        {
          userId: clientId,
          addTheseUserIds: [userIdToAdd], // Pass in the accepted user's ID here
          addHereTargetList: "decline",
        }
      );
      console.log("Accepted user response:", response.data);

      // Optionally, update local notifications state to remove accepted user
      setPendingRequests((prev) =>
        prev.filter((notif) => notif.userId !== userIdToAdd)
      );
    } catch (error) {
      console.error("Error accepting user:", error);
    }
  };

  // Add this new state to store current room data for single room tabs
  // const [currentRoomData, setCurrentRoomData] = useState<{
  //   chatId: string;
  //   roomName: string;
  //   roomType: string;
  // } | null>(null);

  // Update the fetchRoomData function to also set currentRoomData
  // const fetchRoomData = async (roomType: string) => {
  //   if (allRoomsData[roomType]) {
  //     setCurrentRoomData(allRoomsData[roomType]);
  //     return allRoomsData[roomType];
  //   }

  //   try {
  //     const response = await axios.get(
  //       `${API_BASE_URL}/human/human/${clientId}`
  //     );
  //     const roomsData = response.data;

  //     // Store all rooms data
  //     const roomsMap: {
  //       [key: string]: { chatId: string; roomName: string; roomType: string };
  //     } = {};
  //     roomsData.forEach((room: any) => {
  //       const typeKey =
  //         room.roomType.charAt(0) + room.roomType.slice(1).toLowerCase();
  //       roomsMap[typeKey] = {
  //         chatId: room.chatId,
  //         roomName: room.roomName,
  //         roomType: room.roomType,
  //       };
  //     });
  //     console.log(roomsMap, "roomData by Tab");
  //     console.log(roomsMap[roomType], "return fetchRoomData");
  //     setAllRoomsData(roomsMap);
  //     setCurrentRoomData(roomsMap[roomType]);
  //     return roomsMap[roomType];
  //   } catch (error) {
  //     console.error("Error fetching room data:", error);
  //     setCurrentRoomData(null);
  //     return null;
  //   }
  // };


  // Add notification monitoring useEffect
// Add notification monitoring useEffect
// Add notification monitoring useEffect
// Replace the notification monitoring useEffect in AllChats.tsx
useEffect(() => {
  if (!clientId || !chatClient) return;

  const setupNotificationMonitoring = async () => {
    // Don't monitor if we're currently in a chat room
    if (activeChat !== null) {
      console.log("🚫 Skipping notification monitoring - chat room is active");
      return;
    }

    // Add a small delay to prevent conflicts with ChatRoomInner
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      const response = await axios.get(`${API_BASE_URL}/human/human/${clientId}`);
      const rooms = Array.isArray(response.data) ? response.data : response.data.rooms || [];
      setUserRoomsData(rooms);

      const roomTypes = ['FITNESS', 'WELLNESS', 'SPORTS', 'NUTRITION', 'RM'];
      
      for (const roomType of roomTypes) {
        const room = rooms.find((r: any) => r.roomType === roomType);
        if (!room) continue;

        const roomKey = `${room.roomType}-${room.roomName}-${room.chatId}-${clientId}`;

        // Skip if we're already monitoring this room
        if (monitoredRooms.has(roomKey) && roomConnections.current[roomKey]) {
          console.log("✅ Already monitoring room:", roomKey);
          continue;
        }

        // Skip if this room is currently active in ChatRoomInner
        if (activeChat === room.chatId) {
          console.log("🚫 Skipping monitoring for active chat:", roomKey);
          continue;
        }

        try {
          console.log("🔄 Setting up monitoring for:", roomKey);
          
          const ablyRoom = await chatClient.rooms.get(roomKey);
          
          // Check if room was released during async operation
          if (ablyRoom.status === "released") {
            console.log("⚠️ Room was released during setup:", roomKey);
            continue;
          }
          
          if (ablyRoom.status !== "attached") {
            await ablyRoom.attach();
          }

          // Double-check room status after attach
          if (ablyRoom.status === "released" as any) {
            console.log("⚠️ Room released after attach:", roomKey);
            continue;
          }

          roomConnections.current[roomKey] = ablyRoom;

          // Rest of the monitoring setup...
          const checkInitialMessages = async () => {
            try {
              if (ablyRoom.status === "released") return;
              
              const messageHistory = await ablyRoom.messages.history({ limit: 60 });
              const messages = messageHistory.items;
              const seenByTeamAtDate = new Date(room.handledAt * 1000);
              
              let hasNewFromOthers = false;
              
              messages.forEach((message: any) => {
                const messageTimestamp = message.createdAt || message.timestamp;
                const isFromOtherUser = message.clientId !== clientId;
                
                if (
                  messageTimestamp &&
                  new Date(messageTimestamp) > seenByTeamAtDate &&
                  isFromOtherUser
                ) {
                  hasNewFromOthers = true;
                }
              });

              setRoomNotifications(prev => ({
                ...prev,
                [roomType]: hasNewFromOthers
              }));
            } catch (error) {
              console.error(`Initial message check error for ${roomKey}:`, error);
            }
          };

          await checkInitialMessages();

          if (!subscribedRooms.current.has(roomKey)) {
            const messageListener = (messageEvent: any) => {
              if (ablyRoom.status === "released") return;
              
              const message = messageEvent.message || messageEvent;
              const messageTimestamp = message.createdAt || message.timestamp;
              const isFromOtherUser = message.clientId !== clientId;

              setUserRoomsData((prevRooms) => {
                const currentRoom = prevRooms.find(r => r.roomType === roomType);
                if (!currentRoom) return prevRooms;
                
                const currentSeenByTeamAtDate = new Date(currentRoom.handledAt * 1000);

                if (
                  messageTimestamp &&
                  new Date(messageTimestamp) > currentSeenByTeamAtDate &&
                  isFromOtherUser
                ) {
                  setRoomNotifications(prev => ({
                    ...prev,
                    [roomType]: true
                  }));
                }

                return prevRooms;
              });
            };

            ablyRoom.messages.subscribe(messageListener);
            subscribedRooms.current.add(roomKey);
          }

          setMonitoredRooms(prev => new Set([...prev, roomKey]));
          console.log("✅ Successfully set up monitoring for:", roomKey);
          
        } catch (error) {
          console.error(`Failed to setup monitoring for ${roomType}:`, error);
        }
      }
    } catch (error) {
      console.error("Failed to setup notification monitoring:", error);
    }
  };

  // Only run if not in a chat room
  if (activeChat === null) {
    setupNotificationMonitoring();
  }

  // Reduced interval frequency to prevent conflicts
  const intervalId = setInterval(() => {
    if (activeChat === null) {
      setupNotificationMonitoring();
    }
  }, 30000); // Increased from 10s to 30s

  return () => {
    clearInterval(intervalId);
  };
}, [clientId, chatClient, activeChat]); // Removed cleanupConnections dependency

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupConnections();
    };
  }, [cleanupConnections]);

//   useEffect(() => {
//   if (activeChat && ["Fitness", "Wellness", "Sports", "Nutrition", "RM"].includes(activeTab)) {
    // setRoomNotifications(prev => ({
    //   ...prev,
    //   [activeTab.toUpperCase()]: false
    // }));
//   }
// }, [activeChat]);

  if (!realtimeClient || !chatClient) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading chat system...</div>
      </div>
    );
  } // Add activeChat as dependency

  // On mount, parse chatId param

  return (
    <>
     <AblyProvider client={realtimeClient}>
    <ChatClientProvider client={chatClient}>
      <Header
        title={"Communications"}
        activeTab={activeTab}
        hasUrlParams={urlType === 3}
        urlRoomType={urlRoomType}
        roomNotifications={roomNotifications}
        setActiveTab={async (tab) => {
          setActiveTab(tab);

          // ALWAYS clear these states first for any tab switch
          setCustomRoomNameForParam(null);
          setCurrentRoomData(null);
          setActiveChat(null);
          setParamChatType(false);

          const url = new URL(window.location.href);
          url.searchParams.delete("context");

          // Handle single room tabs (Fitness, Wellness, Sports, Nutrition)
          if (
            ["Fitness", "Wellness", "Sports", "Nutrition", "RM"].includes(tab)
          ) {

    //         setRoomNotifications(prev => ({
    //   ...prev,
    //   [tab.toUpperCase()]: false
    // }));
            if (tab === "RM") {
              // Special handling for RM tab - directly fetch and open chat
              try {
                const response = await axios.get(
                  `${API_BASE_URL}/human/human/${clientId}`
                );
                const roomsData = response.data;

                // Filter for RM room specifically
                const rmRoom = roomsData.find(
                  (room: any) => room.roomType === "RM"
                );

                if (rmRoom) {
                  // Found RM room - open it directly
                  setActiveChat(rmRoom.chatId);
                  setUrlRoomType(rmRoom.roomType);
                  setParamChatType(true);

                  // Set currentRoomData for the chat room
                  const rmRoomData = {
                    chatId: rmRoom.chatId,
                    roomName: rmRoom.roomName,
                    roomType: rmRoom.roomType,
                  };

                  setTimeout(() => {
                    setCurrentRoomData(rmRoomData);
                  }, 50);

                  // Also update allRoomsData cache
                  setAllRoomsData((prev) => ({
                    ...prev,
                    RM: rmRoomData,
                  }));
                } else {
                  // No RM room found - show not available UI
                  setActiveChat(null);
                  setCurrentRoomData(null);
                }
                return;
              } catch (error) {
                console.error("Error fetching RM room:", error);
                setActiveChat(null);
                setCurrentRoomData(null);
              }
            }
            const roomData = await fetchRoomData(tab);
            if (roomData) {
              setActiveChat(roomData.chatId);
              setUrlRoomType(roomData.roomType);
              setParamChatType(true);
              // Set currentRoomData after a brief delay to ensure clean state
              setTimeout(() => {
                setCurrentRoomData(roomData);
              }, 50);
            }
          } else if (tab === "Events") {
            setActiveChat("EVENT_1A");
          } else if (tab === "My Tribe") {
            setActiveChat("CHAT_SOTD47");
          } else if (tab === "My Game") {
            // For My Game, activeChat stays null to show ChatList
            setActiveChat(null);
          } else {
            // For My Buddy and other tabs
            setActiveChat(null);
          }

          setChatIdFromParams(false);
          setShowNotifications(false);

          // Clear URL params based on URL type and tab switch
          if (
            (urlType === 3 &&
              !["Fitness", "Wellness", "Sports", "Nutrition", "RM"].includes(
                tab
              )) ||
            (urlType === 2 && tab !== "My Game")
          ) {
            const url = new URL(window.location.href);
            if (urlType === 3) {
              url.searchParams.delete("roomChatId");
              url.searchParams.delete("roomnames");
              url.searchParams.delete("roomType");
              url.searchParams.delete("context");
              setUrlType(1);
              setHasUrlParams(false);
              setUrlRoomType("");
            }
            if (urlType === 2) {
              url.searchParams.delete("chatId");
            }
          }
          window.history.replaceState({}, document.title, url.toString());
        }}
        showBackButton={true}
        onBackClick={() => {
          const url = new URL(window.location.href);
          url.searchParams.delete("chatId");
          url.searchParams.delete("roomChatId");
          url.searchParams.delete("roomnames");
          url.searchParams.delete("roomType");
          url.searchParams.delete("context");
          window.history.replaceState({}, document.title, url.toString());
          window.location.href = `https://playbookingv3.forgehub.in/viewPlan`;
        }}
        showNotifications={() => setShowNotifications(true)}
        isNotificationsOpen={showNotifications}
      />
      
      {/* Notification Modal */}
      {showNotifications && (
        <div className="fixed mt-48 left-4 right z-50 shadow-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold">Notifications</h2>
            <button
              onClick={() => setShowNotifications(false)}
              className="text-sm text-gray-500"
            >
              Close
            </button>
          </div>

          {pendingRequests.length === 0 ? (
            <ChatCard
              label="No notifications"
              count={0}
              time=""
              actions={[]} // no actions
            />
          ) : (
            pendingRequests.map((n) => (
              <ChatCard
                key={n.id}
                label={n.text}
                count={n.id}
                time=""
                actions={n.actions} // assume array like ["accept", "decline"]
                onAccept={() => acceptNotification(n.userId)}
                onDecline={() => deleteNotification(n.userId)}
              />
            ))
          )}
        </div>
      )}

      {!showNotifications && (
        <>
          {chatIdFromParams ? (
            // OLD FLOW - open as before
            <div className="mt-44">
              <ChatRoom
                key={`old-flow-${activeChat}-${Date.now()}`}
                type="game"
                chatId={activeChat!}
                goBack={() => {
                  setActiveChat(null);
                  setChatIdFromParams(false);
                  setCustomRoomNameForParam(null);
                  setCurrentRoomData(null);
                  setActiveTab("My Game");
                  const url = new URL(window.location.href);
                  url.searchParams.delete("chatId");
                  setUrlType(1);
                  window.history.replaceState(
                    {},
                    document.title,
                    url.toString()
                  );
                }}
                activeTab="My Game"
                roomName={`room-game-${activeChat}`}
                chatNames={""}
              />
            </div>
          ) : customRoomNameForParam ? (
            // NEW FLOW - open with customRoomNameForParam
            <div className="mt-44">
              <ChatRoom
                key={`new-flow-${
                  customRoomNameForParam.roomChatId
                }-${Date.now()}`} // ← CHANGED KEY
                type="game"
                chatId={customRoomNameForParam.roomChatId}
                goBack={() => {
                  setActiveChat(null);
                  setParamChatType(false);
                  setCustomRoomNameForParam(null);
                  setActiveTab("My Buddy");
                  const url = new URL(window.location.href);
                  url.searchParams.delete("roomChatId");
                  url.searchParams.delete("roomnames");
                  url.searchParams.delete("roomType");
                  url.searchParams.delete("context");
                  window.history.replaceState(
                    {},
                    document.title,
                    url.toString()
                  );
                }}
                activeTab="My Game"
                roomName={
                  customRoomNameForParam.roomType +
                  "-" +
                  customRoomNameForParam.roomDisplayName +
                  "-" +
                  customRoomNameForParam.roomChatId +
                  "-" +
                  customRoomNameForParam.userId
                }
                chatNames={customRoomNameForParam.roomDisplayName}
              />
            </div>
          ) : (
            <>
              {/* Tribe Icons */}
              {chatType === "tribe" && (
                <div
                  className="mx-4 mt-40 flex overflow-x-auto overflow-y-hidden"
                  style={{
                    height: "55px",
                    scrollbarWidth: "auto",
                    WebkitOverflowScrolling: "touch",
                  }}
                >
                  {mySport.map((sport) => {
                    const IconComponent = getIconForSport(sport.name);
                    return (
                      <div
                        key={sport.name}
                        onClick={() => setActiveChat(sport.chatId)}
                        className={`flex-shrink-0 cursor-pointer rounded-md w-12 h-12 mx-2 flex items-center justify-center transition ${
                          activeChat === sport.chatId
                            ? "bg-[#00f0ff] shadow-md"
                            : "bg-gray-200"
                        }`}
                      >
                        <IconComponent />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Events Icons */}
              {/* Events Icons */}
              {chatType === "events" && (
                <div
                  className="mx-4 mt-40 flex overflow-x-auto overflow-y-hidden"
                  style={{
                    height: "55px",
                    scrollbarWidth: "auto",
                    WebkitOverflowScrolling: "touch",
                  }}
                >
                  {[1, 2, 3, 4, 5].map((eventNum) => (
                    <div
                      key={`event-${eventNum}A`}
                      onClick={() => setActiveChat(`EVENT_${eventNum}A`)}
                      className={`flex-shrink-0 cursor-pointer rounded-md w-12 h-12 mx-2 flex items-center justify-center transition ${
                        activeChat === `EVENT_${eventNum}A`
                          ? "bg-[#00f0ff] shadow-md"
                          : "bg-gray-200"
                      }`}
                    >
                      <div className="text-xl">🎪</div>
                    </div>
                  ))}
                </div>
              )}

              <div
                className={`${
                  activeTab === "My Tribe" || activeTab === "Events"
                    ? "mt-4"
                    : activeTab === "My Buddy" ||
                      activeTab === "My Game" ||
                      [
                        "Fitness",
                        "Wellness",
                        "Sports",
                        "Nutrition",
                        "RM",
                      ].includes(activeTab)
                    ? "mt-48"
                    : ""
                } bg-white shadow-lg`}
              >
                {isInChatRoom ? (
                  <ChatRoom
                    key={`main-${activeTab}-${activeChat}-${
                      currentRoomData?.chatId || "default"
                    }-${Date.now()}`}
                    type={chatType}
                    chatId={activeChat!}
                    goBack={() => {
                      setActiveChat(null);
                      setCurrentRoomData(null);
                      setCustomRoomNameForParam(null);
                      setParamChatType(false);

                      // Go back logic
                      if (
                        [
                          "Fitness",
                          "Wellness",
                          "Sports",
                          "Nutrition",
                          "RM",
                        ].includes(activeTab) ||
                        activeTab === "Events"
                      ) {
                        setActiveTab("My Buddy");
                      } else if (activeTab === "My Tribe") {
                        setActiveTab("My Tribe");
                      } else if (activeTab === "My Game") {
                        setActiveTab("My Game");
                      } else {
                        setActiveTab("My Buddy");
                      }

                      // Clear URL params
                      const url = new URL(window.location.href);
                      if (urlType === 3) {
                        url.searchParams.delete("roomChatId");
                        url.searchParams.delete("roomnames");
                        url.searchParams.delete("roomType");
                        url.searchParams.delete("context");
                        setUrlType(1);
                        setHasUrlParams(false);
                        setUrlRoomType("");
                      }
                      if (urlType === 2) {
                        url.searchParams.delete("chatId");
                      }
                      window.history.replaceState(
                        {},
                        document.title,
                        url.toString()
                      );
                    }}
                    activeTab={activeTab}
                    roomName={
                      [
                        "Fitness",
                        "Wellness",
                        "Sports",
                        "Nutrition",
                        "RM",
                      ].includes(activeTab) && currentRoomData
                        ? `${currentRoomData.roomType}-${currentRoomData.roomName}-${currentRoomData.chatId}-${clientId}`
                        : activeTab === "Events"
                        ? `room-events-${activeChat}`
                        : getRoomName(chatType, clientId, activeChat!)
                    }
                    chatNames={
                      [
                        "Fitness",
                        "Wellness",
                        "Sports",
                        "Nutrition",
                        "RM",
                      ].includes(activeTab) && currentRoomData
                        ? currentRoomData.roomName
                        : activeTab === "Events"
                        ? `Event ${activeChat
                            ?.replace("EVENT_", "")
                            .replace("A", "")}`
                        : ""
                    }
                  />
                ) : (
                  <ChatList
                    type={chatType}
                    onOpenChat={(gameName) => {
                      setActiveChat(gameName);
                      console.log("opening chat with id", gameName);
                    }}
                    activeChat={activeChat}
                    singleRoomData={singleRoomData}
                  />
                )}
              </div>
            </>
          )}
        </>
      )}
      </ChatClientProvider>
  </AblyProvider>
    </>
  );
};

export default AllChats;
