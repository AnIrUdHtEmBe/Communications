import ChatCard from "./ChatCard";

interface PastGamesProps {
  onOpenChat: (id: string) => void;
  onClose?: () => void;
  pastGames?: any;
}

const PastGames = ({ onOpenChat, pastGames }: PastGamesProps) => {
  const gamesToShow = pastGames || []; // fallback to empty array if undefined

  return (
    <div>
      {gamesToShow.map((group: any) => (
        <ChatCard
          key={group.gameId}
          label={group.sport}
          count={0}
          time={group.time}
          message={group.message}
          onClick={() => {onOpenChat(group.gameChatId) 
            console.log(group.gameChatId, "Chatid for past games")}
          }
          icon={
            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-700">
              {group.sport[0]}
            </div>
          }
          subtext={group.members}
        />
      ))}
    </div>
  );
};

export default PastGames;
