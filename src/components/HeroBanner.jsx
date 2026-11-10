import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { SITE } from "../config";
import { useAuth } from "../context/AuthContext";
import mayaPink from "../assets/posters/maya-gym-pink.jpg";
import mayaPurple from "../assets/posters/maya-gym-purple.jpg";
import "./HeroBanner.css";

const SLIDES = [
  {
    type: "video",
    src: "/videos/workout-bg1.mp4",
    title: SITE.name,
    tagline: "Stronger. Healthier. Happier. Real Workouts, Real Results ♡",
    eyebrow: "Live The Fitness Lifestyle ♡",
  },
  {
    type: "image",
    src: mayaPink,
    title: "Train Smart.",
    tagline: "Transform your body and mindset with proven workout routines & nutrition guides.",
    eyebrow: "FitWithMaya ♡",
  },
  {
    type: "video",
    src: "/videos/workout-bg2.mp4",
    title: "Crush Your Goals.",
    tagline: "Consistency is key. Access your personal digital fitness library anytime, anywhere.",
    eyebrow: "Daily Motivation ♡",
  },
  {
    type: "image",
    src: mayaPurple,
    title: "Elevate Your Routine.",
    tagline: "Get stronger. Build confidence. Keep showing up for yourself every single day ♡",
    eyebrow: "Strength & Wellness ♡",
  },
];

export default function HeroBanner() {
  const [current, setCurrent] = useState(0);
  const { isAdmin } = useAuth();
  const timerRef = useRef(null);

  const next = useCallback(() => setCurrent((c) => (c + 1) % SLIDES.length), []);
  const prev = () => setCurrent((c) => (c - 1 + SLIDES.length) % SLIDES.length);

  const resetTimer = useCallback(() => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(next, 7000); // 7 seconds per slide
  }, [next]);

  useEffect(() => {
    resetTimer();
    return () => clearInterval(timerRef.current);
  }, [resetTimer]);

  const goTo = (i) => { setCurrent(i); resetTimer(); };
  const slide = SLIDES[current];

  return (
    <section className="hero">
      {/* Background media (Photos & Videos) */}
      {SLIDES.map((s, i) =>
        s.type === "video" ? (
          <video
            key={i}
            src={s.src}
            autoPlay
            muted
            loop
            playsInline
            className={`hero__bg${i === current ? " active" : ""}`}
            aria-hidden="true"
          />
        ) : (
          <img
            key={i}
            src={s.src}
            alt=""
            className={`hero__bg${i === current ? " active" : ""}`}
            aria-hidden="true"
          />
        )
      )}

      {/* Atmospheric dark pink gradient overlay */}
      <div className="hero__overlay" />

      {/* Content */}
      <div className="container hero__content page-enter" key={current}>
        <span className="hero__eyebrow script">{slide.eyebrow}</span>
        <h1 className="hero__title gradient-text">{slide.title}</h1>
        <p className="hero__tagline">{slide.tagline}</p>
        <div className="hero__actions">
          <a href="#library" className="btn btn-primary">Browse Library</a>
          {isAdmin ? (
            <Link to="/upload" className="btn btn-outline">+ Upload PDF</Link>
          ) : (
            <a href="#library" className="btn btn-outline">Explore Guides</a>
          )}
        </div>
      </div>

      {/* Navigation Arrows */}
      <button className="hero__arrow hero__arrow--prev" onClick={() => { prev(); resetTimer(); }} aria-label="Previous">‹</button>
      <button className="hero__arrow hero__arrow--next" onClick={() => { next(); resetTimer(); }} aria-label="Next">›</button>

      {/* Indicator Dots */}
      <div className="hero__dots">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            className={`hero__dot${i === current ? " active" : ""}`}
            onClick={() => goTo(i)}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
