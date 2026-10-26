import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  Briefcase, MapPin, Clock, FileText, CreditCard,
  CheckCircle, ArrowRight, ArrowLeft, User, Building2, Phone,
} from 'lucide-react';
import { brokerService } from '../services/broker.service';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const STEPS = ['Application', 'Payment', 'Confirm Payment', 'Confirmation'];

const PAYMENT_METHODS = [
  { id: 'telebirr', label: 'Telebirr (Mock)', icon: '📱', description: 'Instant mobile payment simulation' },
  { id: 'bank_transfer', label: 'Bank Transfer (Mock)', icon: '🏦', description: 'Direct bank transfer simulation' },
];

export default function BrokerApplyPage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    companyName: '',
    officeAddress: '',
    yearsExperience: '',
    description: '',
    nationalId: '',
    paymentMethod: 'telebirr' as 'telebirr' | 'bank_transfer',
  });
  const [transactionId, setTransactionId] = useState<string | null>(null);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const result = await brokerService.applyBroker({
        ...form,
        yearsExperience: Number(form.yearsExperience) || 0,
      });
      // Store transaction ID for confirmation step
      setTransactionId(result.data.transaction._id);
      setStep(2); // Move to confirm payment step
      toast.success('Payment initiated! Please confirm to complete application.');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to initiate payment');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!transactionId) return;
    setLoading(true);
    try {
      await brokerService.confirmBrokerPayment(transactionId);
      // Update local user state to reflect pending status
      updateUser({ brokerApplicationStatus: 'pending' } as any);
      setStep(3); // Move to confirmation step
      toast.success('Payment confirmed! Application submitted for review.');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to confirm payment');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid =
    form.officeAddress.trim() &&
    form.description.trim() &&
    form.yearsExperience;

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #E8B84B, #C9922A)' }}>
            <Briefcase className="w-8 h-8 text-[#070C17]" />
          </div>
          <h1 className="text-3xl font-black text-foreground" style={{ fontFamily: 'Urbanist, sans-serif' }}>
            Become a Broker
          </h1>
          <p className="text-muted-foreground text-sm mt-2">
            Join our network of professional property brokers
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-0 mb-10">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={`flex flex-col items-center gap-1 ${i <= step ? '' : 'opacity-40'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  i < step ? 'bg-green-500 text-white' :
                  i === step ? 'text-[#070C17]' : 'bg-muted text-muted-foreground'
                }`}
                style={i === step ? { background: 'linear-gradient(135deg, #E8B84B, #C9922A)' } : {}}>
                  {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
                </div>
                <span className="text-xs font-medium text-muted-foreground">{s}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-16 h-0.5 mx-2 mb-4 transition-all ${i < step ? 'bg-green-500' : 'bg-border'}`} />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 0: Application Form */}
          {step === 0 && (
            <motion.div key="form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-3xl border border-border shadow-sm p-8 space-y-5">
              <h2 className="font-bold text-foreground text-xl mb-2">Your Application</h2>

              {/* Read-only user info */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-muted/40">
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Full Name</p>
                  <p className="font-semibold text-foreground text-sm">{user?.name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Email</p>
                  <p className="font-semibold text-foreground text-sm">{user?.email}</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                  Company Name (optional)
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                    placeholder="Your real estate company"
                    className="w-full pl-10 pr-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:border-amber-500 text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                  National ID (optional)
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input value={form.nationalId} onChange={(e) => setForm({ ...form, nationalId: e.target.value })}
                    placeholder="National ID number"
                    className="w-full pl-10 pr-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:border-amber-500 text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                  Office Address *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input required value={form.officeAddress} onChange={(e) => setForm({ ...form, officeAddress: e.target.value })}
                    placeholder="e.g. Westlands, Nairobi"
                    className="w-full pl-10 pr-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:border-amber-500 text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                  Years of Experience *
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input required type="number" min="0" max="50" value={form.yearsExperience}
                    onChange={(e) => setForm({ ...form, yearsExperience: e.target.value })}
                    placeholder="e.g. 3"
                    className="w-full pl-10 pr-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:border-amber-500 text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                  Personal Description *
                </label>
                <textarea required rows={4} value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Tell us about your experience and why you want to join NestHub..."
                  className="w-full px-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:border-amber-500 text-sm resize-none" />
              </div>

              <button onClick={() => setStep(1)} disabled={!isFormValid}
                className="w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all hover:scale-[1.02]"
                style={{ background: 'linear-gradient(135deg, #E8B84B, #C9922A)', color: '#070C17' }}>
                Continue to Payment <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {/* Step 1: Payment */}
          {step === 1 && (
            <motion.div key="payment" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-3xl border border-border shadow-sm p-8">
              <button onClick={() => setStep(0)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>

              <h2 className="font-bold text-foreground text-xl mb-2">Registration Fee</h2>
              <p className="text-muted-foreground text-sm mb-6">
                A one-time registration fee is required to process your broker application.
              </p>

              {/* Fee summary */}
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-amber-800">Broker Registration Fee</span>
                  <span className="text-xl font-black text-amber-700">ETB 500</span>
                </div>
                <p className="text-xs text-amber-600 mt-1">One-time, non-refundable</p>
              </div>

              {/* Payment method */}
              <div className="space-y-3 mb-6">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Select Payment Method</p>
                {PAYMENT_METHODS.map((m) => (
                  <label key={m.id}
                    className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      form.paymentMethod === m.id ? 'border-amber-500 bg-amber-50' : 'border-border hover:border-amber-200'
                    }`}>
                    <input type="radio" name="paymentMethod" value={m.id}
                      checked={form.paymentMethod === m.id}
                      onChange={(e) => setForm({ ...form, paymentMethod: e.target.value as any })}
                      className="sr-only" />
                    <span className="text-2xl">{m.icon}</span>
                    <div>
                      <p className="font-semibold text-foreground text-sm">{m.label}</p>
                      <p className="text-xs text-muted-foreground">{m.description}</p>
                    </div>
                    {form.paymentMethod === m.id && (
                      <CheckCircle className="w-5 h-5 text-amber-500 ml-auto" />
                    )}
                  </label>
                ))}
              </div>

              <button onClick={handleSubmit} disabled={loading}
                className="w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all hover:scale-[1.02]"
                style={{ background: 'linear-gradient(135deg, #E8B84B, #C9922A)', color: '#070C17' }}>
                {loading
                  ? <><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> Processing...</>
                  : <><CreditCard className="w-4 h-4" /> Initiate Payment</>}
              </button>

              <p className="text-xs text-center text-muted-foreground mt-4">
                🔒 This is a mock payment. No real money will be charged.
              </p>
            </motion.div>
          )}

          {/* Step 2: Confirm Payment */}
          {step === 2 && (
            <motion.div key="confirm-payment" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-3xl border border-border shadow-sm p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-6">
                <CreditCard className="w-10 h-10 text-blue-500" />
              </div>
              <h2 className="text-2xl font-black text-foreground mb-3" style={{ fontFamily: 'Urbanist, sans-serif' }}>
                Confirm Payment
              </h2>
              <p className="text-muted-foreground text-sm mb-2">
                Payment has been initiated for ETB 500
              </p>
              <p className="text-muted-foreground text-sm mb-8">
                Please confirm the payment to complete your broker application submission.
              </p>

              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 mb-8 text-left">
                <p className="text-xs font-semibold text-blue-800 uppercase mb-3">Payment Details</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-700">Amount</span>
                    <span className="font-bold text-blue-900">ETB 500</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Method</span>
                    <span className="font-bold text-blue-900 capitalize">{form.paymentMethod}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} disabled={loading}
                  className="flex-1 py-3 rounded-xl border-2 border-border font-semibold text-sm text-foreground hover:bg-muted transition-colors disabled:opacity-50">
                  Cancel
                </button>
                <button onClick={handleConfirmPayment} disabled={loading}
                  className="flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all hover:scale-[1.02]"
                  style={{ background: 'linear-gradient(135deg, #E8B84B, #C9922A)', color: '#070C17' }}>
                  {loading
                    ? <><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> Confirming...</}
                    : <><CheckCircle className="w-4 h-4" /> Confirm Payment</>}
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && (
            <motion.div key="confirm" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl border border-border shadow-sm p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <h2 className="text-2xl font-black text-foreground mb-3" style={{ fontFamily: 'Urbanist, sans-serif' }}>
                Application Submitted!
              </h2>
              <p className="text-muted-foreground text-sm mb-2">
                Your broker application and payment have been received.
              </p>
              <p className="text-muted-foreground text-sm mb-8">
                Our admin team will review your application and notify you within 24–48 hours.
              </p>

              <div className="p-4 rounded-2xl bg-muted/40 text-left mb-8">
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-3">What happens next?</p>
                {[
                  'Payment confirmed successfully',
                  'Admin reviews your application',
                  'You receive an approval or rejection notification',
                  'Once approved, your role changes to Broker',
                  'You can access the Broker Dashboard',
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3 mb-2">
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-sm text-foreground">{step}</p>
                  </div>
                ))}
              </div>

              <button onClick={() => navigate('/')}
                className="w-full py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.02]"
                style={{ background: 'linear-gradient(135deg, #E8B84B, #C9922A)', color: '#070C17' }}>
                Back to Home
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
