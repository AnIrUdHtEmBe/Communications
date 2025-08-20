import { useContext, useEffect, useState } from "react";
import ChatCard from "../components/ChatCard";
import PendingRequests from "./PendingRequests";
import PastGames from "./PastGames";
import ChatRoom from "./ChatRoomInner";
import axios from "axios";
import MessageIcon from "../icons/MessageIcon";
import { ClientIdContext } from "../main";
import { API_BASE_URL } from "./ApiBaseUrl";

interface ChatListProps {
  type:
    | "buddy"
    | "game"
    | "tribe"
    | "fitness"
    | "wellness"
    | "sports"
    | "nutrition"
    | "events"
    | "rm"
  onOpenChat: (chatId: string) => void;
  activeChat?: string | null;
  singleRoomData?: {
    chatId: string;
    displayName: string;
    roomType: string;
    userId: string;
  } | null;
}

type Buddy = {
  name: string;
  id: string;
  message: string;
  count: number;
  time: string;
};

type Tribe = {
  name: string;
  members: string;
  count: number;
  time: string;
  message: string;
  sportChatId: string;
};

type GameSummary = {
  gameId: string;
  sport: string;
  members: string;
  count: number;
  time: string;
  timeFormatted: any;
  message: string;
  gameChatId: string;
};

// Default dummy data for fallback

