import React, { useEffect, useState } from "react";
import "./ImageModal.css";
import DataTable from "../components/DataTable";

const baseColumns = [
  { header: "AI_RESULT", accessorKey: "result" },
  { header: "AI_DEFECT", accessorKey: "defect" },
  { header: "CLF", accessorKey: "clf" },
  { header: "Longest", accessorKey: "longest" },
  { header: "GV", accessorKey: "gv" },
  { header: "IVS_KEYIN", accessorKey: "ivs" },
];

export default function ImageModal({ row, onClose }) {
  const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";
  const [images, setImages] = useState([]);
  const [ready, setReady] = useState(false);

  const resolveImage = (p) =>
    `${API_BASE}/images/${encodeURI(p.startsWith("/") ? p.slice(1) : p)}`;

  useEffect(() => {
    if (!row) return;

    const loadImages = async () => {
      const src = row.image_path;
      const fileName = src.split("/").pop();
      const base = fileName.replace(/(_Pad|_Axial)?\.png$/i, "");

      const candidates = [
        { label: "Axial", file: `${base}_Axial.png` },
        { label: "Pad", file: `${base}_Pad.png` },
        { label: "Raw", file: `${base}.png` },
      ];

      const urls = candidates.map((c) => ({
        label: c.label,
        url: resolveImage(src.replace(fileName, c.file)),
      }));

      const baseImages = await Promise.all(
        urls.map(
          (item) =>
            new Promise((resolve) => {
              const img = new Image();
              img.onload = () => resolve(item);
              img.onerror = () => resolve(null);
              img.src = item.url;
            })
        )
      );

      let finalImages = baseImages.filter(Boolean);

      const gerberURL = `${API_BASE}/image/gerber?json_path=${encodeURIComponent(
        row.file_name
      )}&cx=${row.rel_x_unit}&cy=${row.rel_y_unit}&defect_width=${row.defect_width}&defect_height=${row.defect_height}`;

      try {
        const res = await fetch(gerberURL);
        const data = await res.json();

        if (data.image) {
          finalImages.push({
            label: `Gerber `,
            url: `data:image/png;base64,${data.image}`,
          });
        }
      } catch (err) {
        console.warn("Gerber fetch failed:", err);
      }

      setImages(finalImages);

      setReady(true);
    };

    loadImages();
  }, [row]);

  if (!row || !ready) return null; 

  const tableData = [
    {
      result: row.afvi_ai_keyin || "N/A",
      defect: row.afvi_ai_defect || "N/A",
      longest: row.afvi_ai_longest || "N/A",
      ivs: row.ivs_keyin1 || "N/A",
      clf: row.afvi_clf_defect || "N/A",
      gv: row.afvi_ai_gv || "N/A",
    },
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        
        <div className="modal-gallery">
          {images.map((img, i) => (
            <div key={i} className="modal-block">
              <img className="modal-image" src={img.url} />
            </div>
          ))}
        </div>

        <div className="modal-table">
          <DataTable
            selectable={false}
            pagination={false}
            data={tableData}
            columns={baseColumns}
          />
        </div>
      </div>
    </div>
  );
}
