import { useEffect, useState } from "react";
import { getDonations } from "./api";

const cardStyle = {
  background: "#ffffff",
  borderRadius: "16px",
  padding: "20px",
  marginBottom: "15px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
  border: "1px solid #f0f0f0",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  transition: "transform 0.2s ease"
};

const btnStyle = {
  background: "#2196F3",
  color: "#fff",
  border: "none",
  padding: "10px 18px",
  borderRadius: "10px",
  fontWeight: "600",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  boxShadow: "0 4px 10px rgba(33, 150, 243, 0.2)"
};

export default function Donations() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const donations = await getDonations();
      if (donations) setData(donations);
      setLoading(false);
    };
    loadData();
  }, []);

  const openNavigation = (lat, lng) => {
    if (!lat || !lng) {
      alert("Location coordinates not available for this pickup.");
      return;
    }
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, "_blank");
  };

  if (loading) return <div style={{ textAlign: "center", padding: "40px" }}>⌛ Fetching active pickups...</div>;

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
      <h2 style={{ marginBottom: "20px", fontFamily: "Playfair Display" }}>Active Food Pickups</h2>
      
      {data.length === 0 ? (
        <p style={{ color: "#888" }}>No active donations found at the moment.</p>
      ) : (
        data.map((d) => (
          <div key={d.id} style={cardStyle}>
            <div>
              <h3 style={{ margin: "0 0 5px 0", color: "#333" }}>{d.food_type || "General Meal"}</h3>
              <p style={{ margin: "0", fontSize: "14px", color: "#666" }}>📍 {d.address || d.location || "Address not provided"}</p>
              {d.quantity && <p style={{ margin: "5px 0 0 0", fontSize: "12px", color: "#2196F3", fontWeight: "700" }}>{d.quantity} Meals Ready</p>}
            </div>

            <button 
              onClick={() => openNavigation(d.latitude, d.longitude)}
              style={btnStyle}
              onMouseOver={(e) => e.currentTarget.style.filter = "brightness(1.1)"}
              onMouseOut={(e) => e.currentTarget.style.filter = "none"}
            >
              <span>🧭</span> Start Navigation
            </button>
          </div>
        ))
      )}
    </div>
  );
}
