import { useEffect, useState } from "react";
import axios from "axios";
import Dashboard from "./components/Dashboard";
import "./App.css";

function App() {
  const categories = [
    "technology",
    "sports",
    "business",
    "politics",
    "science",
    "health",
    "entertainment",
  ];

  const [selectedCategories, setSelectedCategories] = useState([]);
  const [news, setNews] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [frequency, setFrequency] = useState("immediate");
  const [email, setEmail] = useState("");
  const [notificationTypes, setNotificationTypes] = useState({
      email: true,
       push: false,
     });
  const [isEditing, setIsEditing] = useState(false);
  const [search, setSearch] = useState("");
  const [activePage, setActivePage] = useState("dashboard");
  
  const fetchNewsForCategories = async (categories) => {
    try {
      const requests = categories.map((category) =>
        axios.get(
          `http://localhost:5000/api/news?category=${category}`
        )
      );

      const responses = await Promise.all(requests);

      const allArticles = responses.flatMap(
        (response) => response.data.articles || []
      );

      setNews(allArticles);
    } catch (error) {
      console.error("News fetch error:", error);
    }
  };

  useEffect(() => {
  const loadNotifications = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/notifications"
      );

      setNotifications(response.data);
    } catch (error) {
      console.error(
        "Load notifications error:",
        error
      );
    }
  };

  loadNotifications();
}, []);

