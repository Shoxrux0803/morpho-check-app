// src/App.js
import React, { Component, Suspense, useEffect, lazy } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate,
} from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { Toaster, toast, useToasterStore } from 'react-hot-toast';

// ==== Pages & Components ====
import Header from './components/Header';
import { OfflineSyncProvider } from './providers/OfflineSyncProvider';
import Footer from './components/Footer';
import IntroPage from './pages/IntroPage';
import ThemeSync from './components/ThemeSync';
import ChatWidget from './components/Chat/ChatWidget';
import AIAssistantWidget from './components/AI/AIAssistantWidget';
import WelcomeOverlay from './components/WelcomeOverlay';
import FieldAssistantLocationTracker from './components/FieldAssistantLocationTracker';
import NotFoundPage from './pages/NotFoundPage';

const MorphoCheckPro = lazy(() => import('./pages/MorphoCheckPro'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const SuperAdminPage = lazy(() => import('./pages/SuperAdminPage'));
const ResearcherPage = lazy(() => import('./pages/ResearcherPage'));
const InfoDetail = lazy(() => import('./pages/InfoDetail'));
const AuthorPage = lazy(() => import('./pages/AuthorPage'));
const GuidelinesPage = lazy(() => import('./pages/GuidelinesPage'));
const PrivacyCompliancePage = lazy(
  () => import('./pages/PrivacyCompliancePage')
);
const AnalyticsDashboard = lazy(() => import('./pages/AnalyticsDashboard'));
const MAX_VISIBLE_TOASTS = 3;
const CHUNK_RELOAD_KEY = 'morphocheck_chunk_reload_attempted';

const isChunkLoadError = (error) => {
  const message = String(error?.message || error || '');
  const name = String(error?.name || '');
  return (
    name === 'ChunkLoadError' ||
    message.includes('Loading chunk') ||
    message.includes('ChunkLoadError') ||
    message.includes('Failed to fetch dynamically imported module')
  );
};

const clearBrowserBuildCache = async () => {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      registrations.map((registration) => registration.unregister())
    );
  }
  if ('caches' in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
  }
};

class ChunkLoadBoundary extends Component {
  state = { chunkError: false };

  static getDerivedStateFromError(error) {
    return isChunkLoadError(error) ? { chunkError: true } : null;
  }

  componentDidMount() {
    if (!this.state.chunkError) sessionStorage.removeItem(CHUNK_RELOAD_KEY);
  }

  componentDidCatch(error) {
    if (!isChunkLoadError(error)) throw error;
    if (sessionStorage.getItem(CHUNK_RELOAD_KEY) === '1') return;
    sessionStorage.setItem(CHUNK_RELOAD_KEY, '1');
    clearBrowserBuildCache().finally(() => window.location.reload());
  }

  componentDidUpdate() {
    if (!this.state.chunkError) sessionStorage.removeItem(CHUNK_RELOAD_KEY);
  }

  render() {
    if (!this.state.chunkError) return this.props.children;
    return (
      <div className="container py-5 text-center">
        <h3>Ilova yangilandi</h3>
        <p>Yangi fayllarni olish uchun sahifani qayta yuklang.</p>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => window.location.reload()}
        >
          Qayta yuklash
        </button>
      </div>
    );
  }
}

function ToastLimit() {
  const { toasts } = useToasterStore();

  useEffect(() => {
    const visibleToasts = toasts.filter((item) => item.visible);

    visibleToasts.slice(MAX_VISIBLE_TOASTS).forEach((item) => {
      toast.dismiss(item.id);
    });
  }, [toasts]);

  return null;
}

// 404 removed in favor of NotFoundPage component
// Page Transition komponenti
const PageTransition = ({ children }) => (
  <motion.div
    initial={{ opacity: 0.01 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{
      type: 'tween',
      ease: [0.22, 1, 0.36, 1],
      duration: 0.32,
    }}
    style={{
      width: '100%',
      minHeight: '100%',
    }}
  >
    {children}
  </motion.div>
);

const ConditionalFooter = () => {
  const { pathname } = useLocation();
  const isSuperAdminPage =
    pathname === '/superadmin' || pathname.startsWith('/superadmin/');

  return isSuperAdminPage ? null : <Footer />;
};

// Marshrut almashganda oynani yuqoriga ko'tarish
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'auto' });
    });
  }, [pathname]);
  return null;
}

