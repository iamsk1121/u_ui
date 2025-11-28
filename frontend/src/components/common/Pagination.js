import React from "react";
import "./Pagination.css";

export default function Pagination({ page, totalCount, pageSize = 100, onChange }) {
  const totalPages = Math.ceil(totalCount / pageSize);

  if (totalPages <= 1) return null;

  const createPages = () => {
    const pages = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);

      if (page > 3) pages.push("...");
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
        pages.push(i);
      }
      if (page < totalPages - 2) pages.push("...");

      pages.push(totalPages);
    }

    return pages;
  };

  const pages = createPages();

  return (
    <div className="pagination-container">
      <button
        className="page-btn arrow"
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
      >
        &lt;
      </button>

      {pages.map((p, idx) =>
        p === "..." ? (
          <span key={idx} className="ellipsis">...</span>
        ) : (
          <button
            key={idx}
            className={`page-btn ${p === page ? "active" : ""}`}
            onClick={() => onChange(p)}
          >
            {p}
          </button>
        )
      )}

      <button
        className="page-btn arrow"
        disabled={page === totalPages}
        onClick={() => onChange(page + 1)}
      >
        &gt;
      </button>
    </div>
  );
}
