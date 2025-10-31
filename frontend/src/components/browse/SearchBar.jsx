import React, { useState } from "react";

export default function SearchBar({ defaultValue = "", onSearch }) {
  const [value, setValue] = useState(defaultValue);

  const submit = (e) => {
    e?.preventDefault();
    onSearch(value.trim());
  };

  return (
    <form
      onSubmit={submit}
      style={{
        flex: 1,
        display: "flex",
        gap: 8,
        border: "1px solid #e5e7eb",
        borderRadius: 16,
        padding: "8px 12px",
        background: "#fff",
      }}
    >
      <label style={{ position: "absolute", left: "-9999px" }} htmlFor="search-input">
        Search
      </label>
      <input
        id="search-input"
        type="text"
        placeholder="Search listings"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        style={{
          flex: 1,
          border: "none",
          outline: "none",
          fontSize: 14,
          background: "transparent",
        }}
      />
      <button
        type="submit"
        style={{
          borderRadius: 12,
          background: "#56018D",
          color: "#fff",
          padding: "6px 16px",
          border: "none",
          cursor: "pointer",
        }}
      >
        Search
      </button>
    </form>
  );
}
