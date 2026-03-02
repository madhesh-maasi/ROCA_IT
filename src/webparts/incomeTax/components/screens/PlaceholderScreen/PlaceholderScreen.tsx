import * as React from "react";

interface IPlaceholderScreenProps {
  title: string;
}

const PlaceholderScreen: React.FC<IPlaceholderScreenProps> = ({ title }) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "60vh",
        gap: "14px",
        color: "#9ca3af",
        fontFamily: "'Segoe UI', sans-serif",
      }}
    >
      <i
        className="pi pi-clock"
        style={{ fontSize: "40px", color: "#d1d5db" }}
      />
      <h3
        style={{
          margin: 0,
          fontSize: "18px",
          fontWeight: 600,
          color: "#374151",
        }}
      >
        {title}
      </h3>
      <p style={{ margin: 0, fontSize: "13px" }}>
        This screen is under construction.
      </p>
    </div>
  );
};

export default PlaceholderScreen;
