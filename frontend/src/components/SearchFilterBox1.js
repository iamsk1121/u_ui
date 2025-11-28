import React, { useState } from "react";
import "./SearchFilterBox.css";

export default function SearchFilterBox({ onSearch }) {
  const [filters, setFilters] = useState({
    equip: "",
    machine: "",
    lot: "",
    trial: "",
    bundle: "",
  });

  const handleChange = (field, value) => {
    setFilters({ ...filters, [field]: value });
  };

  return (
    <div className="sf-box-wrapper">
      <div className="sf-box">
        <h3 className="sf-title">Search Filters</h3>

        <input placeholder="설비" onChange={(e) => handleChange("equip", e.target.value)} />
        <input placeholder="Machine" onChange={(e) => handleChange("machine", e.target.value)} />
        <input placeholder="LOT" onChange={(e) => handleChange("lot", e.target.value)} />
        <input placeholder="Trial" onChange={(e) => handleChange("trial", e.target.value)} />
        <input placeholder="Bundle" onChange={(e) => handleChange("bundle", e.target.value)} />

        <button className="sf-search-btn" onClick={() => onSearch(filters)}>
          Search
        </button>
      </div>
    </div>
  );
}
