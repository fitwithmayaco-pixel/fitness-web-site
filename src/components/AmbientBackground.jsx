import { useState, useEffect } from "react";
import "./AmbientBackground.css";

const BACKGROUNDS = [
  { id: "v1", type: "video", src: "/videos/workout-bg1.mp4", label: "Video 1" },
  { id: "p1", type: "image", src: "/images/maya-gym-pink.jpg", label: "Pink Gym" },
  { id: "v2", type: "video", src: "/videos/workout-bg2.mp4", label: "Video 2" },
  { id: "p2", type: "image", src: "/images/maya-gym-purple.jpg", label: "Purple Gym" },
];

export default function AmbientBackground() {
  const [currentIdx, setCurrentIdx] = useState(0);

  // Auto-cycle background every 15 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % BACKGROUNDS.length);
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <div className="ambient-bg" aria-hidden="true">
        {BACKGROUNDS.map((bg, idx) =>
          bg.type === "video" ? (
            <video
              key={bg.id}
              src={bg.src}
              autoPlay
              muted
              loop
              playsInline
              className={`ambient-bg__media${idx === currentIdx ? " active" : ""}`}
            />
          ) : (
            <img
              key={bg.id}
              src={bg.src}
              alt=""
              className={`ambient-bg__media${idx === currentIdx ? " active" : ""}`}
            />
          )
        )}
        <div className="ambient-bg__overlay" />
      </div>

      {/* Discrete bottom corner background switcher */}
      <div className="ambient-switcher">
        <span style={{ fontSize: "0.9rem" }}>✨ BG:</span>
        {BACKGROUNDS.map((bg, idx) => (
          <button
            key={bg.id}
            type="button"
            className={`ambient-switcher__btn ${idx === currentIdx ? "active" : ""}`}
            onClick={() => setCurrentIdx(idx)}
            title={`Switch to ${bg.label}`}
          >
            {bg.label}
          </button>
        ))}
      </div>
    </>
  );
}
