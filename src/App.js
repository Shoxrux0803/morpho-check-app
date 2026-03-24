// src/App.js
import React, { Suspense, lazy, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

// ==== Styles (doimo tepada) ====
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./styles/motion.css";
import "./index.css";

// ==== Pages & Components ====
import Header from "./components/Header";
import Footer from "./components/Footer";
import IntroPage from "./pages/IntroPage";
import ThemeSync from "./components/ThemeSync";

// Lazy pages - YANGI SAHIFALAR QO'SHILDI
const MorphoCheckPro = lazy(() => import("./pages/MorphoCheckPro"));
const AdminPage = lazy(() => import("./pages/AdminPage"));

// 404
const NotFound = () => (
  <div className="container py-5">
    <h3>404 — Sahifa topilmadi</h3>
    <p>Manzil noto'g'ri yoki sahifa ko'chirilgan bo'lishi mumkin.</p>
  </div>
);

// Page Transition komponenti
const PageTransition = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20, scale: 0.98 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: -20, scale: 1.02 }}
    transition={{
      type: "tween",
      ease: "easeInOut",
      duration: 0.3,
    }}
    style={{
      width: "100%",
      minHeight: "100%",
    }}
  >
    {children}
  </motion.div>
);

// Marshrut almashganda oynani yuqoriga ko'tarish
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pathname]);
  return null;
}

// Animated Routes komponenti
function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <PageTransition>
              <IntroPage />
            </PageTransition>
          }
        />
        <Route
          path="/morphocheck-pro"
          element={
            <PageTransition>
              <MorphoCheckPro />
            </PageTransition>
          }
        />
        <Route
          path="/admin"
          element={
            <PageTransition>
              <AdminPage />
            </PageTransition>
          }
        />
        <Route
          path="*"
          element={
            <PageTransition>
              <NotFound />
            </PageTransition>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}

// Loading komponenti
const PageLoader = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="container py-5 text-center"
    style={{
      minHeight: "60vh",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    <motion.div
      animate={{
        rotate: 360,
        scale: [1, 1.1, 1],
      }}
      transition={{
        rotate: {
          duration: 1,
          repeat: Infinity,
          ease: "linear",
        },
        scale: {
          duration: 0.8,
          repeat: Infinity,
          ease: "easeInOut",
        },
      }}
      style={{
        width: "50px",
        height: "50px",
        border: "3px solid #f3f3f3",
        borderTop: "3px solid #007bff",
        borderRadius: "50%",
        marginBottom: "1rem",
      }}
    />
    <motion.p
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="text-muted"
    >
      Yuklanmoqda...
    </motion.p>
  </motion.div>
);

export default function App() {
  const BASENAME = process.env.REACT_APP_BASENAME || "/";

  return (
    <Router basename={BASENAME}>
      <ScrollToTop />
      {/* MUI (Header) ↔ Tailwind (html.dark) sinxronizator */}
      <ThemeSync />

      <div className="App d-flex flex-column min-vh-100">
        <Header />

        <main className="flex-grow-1">
          <Suspense fallback={<PageLoader />}>
            <AnimatedRoutes />
          </Suspense>
        </main>

        <Footer />
      </div>
    </Router>
  );
}
