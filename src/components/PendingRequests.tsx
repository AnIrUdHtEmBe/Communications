import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import ChatCard from "./ChatCard";
import { ClientIdContext } from "../main";
import { API_BASE_URL } from "./ApiBaseUrl";

interface Notification {
  id: number; // keep index or unique key for React rendering
  userId: string; // actual user id string
  text: string;
  actions: string[];
}

interface PendingProps {
  onClose: () => void;
}

const PendingRequests = ({ onClose }: PendingProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const clientId = useContext(ClientIdContext);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/human/${clientId}`);
      console.log("pending api req", response.data);

      const pendingRequests: string[] = response.data.pendingRequest || [];
      console.log("pending req", pendingRequests);

      // Map to an array of Promises and await them all before setting state
      const updatedNotifications = await Promise.all(
        pendingRequests.map(async (req: string, index: number) => {
          const humanNameRes = await axios.get(`${API_BASE_URL}/human/${req}`);
          const name = humanNameRes.data.name;

          return {
            id: index, // unique React key
            userId: req, // real user ID string to use in accept API
            text: `${name} has sent a friend request`,
            actions: ["Accept", "Decline"],
          };
        })
      );

      setNotifications(updatedNotifications);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

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
      setNotifications((prev) =>
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
      console.log("Deleted user response:", response.data);

      // Optionally, update local notifications state to remove accepted user
      setNotifications((prev) =>
        prev.filter((notif) => notif.userId !== userIdToAdd)
      );
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center backdrop-blur-sm z-50"
      onClick={onClose} // clicking outside closes modal
    >
      <div
        className="relative bg-white bg-opacity-20 text-white rounded-lg shadow-lg w-[350px] max-w-full pb-6"
        onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside modal
      >
        {/* Header bar with fixed height */}
        <div className="relative bg-black rounded-t-lg">
          {/* Close button hanging above top right corner */}
          <button
            onClick={onClose}
            className="absolute -top-2 -right-1 bg-white rounded-full px-2  shadow-lg text-black text-2xl font-bold hover:text-gray-700 focus:outline-none z-10"
            aria-label="Close"
          >
            &times;
          </button>

          <div className="flex justify-center p-2 font-semibold text-lg">
            Pending Requests
          </div>
        </div>

        {/* Content below header */}
        {notifications.map((n) => (
          <ChatCard
            key={n.id}
            label={n.text}
            count={1}
            time=""
            onClick={() => console.log("ChatCard clicked", n.userId)}
            actions={n.actions}
            onAccept={() => acceptNotification(n.userId)}
            onDecline={() => deleteNotification(n.userId)}
          />
        ))}

        {notifications.length === 0 && (
          <div className="text-black font-semibold flex justify-center mt-3">
            You have no pending requests
            </div>
          )}
      </div>
    </div>
  );
};

export default PendingRequests;
