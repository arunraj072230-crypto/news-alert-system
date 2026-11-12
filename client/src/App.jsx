import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import Dashboard from "./components/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL;
const CATEGORIES = [
  "technology",
  "sports",
  "business",
  "politics",
  "science",
  "health",
  "entertainment",
];
const DEFAULT_NOTIFICATION_TYPES = { email: true, push: false };

function readStoredUser() {
  try {
    const value = sessionStorage.getItem("user");
    return value ? JSON.parse(value) : null;
  } catch {
    sessionStorage.removeItem("user");
    return null;
  }
}

function App() {
  const navigate = useNavigate();
  const [user, setUser] = useState(readStoredUser);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const selectedCategoriesRef = useRef([]);
  const [news, setNews] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [frequency, setFrequency] = useState("immediate");
  const [email, setEmail] = useState(user?.email || "");
  const [notificationTypes, setNotificationTypes] = useState(DEFAULT_NOTIFICATION_TYPES);
  const [isEditing, setIsEditing] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [search, setSearch] = useState("");
  const [activePage, setActivePage] = useState("dashboard");
  const [pageError, setPageError] = useState("");

  useEffect(() => {
    selectedCategoriesRef.current = selectedCategories;
  }, [selectedCategories]);

  const authHeaders = useCallback(() => {
    const token = sessionStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const fetchNewsForCategories = useCallback(async (categoryList) => {
    if (!API_URL || categoryList.length === 0) {
      setNews([]);
      return;
    }

    try {
      const responses = await Promise.all(
        categoryList.map((category) =>
          axios.get(`${API_URL}/api/news`, {
            params: { category, skipAlerts: "true" },
          })
        )
      );
      const articles = responses.flatMap((response) => response.data.articles || []);
      const uniqueArticles = Array.from(
        new Map(articles.filter((article) => article.url).map((article) => [article.url, article])).values()
      );
      setNews(uniqueArticles);
      setPageError("");
    } catch (error) {
      console.error("News fetch error:", error);
      setPageError(error.response?.data?.message || "Unable to load news. Please try again.");
    }
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/api/notifications`, {
        headers: authHeaders(),
      });
      setNotifications(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Load notifications error:", error.response?.data || error.message);
    }
  }, [authHeaders]);

  useEffect(() => {
    let cancelled = false;

    async function loadUserData() {
      const token = sessionStorage.getItem("token");
      if (!token) return;

      try {
        const response = await axios.get(`${API_URL}/api/preferences`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (cancelled) return;

        const savedCategories = Array.isArray(response.data.categories)
          ? response.data.categories
          : [];
        setEmail(response.data.email || user?.email || "");
        setSelectedCategories(savedCategories);
        setFrequency(response.data.frequency || "immediate");
        setNotificationTypes({
          ...DEFAULT_NOTIFICATION_TYPES,
          ...(response.data.notificationTypes || {}),
        });
        if (savedCategories.length) fetchNewsForCategories(savedCategories);
        await loadNotifications();
      } catch (error) {
        console.error("Load user data error:", error.response?.data || error.message);
        if (error.response?.status === 401) {
          sessionStorage.removeItem("token");
          sessionStorage.removeItem("user");
          setUser(null);
          navigate("/login", { replace: true });
        }
      }
    }

    loadUserData();
    return () => {
      cancelled = true;
    };
  }, [fetchNewsForCategories, loadNotifications, navigate, user?.email]);

  useEffect(() => {
    if (!API_URL || !sessionStorage.getItem("token")) return undefined;

    const socket = io(API_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
    });

    const handleNewsUpdate = ({ category, articles }) => {
      if (!category || !Array.isArray(articles) || articles.length === 0) return;
      if (!selectedCategoriesRef.current.includes(category)) return;

      setNews((current) => {
        const byUrl = new Map(current.filter((item) => item.url).map((item) => [item.url, item]));
        articles.forEach((article) => {
          if (article?.url) byUrl.set(article.url, article);
        });
        return Array.from(byUrl.values()).sort(
          (a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0)
        );
      });
    };

    socket.on("newsUpdate", handleNewsUpdate);
    socket.on("notificationUpdate", loadNotifications);
    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error.message);
    });

    return () => {
      socket.off("newsUpdate", handleNewsUpdate);
      socket.off("notificationUpdate", loadNotifications);
      socket.disconnect();
    };
  }, [loadNotifications]);

  useEffect(() => {
    const query = search.trim();
    if (!query) return undefined;

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const response = await axios.get(`${API_URL}/api/news`, {
          params: { category: query, skipAlerts: "true" },
        });
        if (!cancelled) setNews(response.data.articles || []);
      } catch (error) {
        if (!cancelled) {
          console.error("Search news error:", error);
          setPageError(error.response?.data?.message || "News search failed.");
        }
      }
    }, 400);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [search, selectedCategories, fetchNewsForCategories]);

  const handleCategoryChange = (category) => {
    setSelectedCategories((current) => {
      const next = current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category];
      return next;
    });
  };

  const savePreferences = async () => {
    const token = sessionStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    if (!email.trim()) {
      alert("Please enter an email address.");
      return;
    }

    setSavingPreferences(true);
    try {
      await axios.post(
        `${API_URL}/api/preferences`,
        {
          email: email.trim(),
          categories: selectedCategories,
          frequency,
          notificationTypes,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIsEditing(false);
      await fetchNewsForCategories(selectedCategories);
      alert("Preferences saved successfully!");
    } catch (error) {
      console.error("Save preferences error:", error.response?.data || error.message);
      alert(error.response?.data?.message || "Failed to save preferences.");
    } finally {
      setSavingPreferences(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    setUser(null);
    navigate("/login", { replace: true });
  };

  const notificationTypeLabel = [
    notificationTypes.email ? "Email" : null,
    notificationTypes.push ? "Push" : null,
  ].filter(Boolean).join(" + ") || "Disabled";

  return (
    <div className="app-layout">
      <Dashboard setActivePage={setActivePage} activePage={activePage}
        handleLogout={handleLogout} user={user}/>

    <main className="main-content">
       {activePage === "notifications" ? (
       <section className="preferences-card notifications-page">
      <div className="card-header">
       <div>
       <h2>🔔 Recent Notifications</h2>
        <p>Your latest news alerts in one place.</p>
        </div>
        <button className="edit-button" onClick={loadNotifications}>Refresh</button>
        </div>
      <div className="notifications-list">
        {notifications.length === 0 ? (
        <div className="notifications-empty">
          <span>📰</span><h3>No notifications yet</h3>
           <p>Your latest news alerts will appear here.</p>
              </div>
          ) : notifications.map((notification) => (
         <article key={notification._id} className="notification-item">
          <div className="notification-icon">📰</div>
           <div className="notification-content">
          <div className="notification-meta">
           <span className="notification-category">{notification.category || "News"}</span>
          <small>{notification.createdAt ? new Date(notification.createdAt).toLocaleString() : "Date unavailable"}</small>
           </div>
          <h3>{notification.title || "Untitled news"}</h3>
           <p>{notification.message || "No description available."}</p>
            {notification.articleId && (
         <a href={notification.articleId} target="_blank" rel="noopener noreferrer" className="notification-read-link">Read Full News →</a>
          )}
        <small>{notification.notificationType || "Alert"} · {notification.status || "sent"}</small>
              </div>
           </article>
              ))}
            </div>
          </section>
        ) : activePage === "preferences" ? (
      <section className="preferences-card">
        <div className="card-header">
      <div><h2>My Preferences</h2><p>Choose what news you receive and how often.</p></div>
        <button className="edit-button" onClick={() => setIsEditing((value) => !value)}>{isEditing ? "Cancel" : "✎ Edit"}</button>
            </div>
     <div className="preference-item">
       <div className="preference-icon">✉</div>
        <div><strong>Email Address</strong>
      <input type="email" value={email} placeholder="Enter your email" disabled={!isEditing} onChange={(event) => setEmail(event.target.value)} />
        </div>
         </div>
      <div className="preference-item">
       <div className="preference-icon">▦</div>
        <div><strong>News Categories</strong>
         <div className="category-checkboxes">
           {CATEGORIES.map((category) => (
           <label key={category}>
      <input type="checkbox" checked={selectedCategories.includes(category)} disabled={!isEditing} onChange={() => handleCategoryChange(category)} />
          {category}
            </label>
             ))}
          </div>
          </div>
        </div>
       <div className="preference-item">
       <div className="preference-icon">◷</div>
         <div><strong>Alert Frequency</strong>
         <div className="frequency-section">
          {["immediate", "hourly", "daily"].map((value) => (
           <label key={value}>
       <input type="radio" name="preference-frequency" value={value} checked={frequency === value} disabled={!isEditing} onChange={(event) => setFrequency(event.target.value)} />
           {value.charAt(0).toUpperCase() + value.slice(1)}
               </label>
           ))}
           </div>
           </div>
            </div>
      <div className="preference-item">
         <div className="preference-icon">🔔</div>
          <div><strong>Notification Type</strong>
          <div className="frequency-section">
           <label><input type="checkbox" checked={notificationTypes.email} disabled={!isEditing} onChange={(event) => setNotificationTypes((current) => ({ ...current, email: event.target.checked }))} /> Email</label>
             <label><input type="checkbox" checked={notificationTypes.push} disabled={!isEditing} onChange={(event) => setNotificationTypes((current) => ({ ...current, push: event.target.checked }))} /> Push</label>
               </div>
              </div>
            </div>
            {isEditing && (
              <button className="save-button" onClick={savePreferences} disabled={savingPreferences}>
                {savingPreferences ? "Saving..." : "Save Preferences"}
              </button>
            )}
          </section>
        ) : (
       <>
       <header className="top-bar">
       <div className="search-box">🔍
        <input type="search" placeholder="Search news..." value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
        <div className="top-right">
         <button type="button" className="notification-icon" onClick={() => setActivePage("notifications")} aria-label="View notifications">🔔</button>
        <span className="date">{new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
          </div>
           </header>
       <section className="welcome-section">
         <h1>Welcome back, {user?.name || "User"}!</h1>
       <p>Here is your news alert summary and latest updates.</p>
           </section>
           {pageError && <p className="error-message" role="alert">{pageError}</p>}
           <section className="summary-grid">
           <div className="summary-card"><div className="summary-icon blue">✉</div><div><span>Email Address</span><strong>{email || "Not set"}</strong></div></div>
            <div className="summary-card"><div className="summary-icon green">▦</div><div><span>Selected Categories</span><strong>{selectedCategories.length} categories</strong><small>{selectedCategories.length ? selectedCategories.join(", ") : "No categories selected"}</small></div></div>
            <div className="summary-card"><div className="summary-icon purple">◷</div><div><span>Alert Frequency</span><strong>{frequency.charAt(0).toUpperCase() + frequency.slice(1)}</strong><small>{frequency === "daily" ? "Daily at 8:00 AM IST" : frequency === "hourly" ? "Once every hour" : "Checked every 5 minutes"}</small></div></div>
            <div className="summary-card"><div className="summary-icon red">🔔</div><div><span>Notification Type</span><strong>{notificationTypeLabel}</strong><small>Configured delivery methods</small></div></div>
            </section>
         <section className="content-grid">
         <div className="news-card">
        <div className="card-header"><h2>Latest News</h2><span className="view-all">{news.length} articles</span></div>   <div className="news-list">
                  {news.length === 0 ? (
        <div className="no-news"><div>📰</div><p>Select news categories in Preferences to see the latest news.</p></div>
          ) : news.map((article) => (
            <article className="news-item" key={article.url || article.title}>
               {article.urlToImage && <img src={article.urlToImage} alt={article.title || "News image"} loading="lazy" onError={(event) => { event.currentTarget.style.display = "none"; }} />}
            <div className="news-details">
             <span className="news-category">{article.source?.name || "News"}</span>
               <h3>{article.title || "Untitled article"}</h3>
              <p>{article.description || "No description available."}</p>
              <small>{article.publishedAt ? new Date(article.publishedAt).toLocaleString() : ""}</small>
               {article.url && <a href={article.url} target="_blank" rel="noopener noreferrer">Read Full News →</a>}
                     </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function AppRoutes() {
  useLocation(); // Re-render route guards after login/logout navigation.
  const isAuthenticated = Boolean(sessionStorage.getItem("token"));
  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/" replace /> : <Register />} />
      <Route path="/*" element={isAuthenticated ? <App /> : <Navigate to="/login" replace />} />
    </Routes>
  );
}

export default AppRoutes;
