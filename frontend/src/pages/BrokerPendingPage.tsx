import { motion } from 'motion/react';
import { Clock, Bell, CheckCircle, XCircle, ArrowRight, CreditCard, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router';

export default function BrokerPendingPage() {
  const { user } = useAuth();

  const status = (user as any)?.brokerApplicationStatus || 'none';
  const isApproved = (user as any)?.isApproved;
  const isBroker = user?.role === 'broker';

  return (
    <div className="min-h-screen bg-background pt-20 flex items-center justify-center">
      <div className="max-w-lg mx-auto px-6 text-center py-12">
        {/* Approved */}
        {(status === 'approved' || (isBroker && isApproved)) ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <ShieldCheck className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-black text-foreground mb-3" style={{ fontFamily: 'Urbanist, sans-serif' }}>
              Broker Application Approved!
            </h1>
            <p className="text-muted-foreground text-sm mb-6">
              Congratulations! Your payment has been confirmed and an administrator has approved your broker application.
            </p>
            <Link to="/broker"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #E8B84B, #C9922A)', color: '#070C17' }}>
              Go to Broker Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        ) : status === 'rejected' ? (
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
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #E8B84B, #C9922A)', color: '#070C17' }}>
              Apply Again <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        ) : status === 'payment_pending' ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-6">
              <CreditCard className="w-10 h-10 text-amber-600 animate-bounce" />
            </div>
            <h1 className="text-2xl font-black text-foreground mb-3" style={{ fontFamily: 'Urbanist, sans-serif' }}>
              Payment Required (500 ETB)
            </h1>
            <p className="text-muted-foreground text-sm mb-4">
              Your broker application details have been saved, but your application cannot be submitted for admin review until the registration fee is paid.
            </p>
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-left mb-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-amber-800">Required Fee:</span>
                <span className="font-bold text-amber-900">500 ETB</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-amber-800">Status:</span>
                <span className="font-semibold text-amber-700">Awaiting Payment Confirmation</span>
              </div>
            </div>
            <Link to="/broker/apply"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #E8B84B, #C9922A)', color: '#070C17' }}>
              Complete 500 ETB Payment <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        ) : status === 'pending' ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-6">
              <Clock className="w-10 h-10 text-amber-500 animate-pulse" />
            </div>
            <h1 className="text-2xl font-black text-foreground mb-3" style={{ fontFamily: 'Urbanist, sans-serif' }}>
              Application Under Admin Review
            </h1>
            <p className="text-muted-foreground text-sm mb-8">
              Your broker application and 500 ETB payment have been received and verified. An administrator will review your application shortly.
            </p>

            <div className="space-y-3 text-left mb-8">
              {[
                { icon: CheckCircle, label: 'Application submitted', done: true },
                { icon: CheckCircle, label: 'Payment of 500 ETB verified', done: true },
                { icon: Clock, label: 'Admin review & approval', done: false },
                { icon: Bell, label: 'Access to Broker Dashboard', done: false },
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
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-6">
              <CreditCard className="w-10 h-10 text-blue-600" />
            </div>
            <h1 className="text-2xl font-black text-foreground mb-3" style={{ fontFamily: 'Urbanist, sans-serif' }}>
              No Broker Application Found
            </h1>
            <p className="text-muted-foreground text-sm mb-8">
              To become an approved broker on Kiray Bet, you must submit an application and pay the 500 ETB registration fee.
            </p>
            <Link to="/broker/apply"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #E8B84B, #C9922A)', color: '#070C17' }}>
              Apply to Become a Broker <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
}
