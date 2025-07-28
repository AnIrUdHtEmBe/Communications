import { ChevronLeft } from "lucide-react";
import NotificationBell from "./NotificationBell";

interface HeaderProps {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  onBackClick?: () => void;
  showBackButton?: boolean;
  title?: string;
  showNotifications?: () => void;
  isNotificationsOpen?: boolean; // ← NEW
}

const tabs = ["My Buddy", "My Game", "My Tribe"];

export default function Header({
  activeTab,
  setActiveTab,
  showBackButton = true,
  onBackClick,
  title = "Communications",
  showNotifications,
  isNotificationsOpen,
}: HeaderProps) {
  console.log("Render NotificationBell for tab:", activeTab);

  return (
    <div className="p-1 fixed top-0 w-full z-50 bg-gray-100 shadow-md rounded-b-2xl ">
      {/* Top Row with Back & Title */}
      <div className="flex items-center px-4 py-8 font-bold">
        {showBackButton ? (
          <button onClick={onBackClick} className="mr-2">
            <ChevronLeft className="h-6 w-6 text-gray-700" />
          </button>
        ) : (
          <div className="mr-2 w-6" /> // placeholder
        )}
        <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
      </div>

      {/* Tabs */}
<div className="flex justify-between items-center px-8 pb-2">
  <div className="flex gap-6 items-center">
    {tabs.map((tab) => (
      <button
        key={tab}
        onClick={() => setActiveTab?.(tab)}
        className={`text-sm font-bold px-3 pb-2 border-b-4 transition-all duration-200
          ${
            // Show underline only if notifications NOT open AND this tab is active
            !isNotificationsOpen && activeTab === tab
              ? "border-black text-black"
              : "border-transparent text-gray-700 hover:border-black hover:text-black"
          }
        `}
      >
        {tab.replace(/^My\s*/, '')}
      </button>
    ))}
  </div>
  

  <NotificationBell
    hasNotification={false}
    onClick={showNotifications}
    className={`transition-all duration-200 pb-2 border-b-4 left-4 top-1 ${
      isNotificationsOpen ? "border-black" : "border-transparent"
    }`}
  />
</div>

    </div>
  );
}
