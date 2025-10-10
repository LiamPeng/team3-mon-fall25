import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #56018D 0%, #6f1bb8 100%)",
        color: "#ffffff",
        textAlign: "center",
        padding: "2rem",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      }}
    >
      {/* Top navigation */}
      <nav
        style={{
          position: "absolute",
          top: "20px",
          right: "40px",
          display: "flex",
          gap: "25px",
          fontSize: "1.1rem",
        }}
      >
        <Link
          to="/"
          style={{
            color: "#ffffff",
            textDecoration: "none",
            fontWeight: "500",
          }}
        >
          Home
        </Link>
        <Link
          to="/create-listing"
          style={{
            color: "#ffffff",
            textDecoration: "none",
            fontWeight: "500",
          }}
        >
          Create Listing
        </Link>
      </nav>

      {/* Hero content */}
      <h1
        style={{
          fontSize: "3.5rem",
          fontWeight: "800",
          marginBottom: "1rem",
        }}
      >
        Welcome to NYU Marketplace
      </h1>
      <p
        style={{
          fontSize: "1.3rem",
          maxWidth: "600px",
          lineHeight: "1.6",
          marginBottom: "2.5rem",
          opacity: "0.9",
        }}
      >
        Your one-stop platform for discovering, posting, and managing listings
        within the NYU community.
      </p>

      {/* Call-to-action button */}
      <Link
        to="/create-listing"
        style={{
          backgroundColor: "#ffffff",
          color: "#56018D",
          padding: "14px 32px",
          fontSize: "1.2rem",
          fontWeight: "600",
          textDecoration: "none",
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
          transition: "all 0.3s ease",
        }}
        onMouseOver={(e) => (e.target.style.backgroundColor = "#e8e1f0")}
        onMouseOut={(e) => (e.target.style.backgroundColor = "#ffffff")}
      >
        + Create a Listing
      </Link>
    </div>
  );
}
