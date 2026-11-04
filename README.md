# FitWithMaya – Personal E-Book Library

A beautiful, offline-first personal fitness e-book library built with **React + Vite**.  
No login. No backend. No database server. All books are stored in your browser using IndexedDB.

---

## ✨ Features
- 📚 Upload PDF e-books — stored locally in IndexedDB (survives refresh)
- 📖 Realistic page-flip reader (HTMLFlipBook) with smooth animations
- 🔍 Search + category filter chips
- 📌 Auto-saves reading progress per book
- 🌙 Dark / Light reading mode
- ⛶ Fullscreen reader
- 🔎 Zoom in/out
- ⌨️ Keyboard arrow navigation
- 👆 Touch swipe support (mobile)
- 📱 Fully responsive (mobile-first)

---

## 🚀 Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev

# 3. Open in browser
http://localhost:5173
```

---

## 🖼 Adding Your Poster Images

Place your images in:
```
src/assets/posters/
  poster1.jpg   ← hero slide 1 (and empty-state card)
  poster2.jpg   ← hero slide 2 (and poster strip section)
```
To add more slides, edit `src/components/HeroBanner.jsx` → the `SLIDES` array.

---

## 📖 Uploading Books

1. Navigate to `/upload` (or click **Upload** in the navbar).
2. Drag & drop your PDF, fill in the title / author / category.
3. Optionally upload a custom cover image; if none is provided, page 1 is used automatically.
4. Click **Add to Library** — the book is processed in the browser and saved.
5. Click the book card to open the flip-book reader.

---

## ⚙️ Configuration

Edit **`src/config.js`** to change site name, tagline, colors, social links, and categories.

---

## 📂 Folder Structure

```
src/
  assets/posters/        ← Your poster images
  components/            ← Navbar, Footer, HeroBanner, BookCard, SearchBar
  pages/                 ← Home, Upload, Reader
  utils/                 ← db.js, pdfUtils.js, helpers.js
  config.js              ← ⭐ All site settings in one place
  index.css              ← Global styles + CSS variables
```

---

## 📦 Tech Stack

| Library | Purpose |
|---|---|
| React + Vite | UI framework + build tool |
| pdfjs-dist | Render PDF pages to canvas/image |
| react-pageflip | Realistic page-flip animation |
| localforage | IndexedDB abstraction (offline storage) |
| react-router-dom | Client-side routing |

---

Made with 💗 by **FitWithMaya**
