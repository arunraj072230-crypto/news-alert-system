import {useState} from "react";
import { useNavigate } from "react-router-dom";
import { enablePushNotifications } from "../pushNotifications";


function Dashboard({ setActivePage, activePage, handleLogout }) {

  const [showSettings, setShowSettings] = useState(false);
  const navigate = useNavigate();
  const handleEnableNotifications = async () => {
  try {
    const message = await enablePushNotifications();
    alert(message);
  } catch (error) {
    alert(error.message || "Failed to enable notifications.");
  }
};

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">🔔</div>

        <div>
          <h2>News Alert</h2>
          <span>System</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className={activePage === "dashboard" ? "nav-item active" : "nav-item"}
          onClick={() => setActivePage("dashboard")}>
          <span>▣</span>
          Dashboard
        </div>

        <div className="nav-item auth-nav-item" 
           onClick={() => (navigate("/login"))}>
          <span>🔑</span>
          Login
        </div>

        <div className="nav-item auth-nav-item" 
           onClick={() => (navigate("/register"))}>
          <span>👤</span>
          Register
        </div>

        <div className="nav-item" onClick={() => setShowSettings(!showSettings)}>
         <span>☷</span>
          Settings
        </div>

       
{showSettings && (
  <>
    <div className={activePage === "preferences" ? "nav-item active" : "nav-item"}
      onClick={() => setActivePage("preferences")}>
      <span>⚙</span>
       Preferences
    </div>

    <div className={activePage === "notifications" ? "nav-item active" : "nav-item"}
      onClick={() => setActivePage("notifications")}>
      <span>♧</span>
      Notifications
    </div>
  </>
)}  

<button
  type="button"
  onClick={handleEnableNotifications}
  className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
>
  Enable Notifications
</button>

 <button type="button" onClick={handleLogout} className="nav-item"> 🚪 Logout</button>

      </nav>
    </aside>
  );
}

export default Dashboard;