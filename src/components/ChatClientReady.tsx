import { useChatConnection } from "@ably/chat/react";

// Skeleton components
const SkeletonAvatar = () => (
  <div className="w-8 h-8 bg-gray-300 rounded-full animate-pulse"></div>
);

const SkeletonText = ({ width = "w-full" }: { width?: string }) => (
  <div className={`h-4 bg-gray-300 rounded animate-pulse ${width}`}></div>
);

const SkeletonMessage = ({ isOwn = false }: { isOwn?: boolean }) => (
  <div className={`flex gap-3 mb-4 ${isOwn ? 'justify-end' : 'justify-start'}`}>
    {!isOwn && <SkeletonAvatar />}
    <div className={`max-w-xs ${isOwn ? 'order-1' : 'order-2'}`}>
      <div className={`p-3 rounded-lg ${
        isOwn ? 'bg-green-100' : 'bg-gray-100'
      }`}>
        <SkeletonText width="w-20" />
      </div>
      <div className="text-xs text-gray-400 mt-1 text-right">
        <SkeletonText width="w-12" />
      </div>
    </div>
    {isOwn && <SkeletonAvatar />}
  </div>
);

const SkeletonHeader = () => (
  <div className="flex items-center gap-3 p-4 border-b border-gray-200 bg-white">
    <div className="w-6 h-6 bg-gray-300 rounded animate-pulse"></div>
    <SkeletonAvatar />
    <div className="flex-1">
      <SkeletonText width="w-32" />
    </div>
    <div className="w-6 h-6 bg-gray-300 rounded animate-pulse"></div>
  </div>
);

const SkeletonTabs = () => (
  <div className="flex border-b border-gray-200 bg-white px-4">
    {['Tribe', 'Events', 'RM', 'Fitness'].map((tab, index) => (
      <div key={index} className="px-4 py-2">
        <SkeletonText width="w-12" />
      </div>
    ))}
  </div>
);

const SkeletonChatRoom = () => (
  <div className="bg-white">
    <div className="flex items-center gap-3 p-4 border-b border-gray-100">
      <div className="w-4 h-4 bg-gray-300 rounded animate-pulse"></div>
      <SkeletonAvatar />
      <div className="flex-1">
        <SkeletonText width="w-40" />
      </div>
    </div>
    
    <div className="p-4 space-y-4 bg-gray-50 min-h-96">
      {/* Date separator */}
      <div className="text-center">
        <SkeletonText width="w-20 mx-auto" />
      </div>
      
      {/* Chat messages */}
      <SkeletonMessage />
      <SkeletonMessage />
      <SkeletonMessage isOwn={true} />
      <SkeletonMessage />
      <SkeletonMessage />
      
      {/* Context message */}
      <div className="bg-blue-100 p-3 rounded-lg">
        <SkeletonText width="w-48" />
        <SkeletonText width="w-32" />
      </div>
    </div>
    
    {/* Input area */}
    <div className="p-4 bg-white border-t border-gray-200">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-10 bg-gray-100 rounded-full animate-pulse"></div>
        <div className="w-8 h-8 bg-gray-300 rounded-full animate-pulse"></div>
      </div>
    </div>
    
    {/* Bottom navigation */}
    <div className="flex justify-around p-3 bg-black text-white">
      {['Home', 'Play', 'Scan', 'Events', 'Learn'].map((item, index) => (
        <div key={index} className="flex flex-col items-center gap-1">
          <div className="w-6 h-6 bg-gray-600 rounded animate-pulse"></div>
          <SkeletonText width="w-8" />
        </div>
      ))}
    </div>
  </div>
);

export default function ChatClientReady({ children }: { children: React.ReactNode }) {
  const { currentStatus } = useChatConnection();

  if (currentStatus !== "connected") {
    return (
      <div className="max-w-sm mx-auto bg-white min-h-screen mt-8">
        <SkeletonHeader />
        <SkeletonTabs />
        <SkeletonChatRoom />
      </div>
    );
  }

  return <>{children}</>;
}