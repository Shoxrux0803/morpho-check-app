// src/App.js
import React, { Suspense, lazy, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { AnimatePresence, motion } from "framer-motion";
import { Toaster } from "react-hot-toast";

// ==== Styles (doimo tepada) ====
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./styles/motion.css";
import "./index.css";

// ==== Pages & Components ====
import Header from "./components/Header";
import { OfflineSyncProvider } from "./providers/OfflineSyncProvider";
import Footer from "./components/Footer";
import IntroPage from "./pages/IntroPage";
import ThemeSync from "./components/ThemeSync";
import ChatWidget from "./components/Chat/ChatWidget";
import AIAssistantWidget from "./components/AI/AIAssistantWidget";
import MorphoProBackground from "./components/MorphoProBackground";
import { useThemeMode } from "./providers/ThemeProviderMUI";

// Lazy pages - YANGI SAHIFALAR QO'SHILDI
const MorphoCheckPro = lazy(() => import("./pages/MorphoCheckPro"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const SuperAdminPage = lazy(() => import("./pages/SuperAdminPage"));
const ResearcherPage = lazy(() => import("./pages/ResearcherPage"));
const InfoDetail = lazy(() => import("./pages/InfoDetail"));
const AuthorPage = lazy(() => import("./pages/AuthorPage"));

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

// Role-based Admin Wrapper (Data Dashboard)
const AdminWrapper = () => {
  const { user, loading } = useAuth();

  if (loading) return <PageLoader />;

  // Admin login screen for guests
  if (!user) {
    return (
      <PageTransition>
        <AdminPage />
      </PageTransition>
    );
  }

  // Redirect based on role if logged in
  if (user.role === "researcher") {
    return <Navigate to="/researcher" replace />;
  }

  return (
    <PageTransition>
      <AdminPage />
    </PageTransition>
  );
};

// Super Admin Wrapper (Admin Management)
const SuperAdminWrapper = () => {
  const { user, loading } = useAuth();

  if (loading) return <PageLoader />;

  if (user?.role === "superadmin") {
    return (
      <PageTransition>
        <SuperAdminPage />
      </PageTransition>
    );
  }

  // If not superadmin, redirect to the data dashboard
  return <Navigate to="/admin" replace />;
};

const ResearcherWrapper = () => {
  const { user, loading } = useAuth();

  if (loading) return <PageLoader />;

  if (user?.role === "researcher" || user?.role === "superadmin") {
    return (
      <PageTransition>
        <ResearcherPage />
      </PageTransition>
    );
  }

  return <Navigate to="/admin" replace />;
};

const HomeWrapper = () => {
  const { user, loading } = useAuth();

  if (loading) return <PageLoader />;

  if (user?.role === "researcher") {
    return <Navigate to="/researcher" replace />;
  }

  return (
    <PageTransition>
      <IntroPage />
    </PageTransition>
  );
};

// Animated Routes komponenti
function AnimatedRoutes() {
  const location = useLocation();
  const { mode } = useThemeMode();

  const publicRoutes = ["/", "/info", "/author"];
  const showBg = publicRoutes.includes(location.pathname);

  return (
    <>
      {showBg && <MorphoProBackground theme={mode} pathname={location.pathname} />}
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<HomeWrapper />} />
          <Route
            path="/morphocheck-pro"
            element={
              <PageTransition>
                <MorphoCheckPro />
              </PageTransition>
            }
          />
          <Route
            path="/info"
            element={
              <PageTransition>
                <InfoDetail />
              </PageTransition>
            }
          />
          <Route
            path="/author"
            element={
              <PageTransition>
                <AuthorPage />
              </PageTransition>
            }
          />
          <Route path="/admin" element={<AdminWrapper />} />
          <Route path="/superadmin" element={<SuperAdminWrapper />} />
          <Route path="/researcher" element={<ResearcherWrapper />} />
          <Route path="/morphoadmin" element={<Navigate to="/superadmin" replace />} />
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
    </>
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
        borderTop: "3px solid #0f766e",
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
    <LanguageProvider>
      <Toaster
        position="top-right"
        reverseOrder={false}
        toastOptions={{
          duration: 5000,
          style: {
            background: "#333",
            color: "#fff",
            borderRadius: "12px",
            fontSize: "14px",
            padding: "12px 20px",
          },
          success: {
            iconTheme: {
              primary: "#10B981",
              secondary: "#fff",
            },
          },
          error: {
            iconTheme: {
              primary: "#EF4444",
              secondary: "#fff",
            },
          },
        }}
      />
      <AuthProvider>
        <OfflineSyncProvider>
          <Router
            basename={BASENAME}
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
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

              <ChatWidget />
              <AIAssistantWidget />

              <Footer />
            </div>
          </Router>
        </OfflineSyncProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
