import { FaRegUserCircle } from "react-icons/fa";
import "./styles.css";
// import { DEFAULT_ICON_SIZE } from "../../default";
import { useContext, useState } from "react";
// import UserModal from "../UserModal/UserModal";
import type { AxiosResponse } from "axios";
// import { getImagesById } from "../../api/images";
import { enqueueSnackbar } from "notistack";
import { TbMessage } from "react-icons/tb";
import { ClientIdContext } from "../main";
import axios from "axios";


const NavForge = () => {
  // Remove useLocation, useNavigate, and 'currentPath' logic
  const [profileModal, setProfileModal] = useState(false);
  const [profilePic, setProfilePic] = useState<string | null>(null);
const clientId = useContext(ClientIdContext);
const [name, setName] = useState("");

const userName = async() => {
    const res = await axios.get(`https://play-os-backend.forgehub.in/human/${clientId}`);
    const displayName = res.data.name;
    setName(displayName);
}

userName();

  const getProfilePhoto = () => {
    const onAccept = (response: AxiosResponse) => {
      if (response.status === 200) {
        console.log("Response received:", response.data);
        if (response.data !== null) {
          setProfilePic(response.data);
          console.log("Profile photo fetched successfully:", response.data);
        } else {
          console.error("No image found for the user");
          return null;
        }
      } else {
        console.error("Failed to fetch profile photo");
        return null;
      }
    };
    const onReject = (error: unknown) => {
      console.error("Error fetching profile photo:", error);
      return null;
    };

    const userId = localStorage.getItem("userId");
    if (!userId) {
      enqueueSnackbar("User ID not found", {
        variant: "error",
        autoHideDuration: 3000,
      });
      return;
    }
    // getImagesById(onAccept, onReject, userId);
  };

  // You can call getProfilePhoto on mount if needed, or remove useEffect entirely
  // useEffect(() => {
  //   getProfilePhoto();
  // }, []);

  return (
    <div className="top-nav-container">
      <div className="nav-left">
        <div
          className="--logo"
          // Just keep a static click event or remove if not needed
        >
          <img src="Play_Logo.svg" alt="Logo" />
        </div>
        <div className="--center">
          <span>Sarjapur</span>
        </div>
      </div>
      <div className="nav-right">
        {/* <TbMessage
          // size={DEFAULT_ICON_SIZE}
          style={{ fontSize: "30px", color: "black" }}
          // Keep onClick logic or set to a static action if needed
          onClick={() => {
            const userId = localStorage.getItem("userId")?.replace(/^"|"$/g, "");
            window.location.href = `https://chatapp.forgehub.in/?clientId=${userId}`;
          }}
        /> */}
        <span className="--username">
          {name}
        </span>
        <div
          className="--icon"
          onClick={() => setProfileModal(!profileModal)}
        >
          {profilePic ? (
            <img
              src={profilePic}
              alt="Profile"
              className="profile-icon"
              // onClick={getProfilePhoto}
            />
          ) : (
            <FaRegUserCircle size={30} />
          )}
        </div>
      </div>
      {/* {profileModal && <UserModal modal={setProfileModal}></UserModal>} */}
    </div>
  );
};

export default NavForge;
