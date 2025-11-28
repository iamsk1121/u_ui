import { useGlobalProgress } from "../context/GlobalProgressContext";

export default function GlobalProgressBarStack() {
  const { downloads, cancel } = useGlobalProgress();  

  if (downloads.length === 0) return null;

  return (
    <div style={{
      position: "fixed",
      bottom: "16px",
      right: "16px",
      display: "flex",
      flexDirection: "column-reverse",
      gap: "8px",
      zIndex: 99999,
    }}>
      {downloads.map((d) => (
        <div key={d.id} style={{
          width: "200px",
          padding: "10px",
          background: "#fff",
          color: "dark-gray",
          borderRadius: "8px",
          boxShadow: "0 0 10px rgba(0,0,0,0.4)",
          fontSize: "12px",
          position: "relative",
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "6px"
          }}>
            <span>{d.label}</span>

            <button
              onClick={() => cancel(d.id)}
              style={{
                color: "var(--primary)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                fontSize: "12px",
              }}>
              ✕
            </button>
          </div>

          <div style={{
            width: "100%",
            height: "6px",
            background: "#555",
            borderRadius: "4px",
            overflow: "hidden",
          }}>
            <div style={{
              width: `${d.progress}%`,
              height: "100%",
              background: "var(--primary)",
              transition: "width 0.3s ease",
            }} />
          </div>
        </div>
      ))}
    </div>
  );
}
