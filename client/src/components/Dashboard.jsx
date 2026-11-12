import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { disablePushNotifications, enablePushNotifications } from "../pushNotifications";

function Dashboard({ setActivePage, activePage, handleLogout, user }) {
  const [showSettings, setShowSettings] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    async function checkSubscription() {
      try {
        if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
        const registration = await navigator.serviceWorker.getRegistration();
        const subscription = registration
          ? await registration.pushManager.getSubscription()
          : null;
        if (active) setNotificationsEnabled(Boolean(subscription));
      } catch (error) {
        console.error("Push subscription status error:", error);
      }
    }
    checkSubscription();
    return () => { active = false; };
  }, []);

  const handleToggleNotifications = async () => {
    setPushBusy(true);
    try {
      if (notificationsEnabled) {
        await disablePushNotifications();
        setNotificationsEnabled(false);
        alert("Push notifications disabled successfully.");
      } else {
        const message = await enablePushNotifications();
        setNotificationsEnabled(true);
        alert(message);
      }
    } catch (error) {
      alert(error.message || "Failed to update push notifications.");
    } finally {
      setPushBusy(false);
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">🔔</div>
        <div><h2>News Alert</h2><span>System</span></div>
      </div>

      <nav className="sidebar-nav" aria-label="Main navigation">
        <button type="button" className={activePage === "dashboard" ? "nav-item active" : "nav-item"} 
           onClick={() => setActivePage("dashboard")}>
          <span>▣</span> Dashboard
        </button>

        {user ? (
          <>
            <button type="button" className="nav-item" onClick={() => setShowSettings((value) => !value)}>
              <span>☷</span> Settings
            </button>
            {showSettings && (
              <>
                <button type="button" className={activePage === "preferences" ? "nav-item active" : "nav-item"} onClick={() => setActivePage("preferences")}>
                  <span>⚙</span> Preferences
                </button>
                <button type="button" className={activePage === "notifications" ? "nav-item active" : "nav-item"} onClick={() => setActivePage("notifications")}>
                  <span>♧</span> Notifications
                </button>
              </>
            )}
            <button type="button" className="nav-item" onClick={handleToggleNotifications} disabled={pushBusy}>
              <span>🔔</span> {pushBusy ? "Please wait..." : notificationsEnabled ? "Disable Notifications" : "Enable Notifications"}
            </button>
            <button type="button" className="nav-item" onClick={handleLogout}><span>🚪</span> Logout</button>
          </>
        ) : (
          <>
            <button type="button" className="nav-item" onClick={() => navigate("/login")}><span>🔑</span> Login</button>
            <button type="button" className="nav-item" onClick={() => navigate("/register")}><span>👤</span> Register</button>
          </>
        )}
      </nav>

      {user && (
        <div className="sidebar-bottom">
          <div className="user-profile">
            <div className="user-avatar">{(user.name || user.email || "U").charAt(0).toUpperCase()}</div>
            <div className="user-info"><strong>{user.name || "User"}</strong><span>{user.email || ""}</span></div>
          </div>
        </div>
      )}
    </aside>
  );
}

export default Dashboard;
