import React from "react";
import { BiLoaderAlt } from "react-icons/bi";

export default function LoadingSpinner({ text = "Loading" }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "40vh",
        width: "100%",
        color: "#3498db",
      }}
    >
      <BiLoaderAlt
        style={{
          fontSize: "48px",
          animation: "spin 1s linear infinite",
        }}
      />
      <p style={{ marginTop: "10px", fontSize: "18px" }}>{text}</p>

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}
