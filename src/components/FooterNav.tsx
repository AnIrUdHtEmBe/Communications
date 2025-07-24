
import HomeIcon from "@mui/icons-material/Home";
import PeopleIcon from "@mui/icons-material/People";
import { PiCourtBasketball } from "react-icons/pi";
import { LuPartyPopper } from "react-icons/lu";
import SchoolIcon from "@mui/icons-material/School";
import "./FooterNav.css";
import type { JSX } from "react";

interface FooterItem {
  FooterIcon: JSX.Element;
  FooterLabel: string;
  path: string;
}

const FooterItems: FooterItem[] = [
  {
    FooterIcon: <HomeIcon className="icon" />,
    FooterLabel: "Home",
    path: "/home",
  },
  {
    FooterIcon: <PeopleIcon className="icon" />,
    FooterLabel: "Play",
    path: "/play",
  },
  {
    FooterIcon: <PiCourtBasketball className="icon" />,
    FooterLabel: "Book",
    path: "/book",
  },
  {
    FooterIcon: <LuPartyPopper className="icon" />,
    FooterLabel: "Events",
    path: "/events",
  },
  {
    FooterIcon: <SchoolIcon className="icon" />,
    FooterLabel: "Learn",
    path: "/learn",
  },
];

const FooterNav = () => {
  

  return (
    <div className="footer-main-container">
      {FooterItems.map((item, idx) => (
        <div
          key={idx}
          className="footer-item"
          onClick={() => {
            window.location.href = item.path;
          }}
          style={{ cursor: "pointer" }}
        >
          {item.FooterIcon}
          <span>{item.FooterLabel}</span>
        </div>
      ))}
    </div>
  );
};

export default FooterNav;
