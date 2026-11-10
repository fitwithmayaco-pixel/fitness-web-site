import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Upload from "./pages/Upload";
import Reader from "./pages/Reader";
import EditBook from "./pages/Edit";
import Admin from "./pages/Admin";
import AmbientBackground from "./components/AmbientBackground";
import { AuthProvider } from "./context/AuthContext";

export default function App() {
  return (
    <AuthProvider>
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", position: "relative" }}>
        {/* Living ambient background with workout videos & Maya's photos */}
        <AmbientBackground />

        <Navbar />
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/read/:id" element={<Reader />} />
            <Route path="/edit/:id" element={<EditBook />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </AuthProvider>
  );
}
