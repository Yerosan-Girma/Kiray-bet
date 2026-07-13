import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { Award, CheckCircle, CreditCard, Loader, AlertCircle } from 'lucide-react';
import { paymentService } from '../services/payment.service';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const PLANS = [
  {
    id: 'monthly',
    label: 'Monthly',
    price: 1500,
    duration: '1 month',
    features: ['Unlimited listings', 'Premium badge', 'Priority support', 'Analytics dashboard'],
  },
  {
    id: 'quarterly',
    label: 'Quarterly',
    price: 3500,
    duration: '3 months',
    features: ['All monthly features', '15% discount', 'Featured placement', 'Advanced analytics'],
    recommended: true,
  },
  {
    id: 'annual',
    label: 'Annual',
    price: 10000,
    duration: '12 months',
    features: ['All quarterly features', '40% discount', 'Top placement', 'Dedicated support'],
  },
];

const METHODS = [
  { id: 'mpesa', label: 'M-Pesa', icon: '📱' },
  { id: 'chapa', label: 'Chapa', icon: '💳' },
  { id: 'telebirr', label: 'Telebirr', icon: '📞' },
];

export default function PremiumPage() {
  const { user, updateUser } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState('quarterly');
  const [selectedMethod, setSelectedMethod] = useState<'mpesa' | 'chapa' | 'telebirr'>('mpesa');
  const [loading, setLoading] = useState(false);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'polling' | 'success' | 'failed'>('idle');

  const plan = PLANS.find((p) => p.id === selectedPlan)!;

  const { data: historyData } = useQuery({
    queryKey: ['paymentHistory'],
    queryFn: () => paymentService.getPaymentHistory({ limit: 5 }),
    enabled: !!user,
    staleTime: 60_000,
  });

  // Poll payment status
  const { data: statusData } = useQuery({
    queryKey: ['paymentStatus', transactionId],
    queryFn: () => paymentService.getPaymentStatus(transactionId!),
    enabled: !!transactionId && status === 'polling',
    refetchInterval: 3000,
  });

  // Check if status resolved
  if (statusData?.data?.status === 'success' && status === 'polling') {
    setStatus('success');
    updateUser({ isPremium: true });
    toast.success('Premium activated! Enjoy your benefits.');
  }
  if (statusData?.data?.status === 'failed' && status === 'polling') {
    setStatus('failed');
    toast.error('Payment failed. Please try again.');
  }

  const handlePayment = async () => {
    setLoading(true);
    try {
      const res = await paymentService.createPayment({ amount: plan.price, paymentMethod: selectedMethod });
      setTransactionId(res.data._id);
      setStatus('polling');
      toast.success('Payment initiated. Please complete it on your phone.');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'success') return (
    <div className="min-h-screen bg-background pt-20 flex items-center justify-center">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="text-center p-12">
        <div className="w-24 h-24 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-6">
          <Award className="w-12 h-12 text-amber-500" />
        </div>
        <h1 className="text-3xl font-black text-foreground mb-3" style={{ fontFamily: 'Urbanist, sans-serif' }}>
          You're Premium! 🎉
        </h1>
        <p className="text-muted-foreground mb-8">Your premium subscription is now active.</p>
        <a href="/" className="px-8 py-3 rounded-xl font-bold text-sm inline-block"
          style={{ background: 'linear-gradient(135deg, #E8B84B, #C9922A)', color: '#070C17' }}>
          Go to Home
        </a>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 text-sm font-semibold"
            style={{ background: 'rgba(232,184,75,0.12)', border: '1px solid rgba(232,184,75,0.3)', color: '#E8B84B' }}>
            <Award className="w-4 h-4" /> Premium Membership
          </div>
          <h1 className="text-4xl font-black text-foreground mb-3" style={{ fontFamily: 'Urbanist, sans-serif' }}>
            Upgrade to Premium
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto text-sm">
            Unlock unlimited listings, premium badge, and advanced analytics to grow your rental business.
          </p>
          {user?.isPremium && (
            <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full bg-green-100 text-green-700 text-sm font-semibold">
              <CheckCircle className="w-4 h-4" /> You are already a Premium member
            </div>
          )}
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          {PLANS.map((p) => (
            <motion.div key={p.id} whileHover={{ y: -4 }}
              onClick={() => setSelectedPlan(p.id)}
              className={`relative rounded-3xl border-2 p-6 cursor-pointer transition-all ${
                selectedPlan === p.id ? 'border-amber-500 bg-amber-50' : 'border-border bg-white hover:border-amber-200'
              }`}>
              {p.recommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold text-[#070C17]"
                  style={{ background: 'linear-gradient(135deg, #E8B84B, #C9922A)' }}>
                  Most Popular
                </div>
              )}
              <div className="mb-4">
                <h3 className="font-black text-foreground text-lg">{p.label}</h3>
                <p className="text-muted-foreground text-xs">{p.duration}</p>
              </div>
              <div className="mb-5">
                <span className="text-3xl font-black text-foreground">ETB {p.price.toLocaleString()}</span>
              </div>
              <ul className="space-y-2">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                    <CheckCircle className="w-4 h-4 text-amber-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Payment method + checkout */}
        {!user?.isPremium && (
          <div className="bg-white rounded-3xl border border-border shadow-sm p-6 max-w-md mx-auto">
            <h3 className="font-bold text-foreground mb-4">Payment Method</h3>
            <div className="flex gap-3 mb-6">
              {METHODS.map((m) => (
                <button key={m.id} onClick={() => setSelectedMethod(m.id as any)}
                  className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                    selectedMethod === m.id ? 'border-amber-500 bg-amber-50' : 'border-border hover:border-amber-200'
                  }`}>
                  <span className="text-2xl">{m.icon}</span>
                  {m.label}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between py-3 border-t border-border mb-4">
              <span className="text-sm text-muted-foreground">{plan.label} plan</span>
              <span className="font-bold text-foreground">ETB {plan.price.toLocaleString()}</span>
            </div>

            {status === 'polling' && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 mb-4">
                <Loader className="w-5 h-5 text-amber-500 animate-spin" />
                <p className="text-sm text-amber-700">Waiting for payment confirmation...</p>
              </div>
            )}

            {status === 'failed' && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 mb-4">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <p className="text-sm text-red-700">Payment failed. Try again.</p>
              </div>
            )}

            <button onClick={handlePayment} disabled={loading || status === 'polling'}
              className="w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all hover:scale-[1.02]"
              style={{ background: 'linear-gradient(135deg, #E8B84B, #C9922A)', color: '#070C17' }}>
              {loading
                ? <><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> Processing...</>
                : <><CreditCard className="w-4 h-4" /> Pay ETB {plan.price.toLocaleString()}</>}
            </button>
          </div>
        )}

        {/* Payment history */}
        {historyData?.data?.length > 0 && (
          <div className="mt-10">
            <h3 className="font-bold text-foreground mb-4">Payment History</h3>
            <div className="bg-white rounded-2xl border border-border overflow-hidden">
              {historyData.data.map((tx: any) => (
                <div key={tx._id} className="flex items-center justify-between px-5 py-3 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground capitalize">{tx.paymentMethod}</p>
                    <p className="text-xs text-muted-foreground">{new Date(tx.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-foreground text-sm">ETB {tx.amount?.toLocaleString()}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      tx.status === 'success' ? 'bg-green-100 text-green-700' :
                      tx.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>{tx.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
