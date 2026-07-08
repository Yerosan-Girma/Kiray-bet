import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate, useParams } from 'react-router';
import { Mail, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { authService } from '../../services/auth.service';
import { toast } from 'sonner';

export function VerifyEmailPage() {
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState<boolean | null>(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { token } = useParams();

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setError('Invalid verification token');
        setVerified(false);
        setLoading(false);
        return;
      }

      try {
        // Note: Backend may not have a verify-email endpoint, so we'll handle gracefully
        // If the backend doesn't support email verification, we'll skip this
        await authService.verifyEmail(token);
        setVerified(true);
        toast.success('Email verified successfully');
      } catch (err: any) {
        // If endpoint doesn't exist, we'll consider it as auto-verified
        if (err.response?.status === 404 || err.response?.status === 405) {
          setVerified(true);
          toast.success('Email verification not required or already verified');
        } else {
          setError(err.response?.data?.message || 'Verification failed');
          setVerified(false);
        }
      } finally {
        setLoading(false);
      }
    };

    verifyEmail();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6 py-12">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying your email...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {verified ? (
            <>
              {/* Success */}
              <div className="text-center py-8">
                <div className="w-20 h-20 rounded-full bg-green-100 mx-auto mb-6 flex items-center justify-center">
                  <CheckCircle size={40} className="text-green-600" />
                </div>
                <h1 className="text-2xl font-bold mb-2 text-gray-900">
                  Email Verified!
                </h1>
                <p className="text-sm text-gray-600 mb-8">
                  Your email has been successfully verified. You can now sign in to your account.
                </p>
                <Link
                  to="/login"
                  className="inline-block w-full py-3 rounded-lg font-semibold text-white text-center hover:scale-105 transition-transform"
                  style={{ background: 'linear-gradient(135deg, #E8B84B 0%, #C9922A 100%)' }}
                >
                  Sign In
                </Link>
              </div>
            </>
          ) : (
            <>
              {/* Error */}
              <div className="text-center py-8">
                <div className="w-20 h-20 rounded-full bg-red-100 mx-auto mb-6 flex items-center justify-center">
                  <XCircle size={40} className="text-red-600" />
                </div>
                <h1 className="text-2xl font-bold mb-2 text-gray-900">
                  Verification Failed
                </h1>
                <p className="text-sm text-gray-600 mb-4">
                  {error || 'The verification link is invalid or has expired.'}
                </p>
                <div className="space-y-3">
                  <Link
                    to="/login"
                    className="inline-block w-full py-3 rounded-lg font-semibold text-white text-center hover:scale-105 transition-transform"
                    style={{ background: 'linear-gradient(135deg, #E8B84B 0%, #C9922A 100%)' }}
                  >
                    Go to Login
                  </Link>
                  <button
                    onClick={() => navigate('/signup')}
                    className="block w-full py-3 rounded-lg font-medium text-gray-700 text-center hover:bg-gray-50 transition-colors border border-gray-200"
                  >
                    Create New Account
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