// Loading komponenti — barcha Wrapper komponentlaridan oldin e'lon qilinadi
const PageLoader = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="container py-5 text-center"
    style={{
      minHeight: '60vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
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
          ease: 'linear',
        },
        scale: {
          duration: 0.8,
          repeat: Infinity,
          ease: 'easeInOut',
        },
      }}
      style={{
        width: '50px',
        height: '50px',
        border: '3px solid #f3f3f3',
        borderTop: '3px solid #0f766e',
        borderRadius: '50%',
        marginBottom: '1rem',
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

const RestrictedAccess = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="container py-5 text-center"
    style={{
      minHeight: '60vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
    }}
  >
    <div
      style={{
        padding: '2rem',
        background: 'rgba(239, 68, 68, 0.1)',
        borderRadius: '16px',
        border: '1px solid rgba(239, 68, 68, 0.2)',
      }}
    >
      <h3 style={{ color: '#EF4444', marginBottom: '1rem', fontWeight: 800 }}>
        Faoliyatingiz vaqtinchalik cheklangan!
      </h3>
      <p className="text-muted mb-0" style={{ fontSize: '1.1rem' }}>
        Adminlarga murojaat qiling!
      </p>
    </div>
  </motion.div>
);

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
  if (user.is_restricted === 1) {
    return <RestrictedAccess />;
  }

  if (user.role === 'researcher') {
    return <Navigate to="/researcher" replace />;
  }

  if (
    user.role === 'field_assistant' &&
    user.supervisor_role === 'researcher'
  ) {
    return <Navigate to="/researcher?section=analyze" replace />;
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

  if (user?.role === 'superadmin') {
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

  const isResearcherAssistant =
    user?.role === 'field_assistant' && user?.supervisor_role === 'researcher';

  if (user?.is_restricted === 1) {
    return <RestrictedAccess />;
  }

  if (
    user?.role === 'researcher' ||
    user?.role === 'superadmin' ||
    isResearcherAssistant
  ) {
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

  const isResearcherAssistant =
    user?.role === 'field_assistant' && user?.supervisor_role === 'researcher';
  if (user?.role === 'researcher') {
    return <Navigate to="/researcher" replace />;
  }

  if (isResearcherAssistant) {
    return <Navigate to="/researcher?section=analyze" replace />;
  }

  if (user?.role === 'field_assistant' && user?.supervisor_role === 'admin') {
    return <Navigate to="/morphocheck-pro" replace />;
  }

  return (
    <PageTransition>
      <IntroPage />
    </PageTransition>
  );
};

const ProWrapper = () => {
  const { user, loading } = useAuth();

  if (loading) return <PageLoader />;

  if (user?.is_restricted === 1) {
    return <RestrictedAccess />;
  }

  return (
    <PageTransition>
      <MorphoCheckPro />
    </PageTransition>
  );
};

// Animated Routes komponenti
function AnimatedRoutes() {
  const location = useLocation();
  const { justLoggedIn, completeLoginTransition } = useAuth();

  return (
    <>
      <AnimatePresence initial={false}>
        {justLoggedIn && (
          <WelcomeOverlay onComplete={completeLoginTransition} />
        )}
      </AnimatePresence>
      <AnimatePresence mode="wait" initial={false}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<HomeWrapper />} />
          <Route path="/morphocheck-pro" element={<ProWrapper />} />
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
          <Route
            path="/guidelines"
            element={
              <PageTransition>
                <GuidelinesPage />
              </PageTransition>
            }
          />
          <Route
            path="/privacy-compliance"
            element={
              <PageTransition>
                <PrivacyCompliancePage />
              </PageTransition>
            }
          />
          <Route path="/admin" element={<AdminWrapper />} />
          <Route path="/superadmin" element={<SuperAdminWrapper />} />
          <Route path="/researcher" element={<ResearcherWrapper />} />
          <Route
            path="/morphoadmin"
            element={<Navigate to="/superadmin" replace />}
          />
          {/* 3-bosqich: Analytics Dashboard */}
          <Route
            path="/analytics"
            element={
              <PageTransition>
                <AnalyticsDashboard />
              </PageTransition>
            }
          />
          <Route
            path="*"
            element={
              <PageTransition>
                <NotFoundPage />
              </PageTransition>
            }
          />
        </Routes>
      </AnimatePresence>
      <AnimatePresence initial={false}>
        <motion.div
          key={`${location.pathname}${location.search}`}
          aria-hidden="true"
          initial={{ opacity: 0.18 }}
          animate={{ opacity: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1020,
            pointerEvents: 'none',
            background:
              'linear-gradient(135deg, rgba(15, 118, 110, 0.12), rgba(248, 194, 113, 0.08))',
          }}
        />
      </AnimatePresence>
    </>
  );
}

export default function App() {
  const BASENAME = process.env.REACT_APP_BASENAME || '/';

  return (
    <MotionConfig reducedMotion="user">
      <LanguageProvider>
        <ToastLimit />
        <Toaster
          position="top-right"
          reverseOrder={false}
          toastOptions={{
            duration: 5000,
            style: {
              background: '#333',
              color: '#fff',
              borderRadius: '12px',
              fontSize: '14px',
              padding: '12px 20px',
            },
            success: {
              iconTheme: {
                primary: '#10B981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#EF4444',
                secondary: '#fff',
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
              <FieldAssistantLocationTracker />

              <div className="App d-flex flex-column min-vh-100">
                <Header />

                <main className="flex-grow-1">
                  <ChunkLoadBoundary>
                    <Suspense fallback={<PageLoader />}>
                      <AnimatedRoutes />
                    </Suspense>
                  </ChunkLoadBoundary>
                </main>

                <ChatWidget />
                <AIAssistantWidget />

                <ConditionalFooter />
              </div>
            </Router>
          </OfflineSyncProvider>
        </AuthProvider>
      </LanguageProvider>
    </MotionConfig>
  );
}
