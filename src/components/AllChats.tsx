import { useContext, useEffect, useState } from "react";
import Header from "../components/Header";
import ChatList from "./ChatList";
import ChatRoom from "../components/ChatRoom";
// import FootBallIcon from "../icons/FootballIcon";
// import CricketIcon from "../icons/CricketIcon";
// import TennisIcon from "../icons/TennisIcon";
// import HockeyIcon from "../icons/HockeyIcon";
// import BadmintonIcon from "../icons/BadmintonIcon";
import ChatCard from "./ChatCard";
import { ChatRoomProvider } from "@ably/chat/react";
import { ClientIdContext } from "../main";
import axios from "axios";
import { API_BASE_URL } from "./ApiBaseUrl";
import {
  BoxCricketIcon,
  PhysioIcon,
  RollerSkatingIcon,
  SquashIcon,
  BasketballIcon,
  CricketNetsIcon,
  StrengthIcon,
  YogaIcon,
  SkateboardingIcon,
  PickleballIcon,
  BodybuildingIcon,
  SwimmingIcon,
  FootballIcon,
  BadmintonIcon,
  CricketIcon,
  TennisIcon,
  HockeyIcon,
} from "../icons/Icons";
// Add these imports at the top with your existing imports

type AllChatsProps = {
  activeRoom?: string; // optional as not used here
  setActiveRoom?: (room: string) => void; // optional as not used here
};

const AllChats = ({}: AllChatsProps) => {
  const [mySport, setMySports] = useState<any[]>([]);
  // Add this state after your existing useState declarations
  const [selectedSport, setSelectedSport] = useState<string | null>(null);

  // Replace your existing getIconForSport function with this:
  const getIconForSport = (sportName: string) => {
    const name = sportName.toLowerCase();
    if (name.includes("box cricket")) return BoxCricketIcon;
    if (name.includes("physio")) return PhysioIcon;
    if (name.includes("roller skating")) return RollerSkatingIcon;
    if (name.includes("squash")) return SquashIcon;
    if (name.includes("basketball")) return BasketballIcon;
    if (name.includes("cricket practice nets") || name.includes("cricket nets"))
      return CricketNetsIcon;
    if (name.includes("strength")) return StrengthIcon;
    if (name.includes("football")) return FootballIcon;
    if (name.includes("yoga")) return YogaIcon;
    if (name.includes("badminton")) return BadmintonIcon;
    if (name.includes("skateboarding")) return SkateboardingIcon;
    if (name.includes("pickleball")) return PickleballIcon;
    if (name.includes("bodybuilding")) return BodybuildingIcon;
    if (name.includes("swimming") || name.includes("swimmining"))
      return SwimmingIcon;
    if (name.includes("cricket")) return CricketIcon;
    if (name.includes("tennis")) return TennisIcon;
    if (name.includes("hockey")) return HockeyIcon;
    // Default icon for unmatched sports
    return () => <div className="text-xl">🏃</div>;
  };

  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("My Buddy");
  const [showNotifications, setShowNotifications] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<
  { id: number; text: string; actions: string[], userId: string }[]
>([]);

  const isInChatRoom = activeChat !== null;

  const tabToType = (tab: string): "buddy" | "game" | "tribe" =>
    tab === "My Game" ? "game" : tab === "My Tribe" ? "tribe" : "buddy";

  const chatType = tabToType(activeTab);

  const dummyNotifications = [
    {
      id: 1,
      text: "Divya sent you a friend request",
      actions: ["Accept", "Decline"],
    },
    {
      id: 2,
      text: "You’ve been invited to a Football Game",
      actions: ["Join"],
    },
  ];

  const clientId = useContext(ClientIdContext);

  console.log(`hello from room-${chatType}-${activeChat}`);

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
      
      // Fetch all requester names in parallel
      const notifications = await Promise.all(
  pendingRequestIds.map(async (userId, index) => {
    try {
      const userRes = await axios.get(`https://play-os-backendv2.forgehub.in/human/${userId}`);
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
    const response = await axios.post(`${API_BASE_URL}/human/user/connections/add`, {
      userId: clientId,
      addTheseUserIds: [userIdToAdd],  // Pass in the accepted user's ID here
      addHereTargetList: "faveUsers",
    });
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
    const response = await axios.post(`${API_BASE_URL}/human/user/connections/add`, {
      userId: clientId,
      addTheseUserIds: [userIdToAdd],  // Pass in the accepted user's ID here
      addHereTargetList: "decline",
    });
    console.log("Accepted user response:", response.data);

    // Optionally, update local notifications state to remove accepted user
setPendingRequests((prev) =>
  prev.filter((notif) => notif.userId !== userIdToAdd)
);


  } catch (error) {
    console.error("Error accepting user:", error);
  }
};

  return (
    <>
      <Header
        title={"Communications"}
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setActiveChat(null);
          setShowNotifications(false); // Hide notifications when switching tabs
        }}
        showBackButton={true}
        onBackClick={() =>
          (window.location.href = `https://playbookingv2.forgehub.in/`)
        }
        showNotifications={() => setShowNotifications(true)}
        isNotificationsOpen={showNotifications}
      />

      {/* Notification Modal */}
      {showNotifications && (
        <div className="fixed mt-48 left-4 right z-50  shadow-lg p-4 ">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold">Notifications</h2>
            <button
              onClick={() => setShowNotifications(false)}
              className="text-sm text-gray-500"
            >
              Close
            </button>
          </div>

          {pendingRequests.map((n) => (
            <ChatCard
              key={n.id}
              label={n.text}
              count={1}
              time={""}
              actions={n.actions} // assume array like ["accept", "decline"]
              onAccept={() => acceptNotification(n.userId)}
              onDecline={() => deleteNotification(n.userId)}
            />
          ))}
        </div>
      )}

      {!showNotifications && (
        <>
          {/* Tribe Icons */}
          {chatType === "tribe" && (
            <div
              className="mx-4 mt-48 flex overflow-x-auto overflow-y-hidden"
              style={{
                height: "80px",
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
                    className={`flex-shrink-0 cursor-pointer rounded-md w-14 h-14 mx-2 flex items-center justify-center p-3 transition ${
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

          <div
            className={`${
              activeTab === "My Tribe"
                ? "mt-4"
                : activeTab === "My Game" || activeTab === "My Buddy"
                ? "mt-48"
                : ""
            } bg-white shadow-lg`}
          >
            {isInChatRoom ? (
              <ChatRoom
              key={getRoomName(chatType, clientId, activeChat!)}
                type={chatType}
                chatId={activeChat!}
                goBack={() => setActiveChat(null)}
                activeTab={activeTab}
                roomName={getRoomName(chatType, clientId, activeChat!)}
                chatNames={""}
              />
            ) : (
              <ChatList
                type={chatType}
                onOpenChat={(gameName) => {
                  setActiveChat(gameName);
                  console.log("opening chat with id", gameName);
                }}
                activeChat={activeChat}
              />
            )}
          </div>
        </>
      )}
    </>
  );
};

export default AllChats;
