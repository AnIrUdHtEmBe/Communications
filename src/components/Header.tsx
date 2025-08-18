import { ChevronLeft } from "lucide-react";
import NotificationBell from "./NotificationBell";
import { useRef, useEffect } from "react";

interface HeaderProps {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  onBackClick?: () => void;
  showBackButton?: boolean;
  title?: string;
  showNotifications?: () => void;
  isNotificationsOpen?: boolean;
  hasUrlParams?: boolean;
  urlRoomType?: string;
}

const getTabsArray = (hasUrlParams: boolean, urlRoomType?: string) => {
  const baseTabs = ["My Buddy", "My Game", "My Tribe", "Events", "RM"];
  
  if (hasUrlParams && urlRoomType) {
    const roomTypeTab = urlRoomType.charAt(0) + urlRoomType.slice(1).toLowerCase();
    return ["My Buddy", "My Tribe", "Events", "Fitness", "Wellness", "Sports", "Nutrition", "RM"];
  }
  
  return [...baseTabs, "Fitness", "Wellness", "Sports", "Nutrition"];
};

export default function Header({
  activeTab,
  setActiveTab,
  showBackButton = true,
  onBackClick,
  title = "Communications",
  showNotifications,
  isNotificationsOpen,
  hasUrlParams = false,
  urlRoomType,
}: HeaderProps) {
  const tabs = getTabsArray(hasUrlParams, urlRoomType);
  console.log("Render NotificationBell for tab:", activeTab);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);

  // Auto-scroll to active tab
  useEffect(() => {
    if (activeTabRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const activeButton = activeTabRef.current;
      
      const containerRect = container.getBoundingClientRect();
      const buttonRect = activeButton.getBoundingClientRect();
      
      const isButtonVisible = 
        buttonRect.left >= containerRect.left && 
        buttonRect.right <= containerRect.right;
      
      if (!isButtonVisible) {
        const scrollLeft = activeButton.offsetLeft - (container.offsetWidth / 2) + (activeButton.offsetWidth / 2);
        container.scrollTo({
          left: scrollLeft,
          behavior: 'smooth'
        });
      }
    }
  }, [activeTab]);

  return (
    <div className="p-1 fixed mt-13 top-0 w-full z-50 bg-gray-100 shadow-md rounded-b-2xl ">
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
        <div 
          ref={scrollContainerRef}
          className="flex gap-6 items-center overflow-x-auto scrollbar-hide flex-1 mr-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {/* <style jsx>{`
            .scrollbar-hide::-webkit-scrollbar {
              display: none;
            }
          `}</style> */}
          {tabs.map((tab) => (
            <button
              key={tab}
              ref={activeTab === tab ? activeTabRef : null}
              onClick={() => setActiveTab?.(tab)}
              className={`text-sm font-bold px-3 pb-2 border-b-4 transition-all duration-200 whitespace-nowrap flex-shrink-0
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
          className={`transition-all duration-200 pb-2 border-b-4 left-4 top-1 flex-shrink-0 ${
            isNotificationsOpen ? "border-black" : "border-transparent"
          }`}
        />
      </div>
    </div>
  );
}