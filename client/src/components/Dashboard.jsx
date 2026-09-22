import {useState} from "react";

function Dashboard({ setActivePage, activePage }) {

  const [showSettings, setShowSettings] = useState(false);

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
      </nav>
    </aside>
  );
}

export default Dashboard;