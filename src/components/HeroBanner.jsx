import { useState, useEffect, useCallback, useRef } from "react";
import poster1 from "../assets/posters/poster1.jpg";
import poster2 from "../assets/posters/poster2.jpg";
import { SITE } from "../config";
import { Link } from "react-router-dom";
import "./HeroBanner.css";

const SLIDES = [
  {
    img: poster1,
    title: SITE.name,
    tagline: SITE.tagline,
  },
  {
    img: poster2,
    title: "Train Smart.",
    tagline: "Get Stronger. Keep Showing Up. ♡",
  },
];

export default function HeroBanner() {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef(null);

  const next = useCallback(() => setCurrent((c) => (c + 1) % SLIDES.length), []);
  const prev = () => setCurrent((c) => (c - 1 + SLIDES.length) % SLIDES.length);

  const resetTimer = useCallback(() => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(next, 5000);
  }, [next]);

  useEffect(() => {
    resetTimer();
    return () => clearInterval(timerRef.current);
  }, [resetTimer]);

  const goTo = (i) => { setCurrent(i); resetTimer(); };

  const slide = SLIDES[current];

  return (
    <section className="hero">
      {/* Background images */}
      {SLIDES.map((s, i) => (
        <img
          key={i}
          src={s.img}
          alt=""
          className={`hero__bg${i === current ? " active" : ""}`}
          aria-hidden="true"
        />
      ))}
      <div className="hero__overlay" />

      {/* Content */}
      <div className="container hero__content page-enter" key={current}>
        <span className="hero__eyebrow script">FitWithMaya ♡</span>
        <h1 className="hero__title gradient-text">{slide.title}</h1>
        <p className="hero__tagline">{slide.tagline}</p>
        <div className="hero__actions">
          <a href="#library" className="btn btn-primary">Browse Books</a>
          <Link to="/upload" className="btn btn-outline">Upload PDF</Link>
        </div>
      </div>

      {/* Arrows */}
      <button className="hero__arrow hero__arrow--prev" onClick={() => { prev(); resetTimer(); }} aria-label="Previous">‹</button>
      <button className="hero__arrow hero__arrow--next" onClick={() => { next(); resetTimer(); }} aria-label="Next">›</button>

      {/* Dots */}
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
