import { useContext, useEffect, useState } from "react";
import Header from "../components/Header";
import ChatList from "./ChatList";
import ChatRoom from "../components/ChatRoom";
import FootBallIcon from "../icons/FootballIcon";
import CricketIcon from "../icons/CricketIcon";
import TennisIcon from "../icons/TennisIcon";
import HockeyIcon from "../icons/HockeyIcon";
import BadmintonIcon from "../icons/BadmintonIcon";
import ChatCard from "./ChatCard";
import { ChatRoomProvider } from "@ably/chat/react";
import { ClientIdContext } from "../main";
import axios from "axios";
import { API_BASE_URL } from "./ApiBaseUrl";

type AllChatsProps = {
  activeRoom?: string; // optional as not used here
  setActiveRoom?: (room: string) => void; // optional as not used here
};

const AllChats = ({}: AllChatsProps) => {
  // function RoomStatus() {
  //   const [currentRoomStatus, setCurrentRoomStatus] = useState("");
  //   const { roomName } = useRoom({
  //     onStatusChange: (status) => {
  //       setCurrentRoomStatus(status.current);
  //     },
  //   });
  //   console.log("roomname", roomName);

  //   return (
  //     <div className="flex-1 border-1 border-blue-500">
  //       <ConnectionStatus />
  //       <p className="mt-2">
  //         Status: {currentRoomStatus}
  //         <br />
  //         Room: {roomName}
  //       </p>
  //     </div>
  //   );
  // }

  // function ConnectionStatus() {
  //   const { currentStatus } = useChatConnection();
  //   let i = 0;
  //   console.log("new user", i + 1);
  //   console.log(currentStatus, "currentStatus");
  //   return (
  //     <div className="p-4 text-center h-full border-gray-300 bg-gray-100">
  //       <h2 className="text-lg font-semibold text-blue-500">
  //         Ably Chat Connection
  //       </h2>
  //       <p className="mt-2">Connection: {currentStatus}!</p>
  //     </div>
  //   );
  // }

  const [mySport, setMySports] = useState<any[]>([]);

  // Add this function to get appropriate icon for each sport
  const getIconForSport = (sportName: string) => {
    const name = sportName.toLowerCase();
    if (name.includes("cricket")) return CricketIcon;
    if (name.includes("football")) return FootBallIcon;
    if (name.includes("tennis")) return TennisIcon;
    if (name.includes("hockey")) return HockeyIcon;
    if (name.includes("badminton")) return BadmintonIcon;
    // Default icon for unmatched sports
    return () => <div className="text-xl">🏃</div>;
  };

  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("My Buddy");
  const [showNotifications, setShowNotifications] = useState(false);

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

  // Add this useEffect to fetch sports when type is tribe
  useEffect(() => {
    if (chatType === "tribe") {
      async function fetchSportDetails() {
        try {
          const res = await axios.get(`${API_BASE_URL}/sports/all`);
          const data = res.data;
          setMySports(data);
        } catch (error) {
          console.error("Error fetching sport details", error);
          setMySports([]);
        }
      }
      fetchSportDetails();
    }
  }, [chatType]);

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
        onBackClick={() => setActiveChat(null)}
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

          {dummyNotifications.map((n) => (
            <ChatCard
              key={n.id}
              label={n.text}
              count={1}
              time={"2:00 PM"}
              actions={n.actions} // assume array like ["accept", "decline"]
              onAccept={() => console.log("Accepted", n.id)}
              onDecline={() => console.log("Declined", n.id)}
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
                    onClick={() => setActiveChat(null)}
                    className={`flex-shrink-0 cursor-pointer rounded-md w-14 h-14 mx-2 flex items-center justify-center p-3 transition ${
                      activeChat === sport.name
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
