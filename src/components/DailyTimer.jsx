import { useState, useEffect } from "react";
import "./DailyTimer.css";

const STORAGE_KEY = "fitwithmaya_24h_timer_end";
const DAY_MS = 24 * 60 * 60 * 1000;

export default function DailyTimer() {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    // Get or initialize the 24-hour cycle end timestamp
    const getOrResetEndTime = () => {
      const now = Date.now();
      let storedEnd = Number(localStorage.getItem(STORAGE_KEY));

      if (!storedEnd || isNaN(storedEnd) || now >= storedEnd) {
        // Reset timer for another full 24 hours
        storedEnd = now + DAY_MS;
        localStorage.setItem(STORAGE_KEY, String(storedEnd));
      }
      return storedEnd;
    };

    let endTime = getOrResetEndTime();

    const updateTimer = () => {
      const now = Date.now();
      let diff = endTime - now;

      // When the 24-hour countdown finishes, automatically restart for another 24 hours
      if (diff <= 0) {
        endTime = getOrResetEndTime();
        diff = endTime - now;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, []);

  const pad = (n) => String(n).padStart(2, "0");

  return (
    <div className="daily-timer-card glass">
      <div className="daily-timer__info">
        <div className="daily-timer__badge">
          <span className="daily-timer__pulse" />
          <span>24H Daily Challenge</span>
        </div>
        <h3 className="daily-timer__title">Daily Reading Streak & Free Pass</h3>
        <p className="daily-timer__desc">
          Today's reading challenge session refreshes automatically every 24 hours. Keep showing up!
        </p>
      </div>

      <div className="daily-timer__clock">
        <div className="daily-timer__unit">
          <span className="daily-timer__num">{pad(timeLeft.hours)}</span>
          <span className="daily-timer__label">Hours</span>
        </div>
        <span className="daily-timer__sep">:</span>
        <div className="daily-timer__unit">
          <span className="daily-timer__num">{pad(timeLeft.minutes)}</span>
          <span className="daily-timer__label">Mins</span>
        </div>
        <span className="daily-timer__sep">:</span>
        <div className="daily-timer__unit">
          <span className="daily-timer__num">{pad(timeLeft.seconds)}</span>
          <span className="daily-timer__label">Secs</span>
        </div>
      </div>
    </div>
  );
}
