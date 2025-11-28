import React from "react";
import "./ImageGallery.css";

export default function ImageGallery({ rows = [], onClick }) {
 const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000"; 

 const resolveImage = (p) => {
  const clean = p.replace(/_Pad\.png$/i, "_Axial.png").trim();
  const normalizedPath = clean.startsWith("/") ? clean.slice(1) : clean;
  return `${API_BASE}/images/${encodeURI(normalizedPath)}`;
};

  
  return (
    <div className="img-gallery-container">
      {rows.map((r, idx) => (
        <div key={idx} className="img-gallery-card" onClick={() => onClick?.(r)}>
          <img src={resolveImage(r.image_path)}  alt="" className="img-gallery-thumb"   onError={() => console.log(" 이미지 로딩 실패:", resolveImage(r.image_path))}
  onLoad={() => console.log(" 이미지 로딩 성공:", resolveImage(r.image_path))} />
          
          <div className="img-gallery-info">
            <div className="img-defect">{r.afvi_ai_defect || "-"}</div>
            <div className="img-keyin">{r.afvi_ai_keyin || "-"}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