export default function ChatList({
  type,
  onOpenChat,
  singleRoomData,
}: ChatListProps) {
  const [showPending, setShowPending] = useState(false);
  const [pastGames, setPastGames] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [buddies, setBuddies] = useState<Buddy[]>([]);
  const [games, setGames] = useState<string[]>([]); // hold array of game IDs (strings)
  const [myGame, setMyGame] = useState<GameSummary[]>([]);
  const [sports, setSports] = useState<string[]>([]);
  const [mySport, setMySports] = useState<Tribe[]>([]);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [latestPendingTime, setLatestPendingTime] = useState("");
  const clientId = useContext(ClientIdContext);
  const [chatName, setChatName] = useState<string | null>(null);
  // In ChatList.tsx - Add these state variables after existing useState declarations
  const [buddyTimestamps, setBuddyTimestamps] = useState<{
    [key: string]: string;
  }>({});
  const [gameTimestamps, setGameTimestamps] = useState<{
    [key: string]: string;
  }>({});
  const [tribeTimestamps, setTribeTimestamps] = useState<{
    [key: string]: string;
  }>({});
  // In ChatList.tsx - Add this state after existing useState declarations
  const [buddyAvatars, setBuddyAvatars] = useState<{ [key: string]: string }>(
    {}
  );
  // State to manage past games for display
  const [filteredPastGames, setFilteredPastGames] = useState<GameSummary[]>([]);

  const [showMyGame, setShowMyGame] = useState<boolean>(true);
  const [apiPastGames, setApiPastGames] = useState<any[]>([]);

  // Fetch main user data, set buddies and gamesBooked IDs
  // In ChatList.tsx - Replace the fetchBuddiesFromAPI function
  async function fetchBuddiesFromAPI(mainUserId: string): Promise<Buddy[]> {
    try {
      // 1. Fetch main user data
      const mainUserResponse = await axios.get(
        `${API_BASE_URL}/human/${mainUserId}`
      );

      // Set gamesBooked IDs into state
      const gameResponse = await axios.get(
        `${API_BASE_URL}/human/getChatId/${mainUserId}`
      );
      console.log("game new api raw", gameResponse);

      const responseData = gameResponse.data;
      const newGames = Array.isArray(responseData?.newGames)
        ? responseData.newGames
        : [];
      const pastGamesFromApi = Array.isArray(responseData?.pastGames)
        ? responseData.pastGames
        : [];

      const gamesBooked = newGames.map((item: any) => item.gameId);
      console.log(gamesBooked, "Games booked new api");
      setGames(gamesBooked);

      setApiPastGames(pastGamesFromApi);
      // Fetch fave users details
      const faveUserIds = mainUserResponse.data.faveUsers || [];
      const faveUsersResponses = await Promise.all(
        faveUserIds.map((userId: any) =>
          axios.get(`${API_BASE_URL}/human/${userId}`)
        )
      );

      // Fetch avatars for all buddies
      const avatarPromises = faveUserIds.map(async (userId: string) => {
        try {
          const response = await axios.post(
            `${API_BASE_URL}/human/human/get-photo`,
            `${userId}`
          );
          return {
            userId,
            avatar:
              response.data || "https://randomuser.me/api/portraits/men/78.jpg",
          };
        } catch (err) {
          return {
            userId,
            avatar: "https://randomuser.me/api/portraits/men/78.jpg",
          };
        }
      });

      const avatarResults = await Promise.all(avatarPromises);
      const avatarMap = avatarResults.reduce((acc, { userId, avatar }) => {
        acc[userId] = avatar;
        return acc;
      }, {} as { [key: string]: string });

      setBuddyAvatars(avatarMap);

      const buddiesFromAPI: Buddy[] = faveUsersResponses.map((res) => ({
        name: res.data.name || "Admin",
        id: res.data.userId,
        message: res.data.lastMessage || "Hi there",
        count: 0,
        time: "12:30",
      }));

      return buddiesFromAPI;
    } catch (error) {
      console.error("Error fetching buddies from API:", error);
      return [];
    }
  }

  // Fetch detailed game info for each game ID whenever `games` changes and type is "game"
  useEffect(() => {
    if (type !== "game" || games.length === 0) {
      setMyGame([]); // clear when no games or not game view
      return;
    }

    // In ChatList.tsx - Replace the existing fetchGameDetails function
    async function fetchGameDetails() {
      const fetchedGames: GameSummary[] = [];
      try {
        // 1. Fetch chatId mappings once for this user
        const chatRes = await axios.get(
          `${API_BASE_URL}/human/getChatId/${clientId}`
        );
        const responseData = chatRes.data;
        const newGames = Array.isArray(responseData?.newGames)
          ? responseData.newGames
          : [];
        const chatMappings: {
          courtId: string;
          startTime: string;
          endTime: string;
          gameId: string;
          chatId: string;
        }[] = newGames;

        const validGameIds = games.filter((gameId) =>
          chatMappings.some((mapping) => mapping.gameId === gameId)
        );

        // 2. Now fetch game details in parallel
        await Promise.all(
          validGameIds.map(async (gameId) => {
            try {
              const res = await axios.get(`${API_BASE_URL}/game/${gameId}`);
              const data = res.data;
              console.log("Game fetch api in useEffect", data);

              // Find matching chatId from chatMappings for this gameId
              const mapping = chatMappings.find((m) => m.gameId === gameId);
              const gameChatId = mapping?.chatId ?? "UnknownChatId";

              const sport = data.sport || "Unknown Sport";

              // Format sport name with date
              const gameDate = data.startTime
                ? new Date(data.startTime).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                : "";
              const formattedSportName = gameDate
                ? `${sport} - ${gameDate}`
                : sport;

              const players = data.scheduledPlayersDetails || [];
              const membersNames = players.map((p: any) => p.name).join(", ");
              const count = players.length || 0;
              const time = data.startTime
                ? new Date(data.startTime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "N/A";

              fetchedGames.push({
                gameId,
                sport: formattedSportName, // Use formatted name with date
                members: membersNames,
                count,
                time,
                timeFormatted: gameDate
                  ? new Date(data.startTime).toISOString()
                  : "",
                message: "",
                gameChatId, // add chatId here
              });
            } catch (err) {
              console.error(`Failed to fetch details for game ${gameId}`, err);
            }
          })
        );
        setMyGame(fetchedGames);
      } catch (error) {
        console.error("Error fetching game details or chat mappings", error);
        setMyGame([]);
      }
    }

    fetchGameDetails();
  }, [games, type]);

  useEffect(() => {
    if (type !== "tribe") {
      setMySports([]);
      return;
    }

    async function fetchSportDetails() {
      console.log("fetching sports!!!");

      try {
        const res = await axios.get(`${API_BASE_URL}/sports/all`);
        const data = res.data;
        console.log("api sport data ", data);

        // Map the API response to Tribe format
        const fetchedSports: Tribe[] = data.map((sportItem: any) => {
          const sportName = sportItem.name || "Unknown Sport";
          const description = sportItem.description || "";
          const maxPlayers = sportItem.maxPlayers || 0;
          const minPlayers = sportItem.minPlayers || 0;
          const sportChatId = sportItem.chatId;

          return {
            name: sportName,
            members: `${minPlayers}-${maxPlayers} players`, // Use player range as members info
            count: Math.floor(Math.random() * 50) + 1, // Random count for demo
            time: "Active", // Since there's no time in API response
            message: description || "Join the tribe!",
            sportChatId: sportChatId,
          };
        });

        setMySports(fetchedSports);
        console.log(fetchedSports, "sports data!!");
      } catch (error) {
        console.error("Error fetching sport details", error);
        setMySports([]);
      }
    }

    fetchSportDetails();
  }, [type]);

  // Helper function for opening chat
  const handleOpenChat = (id: string) => {
    onOpenChat(id);
    console.log("pastGames gameId", id);

    setPastGames(false);
    setShowMyGame(false);
  };

  // Reset UI when type changes
  useEffect(() => {
    setPastGames(false);
    setShowPending(false);
    setActiveChatId(null);
  }, [type]);

  // Fetch buddies when type is buddy
  useEffect(() => {
    if (type === "buddy" || type === "game") {
      (async () => {
        const fetchedBuddies = await fetchBuddiesFromAPI(clientId);
        setBuddies(fetchedBuddies);
      })();
    }
  }, [type]);

  async function fetchPendingRequests(mainUserId: string) {
    try {
      const res = await axios.get(`${API_BASE_URL}/human/${mainUserId}`);
      const pendingRequestIds = res.data.pendingRequest || [];
      setPendingRequestsCount(pendingRequestIds.length);

      if (pendingRequestIds.length === 0) {
        setLatestPendingTime("");
        return;
      }

      // To get request time, you must have some time metadata for each request.
      // If not available, skip time logic.
      // Here, assuming .pendingRequestTimes is an array of timestamps in .data
      const pendingRequestTimes = res.data.pendingRequestTimes || [];
      if (pendingRequestTimes.length) {
        const latest = Math.max(
          ...pendingRequestTimes.map((t: string | number) =>
            new Date(t).getTime()
          )
        );
        setLatestPendingTime(
          new Date(latest).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        );
      } else {
        setLatestPendingTime("");
      }
    } catch (error) {
      setPendingRequestsCount(0);
      setLatestPendingTime("");
      console.error("Error fetching pending requests:", error);
    }
  }

  useEffect(() => {
    if (type === "buddy") {
      fetchPendingRequests(clientId);
    }
  }, [type]);

  useEffect(() => {
    if (type !== "game") return;

    // Process past games from API
    async function processPastGames() {
      if (apiPastGames.length === 0) {
        setFilteredPastGames([]);
        return;
      }

      const processedPastGames: GameSummary[] = [];

      await Promise.all(
        apiPastGames.map(async (pastGame) => {
          try {
            const res = await axios.get(
              `${API_BASE_URL}/game/${pastGame.gameId}`
            );
            const data = res.data;

            const sport = data.sport || "Unknown Sport";

            // Format sport name with date
            const gameDate = data.startTime
              ? new Date(data.startTime).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              : "";
            const formattedSportName = gameDate
              ? `${sport} - ${gameDate}`
              : sport;

            const players = data.scheduledPlayersDetails || [];
            const membersNames = players.map((p: any) => p.name).join(", ");
            const count = players.length || 0;
            const time = data.startTime
              ? new Date(data.startTime).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "N/A";

            processedPastGames.push({
              gameId: pastGame.gameId,
              sport: formattedSportName,
              members: membersNames,
              count,
              time,
              timeFormatted: data.startTime
                ? new Date(data.startTime).toISOString()
                : "",
              message: "",
              gameChatId: pastGame.chatId,
            });
          } catch (err) {
            console.error(
              `Failed to fetch details for past game ${pastGame.gameId}`,
              err
            );
          }
        })
      );

      setFilteredPastGames(processedPastGames);
      console.log("processed past games:", processedPastGames);
    }

    processPastGames();
  }, [apiPastGames, type]);

  // useEffect(() => {
  //   // Don't run if not "games" view
  //   if (type !== "game") return;
  //   const today = new Date();
  //   today.setHours(0, 0, 0, 0);

  //   const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000; // Past games = strictly before today and NO older than 7 days from today

  //   const past7 = myGame.filter((g) => {
  //     if (!g.timeFormatted) return false;
  //     const gameDate = new Date(g.timeFormatted);
  //     return (
  //       gameDate < today &&
  //       gameDate >= new Date(today.getTime() - SEVEN_DAYS_MS)
  //     );
  //   });

  //   setFilteredPastGames(past7);
  //   console.log("past 7 days games:", past7);
  // }, [myGame, type]);

  // In ChatList.tsx - Add this function before the return statement
  const fetchLatestMessageTime = async (
    roomName: string,
    type: "buddy" | "game" | "tribe",
    id: string
  ) => {
    try {
      // This would require an API call to get the latest message timestamp
      // For now, using current time as placeholder
      const currentTime = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      if (type === "buddy") {
        setBuddyTimestamps((prev) => ({ ...prev, [id]: currentTime }));
      } else if (type === "game") {
        setGameTimestamps((prev) => ({ ...prev, [id]: currentTime }));
      } else if (type === "tribe") {
        setTribeTimestamps((prev) => ({ ...prev, [id]: currentTime }));
      }
    } catch (error) {
      console.error("Error fetching latest message time:", error);
    }
  };

  return (
    <>
      <div className="pb-18  overflow-y-auto" style={{height : 'calc(100vh - 265px)'}} >
        {type === "buddy" && (
          <>
            <ChatCard
              label="Pending Requests"
              onClick={() => setShowPending(true)}
              count={pendingRequestsCount > 0 ? pendingRequestsCount : 0}
              time=""
              icon={<MessageIcon />}
              alwaysShowCount
            />
            {buddies.map((user) => (
              // In ChatList.tsx - Replace buddy ChatCard with dynamic time
              // In ChatList.tsx - Replace buddy ChatCard icon with avatar
              <ChatCard
                key={user.name}
                label={user.name}
                count={user.count}
                time=""
                message={user.message}
                onClick={() => {
                  onOpenChat(user.id);
                  setPastGames(false);
                }}
                icon={
                  <img
                    src={
                      buddyAvatars[user.id] ||
                      "https://randomuser.me/api/portraits/men/78.jpg"
                    }
                    alt={user.name}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                }
              />
            ))}
          </>
        )}

        {showPending && (
          <PendingRequests onClose={() => setShowPending(false)} />
        )}

        {type === "game" && (
          <>
            <ChatCard
              label="Past Games"
              onClick={() => setPastGames((prev) => !prev)}
              count=""
              time=""
              message="Messages will expire in 7days"
              icon={<MessageIcon />}
            />
            {myGame.length === 0 ? (
              <div className="text-sm text-gray-500 p-4">No games found</div>
            ) : (
              myGame
                .slice() // clone array
                .sort(
                  (a, b) =>
                    new Date(b.timeFormatted).getTime() -
                    new Date(a.timeFormatted).getTime()
                )
                // .filter((group) => {
                //   // Only show non-past games when not in "pastGames" mode
                //   if (!pastGames) {
                //     const today = new Date();
                //     today.setHours(0, 0, 0, 0);
                //     return (
                //       !group.timeFormatted ||
                //       new Date(group.timeFormatted) >= today
                //     );
                //   }
                //   return false;
                // })
                .filter((group) => {
                  if (!pastGames) {
                    return true;
                  }
                  return false;
                })
                .map((group) => (
                  // In ChatList.tsx - Replace game ChatCard with dynamic time
                  <ChatCard
                    key={group.gameId}
                    label={group.sport}
                    count={0}
                    time={gameTimestamps[group.gameChatId]}
                    message={group.message}
                    onClick={() => {
                      setChatName(group.sport.split(" - ")[0]);
                      setTimeout(() => {
                        console.log("timeout");
                        console.log(
                          "Clicked on game for session",
                          group.gameId
                        );

                        sessionStorage.setItem("gameId", group.gameId);
                        sessionStorage.setItem("newGameIdDirect", group.gameId);
                        localStorage.setItem("newGameDetail", group.gameId);
                        onOpenChat(group.gameChatId);
                      }, 0);

                      setPastGames(false);
                    }}
                    icon={
                      <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-700">
                        {group.sport[0]}
                      </div>
                    }
                    subtext={group.members}
                  />
                ))
            )}
          </>
        )}

        {pastGames && (
          <PastGames
            onOpenChat={handleOpenChat}
            onClose={() => {
              setActiveChatId(null);
              setPastGames(false);
            }}
            pastGames={filteredPastGames}
          />
        )}

        {type === "tribe" && (
          <>
            {/* <ChatCard label="My Tribes" count={2} time="Today" /> */}
            {mySport.map((tribe) => (
              // In ChatList.tsx - Replace tribe ChatCard with dynamic time
              <ChatCard
                key={tribe.name}
                label={tribe.name}
                count={0}
                time={tribeTimestamps[tribe.sportChatId] || tribe.time}
                message={tribe.message}
                onClick={() => {
                  setChatName(tribe.name);
                  setTimeout(() => {
                    console.log("timeout");
                    onOpenChat(tribe.sportChatId);
                  }, 0);

                  setPastGames(false);
                }}
                icon={
                  <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-700">
                    {tribe.name[0]}
                  </div>
                }
                subtext={tribe.members}
              />
            ))}
          </>
        )}

        {type === "events" && (
          <>
            {[1, 2, 3, 4, 5].map((eventNum) => (
              <ChatCard
                key={`event-${eventNum}`}
                label={`Event ${eventNum}`}
                count={0}
                time=""
                message="Join the event discussion"
                onClick={() => {
                  setChatName(`Event ${eventNum}`);
                  setTimeout(() => {
                    console.log("timeout");
                    onOpenChat(`EVENT_${eventNum}`);
                  }, 0);
                  setPastGames(false);
                }}
                icon={
                  <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-700">
                    🎪
                  </div>
                }
                subtext="Event discussion"
              />
            ))}
          </>
        )}

        {(type === "fitness" ||
          type === "wellness" ||
          type === "sports" ||
          type === "nutrition") && (
          <ChatCard
            key={singleRoomData?.chatId || `${type}-room`}
            label={
              singleRoomData?.displayName ||
              `${type.charAt(0).toUpperCase() + type.slice(1)} Room`
            }
            count={0}
            time=""
            message={`${type.charAt(0).toUpperCase() + type.slice(1)} room`}
            onClick={() => {
              const displayName =
                singleRoomData?.displayName ||
                `${type.charAt(0).toUpperCase() + type.slice(1)} Room`;
              const chatId =
                singleRoomData?.chatId || `${type.toUpperCase()}_ROOM`;
              setChatName(displayName);
              setTimeout(() => {
                console.log("timeout");
                onOpenChat(chatId);
              }, 0);
              setPastGames(false);
            }}
            icon={
              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-700">
                {singleRoomData?.displayName?.[0] || type[0].toUpperCase()}
              </div>
            }
            subtext={`${
              type.charAt(0).toUpperCase() + type.slice(1)
            } discussion`}
          />
        )}

        {activeChatId && (
          <ChatRoom
            chatId={activeChatId}
            goBack={() => setActiveChatId(null)}
            type={type}
            roomName={`${activeChatId}`}
            chatNames={chatName}
          />
        )}
      </div>
    </>
  );
}
