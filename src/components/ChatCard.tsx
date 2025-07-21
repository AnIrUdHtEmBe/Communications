import React from "react";
import AcceptButton from "./AcceptButton";
import DeclineButton from "./DeclineButton";

interface ChatCardProps {
  label: string;
  count: number;
  time?: string;
  icon?: React.ReactNode;
  message?: string;
  subtext?: string;
  onClick?: () => void;
  actions?: string[];
  onAccept?: () => void;
  onDecline?: () => void;
  onJoin?: () => void;
  alwaysShowCount?: any;
}

const ChatCard: React.FC<ChatCardProps> = ({
  label,
  count,
  time,
  icon,
  message,
  subtext,
  onClick,
  actions,
  onAccept,
  onDecline,
  onJoin,
  alwaysShowCount
}) => {
  const normalizedActions = actions?.map((a) => a.toLowerCase()) || [];

  return (
    <div className="bg-gray-100 p-4 m-4 shadow rounded cursor-pointer hover:bg-gray-200 transition-colors">
      {/* Top Row: Main Content */}
      <div className="flex items-start justify-between" onClick={onClick}>
        {/* Left: Icon and Text */}
        <div className="flex items-center gap-3">
          {icon ? (
            icon
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
              <span className="text-sm font-semibold text-gray-700">?</span>
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-gray-800 font-medium text-sm">{label}</span>
            {message && (
              <span className="text-gray-600 text-xs max-w-[200px] truncate">
                {message}
              </span>
            )}
            {subtext && (
              <span className="text-gray-500 text-xs max-w-[200px] truncate">
                {subtext}
              </span>
            )}
          </div>
        </div>

        {/* Right: Time and Count */}
        <div className="flex flex-col items-center justify-start min-w-[40px]">
          <span className="text-xs text-gray-500">{time || "\u00A0"}</span>
          <div
            className={`mt-1 ${
              alwaysShowCount || count > 0
                ? "bg-gray-300 text-black"
                : "invisible"
            } text-xs w-5 h-5 font-semibold flex items-center justify-center rounded-full`}
          >
              {alwaysShowCount || count > 0 ? count : "\u00A0"}
          </div>
        </div>
      </div>

      {/* Bottom: Action Buttons */}
      {normalizedActions.length > 0 && (
        <div className="flex gap-2 mt-3 ml-11">
          {normalizedActions.includes("accept") && (
            <AcceptButton onClick={onAccept} />
          )}
          {normalizedActions.includes("decline") && (
            <DeclineButton onClick={onDecline} />
          )}
          {normalizedActions.includes("join") && (
            <button
              onClick={onJoin}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            >
              Join
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatCard;
