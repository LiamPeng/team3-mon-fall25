import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaBoxOpen, FaDollarSign, FaEdit, FaCheckCircle, FaTrash, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { getListing, patchListing, deleteListingAPI } from "@/api/listings";
import "./ListingDetail.css";

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await getListing(id);
        if (mounted) setListing(data);
      } catch (e) {
        console.error(e);
        if (mounted) setError("Failed to load listing.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  const onMarkSold = async (e) => {
    e.stopPropagation();
    if (!listing || listing.status === "sold") return;

    try {
      setSaving(true);
      // Only send status field for PATCH update
      const updated = await patchListing(listing.listing_id, { status: "sold" });
      setListing(updated); // backend returns fresh record
      window.alert("Listing marked as sold.");
    } catch (e) {
      console.error(e);
      window.alert("Failed to mark as sold.");
    } finally {
      setSaving(false);
    }
  };

  const handlePrevImage = () => {
    if (!listing?.images || listing.images.length === 0) return;
    setCurrentImageIndex((prev) => (prev === 0 ? listing.images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    if (!listing?.images || listing.images.length === 0) return;
    setCurrentImageIndex((prev) => (prev === listing.images.length - 1 ? 0 : prev + 1));
  };

  const handleDelete = async (e) => {
    e.stopPropagation();

    const confirmed = window.confirm(
      "Are you sure you want to delete this listing? This action cannot be undone."
    );

    if (!confirmed) return;

    try {
      setSaving(true);
      const success = await deleteListingAPI(listing.listing_id);

      if (success) {
        // Redirect to My Listings page after successful deletion
        navigate("/my-listings");
      } else {
        window.alert("Failed to delete listing. Please try again.");
      }
    } catch (err) {
      console.error("Failed to delete listing:", err);
      window.alert("Failed to delete listing. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="listing-detail-page"><div className="listing-detail-card">Loading…</div></div>;
  }
  if (error || !listing) {
    return <div className="listing-detail-page"><div className="listing-detail-card">{error || "Not found"}</div></div>;
  }

  // API returns: listing_id, price (string), status ("active"/"sold"/"inactive"), etc.
  const priceDisplay = typeof listing.price === "string" ? listing.price : String(listing.price);
  const statusClass = (listing.status || "").toLowerCase();
  const images = listing.images || [];
  const hasImages = images.length > 0;

  return (
    <div className="listing-detail-page">
      <div className="listing-detail-card">
        {/* Image Carousel */}
        <div className="image-carousel" style={{
          position: "relative",
          width: "100%",
          height: 400,
          background: "#F5F5F5",
          borderRadius: 12,
          overflow: "hidden",
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          {hasImages ? (
            <>
              <img
                src={images[currentImageIndex].image_url}
                alt={`${listing.title} - Image ${currentImageIndex + 1}`}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain"
                }}
              />
              {images.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    style={{
                      position: "absolute",
                      left: 16,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "rgba(255, 255, 255, 0.9)",
                      border: "none",
                      borderRadius: "50%",
                      width: 44,
                      height: 44,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                      transition: "all 0.2s"
                    }}
                    onMouseOver={(e) => e.target.style.background = "rgba(255, 255, 255, 1)"}
                    onMouseOut={(e) => e.target.style.background = "rgba(255, 255, 255, 0.9)"}
                  >
                    <FaChevronLeft size={20} color="#111" />
                  </button>
                  <button
                    onClick={handleNextImage}
                    style={{
                      position: "absolute",
                      right: 16,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "rgba(255, 255, 255, 0.9)",
                      border: "none",
                      borderRadius: "50%",
                      width: 44,
                      height: 44,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                      transition: "all 0.2s"
                    }}
                    onMouseOver={(e) => e.target.style.background = "rgba(255, 255, 255, 1)"}
                    onMouseOut={(e) => e.target.style.background = "rgba(255, 255, 255, 0.9)"}
                  >
                    <FaChevronRight size={20} color="#111" />
                  </button>
                  <div style={{
                    position: "absolute",
                    bottom: 16,
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "rgba(0, 0, 0, 0.6)",
                    color: "#fff",
                    padding: "6px 14px",
                    borderRadius: 16,
                    fontSize: 13,
                    fontWeight: 500
                  }}>
                    {currentImageIndex + 1} / {images.length}
                  </div>
                </>
              )}
            </>
          ) : (
            <FaBoxOpen size={80} color="#5A2D82" />
          )}
        </div>

        <h1 className="listing-title">{listing.title}</h1>

        <p className="listing-price">
          <FaDollarSign /> {priceDisplay}
        </p>

        <p className={`listing-status ${statusClass}`}>
          <FaCheckCircle /> {listing.status}
        </p>

        <p className="listing-description">{listing.description}</p>

        <div className="listing-actions">
          <button
            className="btn edit"
            onClick={() => navigate(`/listing/${listing.listing_id}/edit`)}
          >
            <FaEdit /> Edit Listing
          </button>

          <button
            className="btn sold"
            disabled={listing.status === "sold" || saving}
            onClick={onMarkSold}
            title={listing.status === "sold" ? "Already sold" : "Mark as Sold"}
          >
            <FaCheckCircle /> {saving ? "Updating..." : listing.status === "sold" ? "Sold" : "Mark as Sold"}
          </button>

          <button
            className="btn delete"
            onClick={handleDelete}
            disabled={saving}
          >
            <FaTrash /> {saving ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