useEffect(() => {
  if (!search.trim()) {
    return;
  }

  const searchNews = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/news?category=${search}`
      );

      setNews(response.data.articles || []);
    } catch (error) {
      console.error("Search news error:", error);
    }
  };

  searchNews();
}, [search]);

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/preferences"
        );

        const savedEmail = response.data.email || "";
        const savedCategories =
          response.data.categories || [];
        const savedFrequency =
          response.data.frequency || "immediate";

        setEmail(savedEmail);
        setSelectedCategories(savedCategories);
        setFrequency(savedFrequency);
        setNotificationTypes(
         response.data.notificationTypes || {
          email: true,
          push: false,
          }
          );

        if (savedCategories.length > 0) {
          fetchNewsForCategories(savedCategories);
        }
      } catch (error) {
        console.error("Load preferences error:", error);
      }
    };

    loadPreferences();
  }, []);

  const handleCategoryChange = async (category) => {
    let updatedCategories;

    if (selectedCategories.includes(category)) {
      updatedCategories = selectedCategories.filter(
        (item) => item !== category
      );
    } else {
      updatedCategories = [
        ...selectedCategories,
        category,
      ];
    }

    setSelectedCategories(updatedCategories);

    if (updatedCategories.length === 0) {
      setNews([]);
      return;
    }

    fetchNewsForCategories(updatedCategories);
  };

  const savePreferences = async () => {
    try {
      const response = await axios.post(
        "http://localhost:5000/api/preferences",
        {
          email: email,
          categories: selectedCategories,
          frequency: frequency,
          notificationTypes: notificationTypes,
        }
      );

      console.log("Preferences saved:", response.data);

      alert("Preferences saved successfully!");
    } catch (error) {
      console.error("Save preferences error:", error);

      alert("Failed to save preferences");
    }
  };

  return (
    <div className="min-h-screen flex bg-[#f4f7fb]">

      <Dashboard setActivePage={setActivePage} activePage={activePage} />

      <main className="main-content">

      {activePage === "notifications" ? (
    <div className="preferences-card">
      <div className="card-header">
        <h2>Recent Notifications</h2>
      </div>

      {notifications.length === 0 ? (
        <p>No notifications yet.</p>
      ) : (notifications.map((notification) => (
          <div key={notification._id} className="notification-item">
            <h3>{notification.title}</h3>
            <p>{notification.message}</p>

            <small>
              {notification.category} •{" "}
              {new Date(notification.createdAt).toLocaleString()}
            </small>
          </div>
        ))
      )}
    </div>

) : activePage === "preferences" ? (

  <div className="preferences-card">

    <div className="card-header">
      <h2>My Preferences</h2>
     <button className="edit-button" onClick={() =>setIsEditing(!isEditing)}>✎ Edit</button>
    </div>

    <div className="preference-item">
      <div className="preference-icon">✉</div>

     <div>
      <strong>Email Address</strong>
      <input type="email" value={email} placeholder="Enter your email" disabled={!isEditing}
          onChange={(e) => setEmail(e.target.value)}/>
      </div>
    </div>

    <div className="preference-item">
      <div className="preference-icon">▦</div>

      <div>
        <strong>News Categories</strong>
      <div className="category-checkboxes">
        {categories.map((category) => (
           <label key={category}>
           <input type="checkbox" checked={selectedCategories.includes(category)}
             disabled={!isEditing} onChange={() => handleCategoryChange(category)}/>
              {category}
            </label>
          ))}
        </div>
      </div>
    </div>

    <div className="preference-item">
      <div className="preference-icon">◷</div>

      <div>
        <strong>Alert Frequency</strong>
        <div className="frequency-section">
          <label>
            <input type="radio" name="preference-frequency" value="immediate"
              checked={frequency === "immediate"} disabled={!isEditing}
              onChange={(e) => setFrequency(e.target.value)}/>
              Immediate
              </label>

          <label>
            <input type="radio" name="preference-frequency" value="hourly"
              checked={frequency === "hourly"} disabled={!isEditing}
              onChange={(e) => setFrequency(e.target.value)}/>
             Hourly
          </label>

          <label>
            <input type="radio" name="preference-frequency"value="daily"
              checked={frequency === "daily"}disabled={!isEditing} 
              onChange={(e) => setFrequency(e.target.value)}/>
            Daily
          </label>

        </div>
      </div>
    </div>

    <div className="preference-item">
      <div className="preference-icon">🔔</div>

      <div>
        <strong>Notification Type</strong>
        <div>

          <label>
            <input type="checkbox" checked={notificationTypes.email} disabled={!isEditing}
             onChange={(e) =>setNotificationTypes({
                  ...notificationTypes,email: e.target.checked,})}/>
            Email
          </label>

          <label>
            <input type="checkbox" checked={notificationTypes.push} disabled={!isEditing}
              onChange={(e) => setNotificationTypes({
                 ...notificationTypes, push: e.target.checked})}/>
             Push
            </label>
        </div>
      </div>
    </div>
    
    <button className="save-button" onClick={savePreferences}>Save Preferences</button>
  </div>

  ) : (
    <>
      <header className="top-bar">
       <div className="search-box">
            🔍
        <input type="text" placeholder="Search news..."
            value={search} onChange={(e) => setSearch(e.target.value)}/> 
          </div>

          <div className="top-right">
            <span className="notification-icon">🔔</span>
            <span className="date">
              {new Date().toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        </header>

        <section className="welcome-section">
          <h1>Welcome back, User!</h1>
          <p> Here's your news alert summary and latest updates.</p>
        </section>

        <section className="summary-grid">
          <div className="summary-card">
            <div className="summary-icon blue"> ✉ </div>
            <div>
              <span>Email Address</span>
              <strong>{email || "Not set"}</strong>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-icon green">▦</div>
            <div>
              <span>Selected Categories</span>
              <strong>{selectedCategories.length} categories</strong>
              <small>
                {selectedCategories.length > 0 ? selectedCategories.join(", ")
                  : "No categories selected"}
              </small>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-icon purple"> ◷ </div>
          <div>
              <span>Alert Frequency</span>
              <strong>
                {frequency.charAt(0).toUpperCase() + frequency.slice(1)}
              </strong>
              <small>Get news as it happens</small>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-icon red">🔔 </div>
            <div>
              <span>Notification Type</span>
              <strong>Email</strong>
              <small>Delivered to your inbox</small>
            </div>
          </div>
        </section>
 
        <section className="content-grid">

        <div className="news-card">
          <div className="card-header">
            <h2>Latest News</h2>
            <span className="view-all"> View All → </span>
            </div>

    <div className="news-list">
    
        {news.length === 0 ? (
          <div className="no-news">
              <div>📰</div>
                <p> Select a news category to see the latest news.</p>
                </div>
         ) : (
           news.map((article, index) => (
            <article className="news-item" key={index}>
               {article.urlToImage && (
                      <img src={article.urlToImage} alt=""/>)}

             <div className="news-details">
               <span className="news-category">News</span>
                 <h3>{article.title}</h3>
                  <p>{article.description}</p>
                      <small>
                        {article.publishedAt
                          ? new Date(
                              article.publishedAt
                            ).toLocaleString()
                          : ""}
                      </small>

             <a href={article.url} target="_blank" rel="noreferrer">Read Full News →</a>
                    </div>
                  </article>
                ))
              )}

            </div>
          </div>
        </section>
  </>
  )}
      </main>
    </div>
  );
}

export default App;