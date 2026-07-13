import { motion } from 'motion/react';
import { Clock, Bell, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router';

export default function BrokerPendingPage() {
  const { user } = useAuth();

  const status = (user as any)?.brokerApplicationStatus;

  return (
    <div className="min-h-screen bg-background pt-20 flex items-center justify-center">
      <div className="max-w-lg mx-auto px-6 text-center">
        {status === 'rejected' ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
            <h1 className="text-2xl font-black text-foreground mb-3" style={{ fontFamily: 'Urbanist, sans-serif' }}>
              Application Rejected
            </h1>
            <p className="text-muted-foreground text-sm mb-4">
              Unfortunately your broker application was not approved.
            </p>
            {(user as any)?.brokerApplicationNotes && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-left mb-6">
                <p className="text-xs font-semibold text-red-700 mb-1">Reason:</p>
                <p className="text-sm text-red-600">{(user as any).brokerApplicationNotes}</p>
              </div>
            )}
            <p className="text-sm text-muted-foreground mb-8">
              You can submit a new application after addressing the issues mentioned.
            </p>
            <Link to="/broker/apply"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-sm transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #E8B84B, #C9922A)', color: '#070C17' }}>
              Apply Again <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-6">
              <Clock className="w-10 h-10 text-amber-500 animate-pulse" />
            </div>
            <h1 className="text-2xl font-black text-foreground mb-3" style={{ fontFamily: 'Urbanist, sans-serif' }}>
              Application Under Review
            </h1>
            <p className="text-muted-foreground text-sm mb-8">
              Your broker application and payment have been received. Our team will review it within 24–48 hours.
            </p>

            <div className="space-y-3 text-left mb-8">
              {[
                { icon: CheckCircle, label: 'Application submitted', done: true },
                { icon: CheckCircle, label: 'Payment received', done: true },
                { icon: Clock, label: 'Admin review', done: false },
                { icon: Bell, label: 'Approval notification', done: false },
              ].map(({ icon: Icon, label, done }) => (
                <div key={label} className="flex items-center gap-3 p-3 rounded-xl bg-muted/40">
                  <Icon className={`w-4 h-4 ${done ? 'text-green-500' : 'text-muted-foreground'}`} />
                  <span className={`text-sm ${done ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                    {label}
                  </span>
                  {done && <span className="ml-auto text-xs font-semibold text-green-600">Done</span>}
                </div>
              ))}
            </div>

            <Link to="/"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-sm border-2 border-border text-foreground hover:border-amber-500 transition-colors">
              Back to Home
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
}
