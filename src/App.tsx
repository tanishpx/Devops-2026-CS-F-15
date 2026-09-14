import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Suspense, lazy, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./lib/auth";
import { ThemeProvider } from "./lib/theme";
import { ToastProvider } from "./components/Toast";

const Landing = lazy(() => import("./pages/Landing"));
const Auth = lazy(() => import("./pages/Auth"));
const FeedbackFormPage = lazy(() => import("./pages/FeedbackFormPage"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const FeedbackForms = lazy(() => import("./pages/admin/FeedbackForms"));
const Inbox = lazy(() => import("./pages/admin/Inbox"));
const Bugs = lazy(() => import("./pages/admin/Bugs"));
const Insights = lazy(() => import("./pages/admin/Insights"));
const Settings = lazy(() => import("./pages/admin/Settings"));

function PageLoader() {
  return (
    <div className="admin-loading">
      <div className="spinner" />
      <p>Loading...</p>
    </div>
  );
}

function ProtectedRoute() {
  const [user, setUser] = useState(auth.currentUser);
  const [loading, setLoading] = useState(!auth.currentUser);

  useEffect(() => {
    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="gate">
        <div className="spinner" />
        <p>Checking access...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth?redirect=%2Fadmin" replace />;
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <AdminLayout />
    </Suspense>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <ScrollToTop />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/feedback/:formId" element={<FeedbackFormPage />} />
            <Route path="/admin" element={<ProtectedRoute />}>
              <Route index element={<Navigate to="/admin/forms" replace />} />
              <Route path="forms" element={<FeedbackForms />} />
              <Route path="inbox" element={<Inbox />} />
              <Route path="bugs" element={<Bugs />} />
              <Route path="insights" element={<Insights />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </ToastProvider>
    </ThemeProvider>
  );
}
