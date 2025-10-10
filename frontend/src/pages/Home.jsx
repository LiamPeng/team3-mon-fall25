import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Welcome to NYU Marketplace</h1>
      <p>Your one-stop platform for listings.</p>

      {/*Navigation button */}
      <Link
        to="/create-listing"
        style={{
          display: "inline-block",
          marginTop: "20px",
          padding: "10px 20px",
          backgroundColor: "#007bff",
          color: "#fff",
          textDecoration: "none",
          borderRadius: "5px",
        }}
      >
        Create a Listing
      </Link>
    </div>
  );
}
