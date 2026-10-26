import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider } from '../context/AuthContext';
import { SocketProvider } from '../context/SocketContext';
import { ProtectedRoute } from '../components/ProtectedRoute';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

// Auth pages — small, load eagerly
import { LoginPage } from './components/LoginPage';
import { SignupPage } from './components/SignupPage';
import { ForgotPasswordPage } from './components/ForgotPasswordPage';
import { ResetPasswordPage } from './components/ResetPasswordPage';
import { VerifyEmailPage } from './components/VerifyEmailPage';

// Lazy load heavier pages
const HomePage = lazy(() => import('../pages/HomePage'));
const PropertiesPage = lazy(() => import('../pages/PropertiesPage'));
const PropertyDetailPage = lazy(() => import('../pages/PropertyDetailPage'));
const FavoritesPage = lazy(() => import('../pages/FavoritesPage'));
const InquiriesPage = lazy(() => import('../pages/InquiriesPage'));
const ProfilePage = lazy(() => import('../pages/ProfilePage'));
const PremiumPage = lazy(() => import('../pages/PremiumPage'));
const MessagesPage = lazy(() => import('../pages/MessagesPage'));
const BrokerApplyPage = lazy(() => import('../pages/BrokerApplyPage'));
const BrokerPendingPage = lazy(() => import('../pages/BrokerPendingPage'));
const AdminDashboard = lazy(() => import('../pages/AdminDashboard'));
const OwnerDashboard = lazy(() => import('../pages/OwnerDashboard'));
const BrokerDashboard = lazy(() => import('../pages/BrokerDashboard'));
const ContactPage = lazy(() => import('../pages/ContactPage'));
const AboutPage = lazy(() => import('../pages/AboutPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SocketProvider>
          <Router>
            <div style={{ fontFamily: 'Outfit, Urbanist, sans-serif' }} className="bg-background text-foreground min-h-screen flex flex-col">
              <Navbar />
              <main className="flex-1">
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    {/* Public */}
                    <Route path="/" element={<HomePage />} />
                    <Route path="/properties" element={<PropertiesPage />} />
                    <Route path="/properties/:id" element={<PropertyDetailPage />} />
                    <Route path="/premium" element={<PremiumPage />} />
                    <Route path="/contact" element={<ContactPage />} />
                    <Route path="/about" element={<AboutPage />} />

                    {/* Auth */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignupPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
                    <Route path="/verify-email/:token" element={<VerifyEmailPage />} />

                    {/* Protected — any logged-in user */}
                    <Route element={<ProtectedRoute />}>
                      <Route path="/profile" element={<ProfilePage />} />
                      <Route path="/favorites" element={<FavoritesPage />} />
                      <Route path="/inquiries" element={<InquiriesPage />} />
                      <Route path="/messages" element={<MessagesPage />} />
                      <Route path="/messages/:partnerId" element={<MessagesPage />} />
                      <Route path="/broker/apply" element={<BrokerApplyPage />} />
                      <Route path="/broker/pending" element={<BrokerPendingPage />} />
                    </Route>

                    {/* Role-based */}
                    <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                      <Route path="/admin" element={<AdminDashboard />} />
                    </Route>
                    <Route element={<ProtectedRoute allowedRoles={['owner', 'renter']} />}>
                      <Route path="/owner" element={<OwnerDashboard />} />
                    </Route>
                    <Route element={<ProtectedRoute allowedRoles={['broker']} />}>
                      <Route path="/broker" element={<BrokerDashboard />} />
                    </Route>

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Suspense>
              </main>
              <Footer />
            </div>
            <Toaster position="top-right" richColors />
          </Router>
        </SocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
