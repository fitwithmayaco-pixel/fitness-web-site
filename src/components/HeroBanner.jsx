import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { SITE } from "../config";
import { useAuth } from "../context/AuthContext";
import mayaPurple from "../assets/posters/maya-gym-purple.jpg";
import "./HeroBanner.css";

const SLIDES = [
  {
    type: "video",
    src: "/videos/maya-workout1.mp4",
    title: SITE.name,
    tagline: "Stronger. Healthier. Happier. Transform your body and lifestyle with Maya's proven workout guides and nutrition plans ♡",
    eyebrow: "Live The Fitness Lifestyle ♡",
    badgeTitle: "Maya Fit • Live Trainer",
    badgeSub: "🔥 Video Routine 1",
  },
  {
    type: "video",
    src: "/videos/maya-workout2.mp4",
    title: "Train With Purpose.",
    tagline: "Consistency creates champions. Access Maya's complete digital fitness collection anytime, anywhere.",
    eyebrow: "FitWithMaya ♡",
    badgeTitle: "Strength & Conditioning",
    badgeSub: "✨ Video Routine 2",
  },
  {
    type: "video",
    src: "/videos/maya-workout3.mp4",
    title: "Crush Your Goals.",
    tagline: "Follow structured workout regimens and progressive routines tailored to get you in peak shape.",
    eyebrow: "Daily Motivation ♡",
    badgeTitle: "Peak Performance Regimen",
    badgeSub: "⚡ Video Routine 3",
  },
  {
    type: "image",
    src: mayaPurple,
    title: "Elevate Your Mindset.",
    tagline: "Build lasting strength, confidence, and discipline. Your personal fitness library awaits you.",
    eyebrow: "Strength & Wellness ♡",
    badgeTitle: "Mindset & Wellness Routine",
    badgeSub: "♡ Empowering Women Worldwide",
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
    timerRef.current = setInterval(next, 7000);
  }, [next]);

  useEffect(() => {
    resetTimer();
    return () => clearInterval(timerRef.current);
  }, [resetTimer]);

  const goTo = (i) => { setCurrent(i); resetTimer(); };
  const slide = SLIDES[current];

  return (
    <section className="hero">
      {/* Subtle ambient backdrop for atmospheric depth */}
      {SLIDES.map((s, i) =>
        s.type === "video" ? (
          <video
            key={`bg-${i}`}
            src={s.src}
            autoPlay
            muted
            loop
            playsInline
            className={`hero__backdrop-media${i === current ? " active" : ""}`}
            aria-hidden="true"
          />
        ) : (
          <img
            key={`bg-${i}`}
            src={s.src}
            alt=""
            className={`hero__backdrop-media${i === current ? " active" : ""}`}
            aria-hidden="true"
          />
        )
      )}

      {/* Atmospheric dark gradient overlay */}
      <div className="hero__overlay" />

      {/* ── Main Two-Column Content: Left Text, Right Girl/Video ── */}
      <div className="container hero__inner">

        {/* ── LEFT: Texts ── */}
        <div className="hero__left page-enter" key={`text-${current}`}>
          <span className="hero__eyebrow script">{slide.eyebrow}</span>
          <h1 className="hero__title gradient-text">{slide.title}</h1>
          <p className="hero__tagline">{slide.tagline}</p>
          <div className="hero__actions">
            <a href="#library" className="btn btn-primary">Browse Library</a>
            {isAdmin ? (
              <Link to="/admin" className="btn btn-outline">⚡ Open Admin Panel</Link>
            ) : (
              <a href="#library" className="btn btn-outline">Start Reading</a>
            )}
          </div>
        </div>

        {/* ── RIGHT: Girl Video & Photo Showcase ── */}
        <div className="hero__right">
          <div className="hero__showcase">
            {SLIDES.map((s, i) => (
              <div
                key={`showcase-${i}`}
                className={`hero__media-item${i === current ? " active" : ""}`}
              >
                {s.type === "video" ? (
                  <video
                    src={s.src}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="hero__media-video"
                  />
                ) : (
                  <img
                    src={s.src}
                    alt="Maya Fitness"
                    className="hero__media-img"
                  />
                )}
              </div>
            ))}

            {/* Floating Live Badge */}
            <div className="hero__floating-badge">
              <div className="hero__badge-left">
                <span className="hero__live-dot" />
                <div>
                  <div className="hero__badge-title">{slide.badgeTitle}</div>
                  <div className="hero__badge-sub">{slide.badgeSub}</div>
                </div>
              </div>
            </div>
          </div>
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
