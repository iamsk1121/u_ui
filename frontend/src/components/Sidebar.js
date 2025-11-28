import React, { useState } from "react";
import { NavLink,  useLocation } from "react-router-dom";
import { Icons } from "../assets/icons";
import "./Sidebar.css";
import { useTheme } from "../context/ThemeContext";

const Sidebar = () => {
  const [expanded, setExpanded] = useState(false);
  const { menu, chart, analytics, settings, lotstatus, pms } = Icons;

  const location = useLocation();

  const { isDarkMode, toggleTheme } = useTheme();

  const menuItems = [
    { name: "Trend", path: "/trend", icon: chart , disabled: true},
    { name: "Lot Status", path: "/lotstatus", icon: lotstatus , disabled: true},
    { name: "AI Result", path: "/", icon: pms},
    { name: "Analytics", path: "/analytics", icon: analytics , disabled: true},
    { name: "Settings", path: "/settings", icon: settings , disabled: true},
  ];

  return (
    <section id="sidebar" className={expanded ? "expanded" : ""}>
      <div id="sidebar-toggle" onClick={() => setExpanded(!expanded)}>
        {React.createElement(menu)}
      </div>

      <ul>
        {menuItems.map((item) => (
          <li key={item.name}>
            <NavLink
              to={item.path}
              className={({ isActive }) => {
                
                if (
                  item.path === "/" &&
                  (location.pathname === "/" ||
                    location.pathname.startsWith("/pms"))
                ) {
                  return "active";
                }


                return isActive ? "active" : "";
              }}
            >
              {React.createElement(item.icon)}
              <span>{item.name}</span>
            </NavLink>
          </li>
        ))}
      </ul>
      <ul className="side-menu">
        <li>
          <label className="switch-mode" aria-label="Toggle dark mode">
            <input
              type="checkbox"
              checked={isDarkMode}
              onChange={toggleTheme}
            />
            <span className="slider"></span>
          </label>
        </li>
      </ul>
    </section>
  );
};

export default Sidebar;
