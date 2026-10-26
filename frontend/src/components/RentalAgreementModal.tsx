import { useState } from 'react';
import { motion } from 'motion/react';
import {
  Calendar, DollarSign, FileText, Key, CheckCircle, X,
  Users, Clock, CreditCard, AlertCircle,
} from 'lucide-react';
import { rentService } from '../services/rent.service';
import { toast } from 'sonner';

interface RentalAgreementModalProps {
  house: any;
  tenant: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RentalAgreementModal({
  house,
  tenant,
  onClose,
  onSuccess,
}: RentalAgreementModalProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    leaseStartDate: '',
    leaseEndDate: '',
    monthlyRent: String(house.price || 0),
    securityDeposit: '',
    paymentSchedule: 'monthly' as 'monthly' | 'quarterly' | 'yearly',
    paymentMethod: 'bank_transfer' as 'cash' | 'bank_transfer' | 'telebirr' | 'chapa' | 'mpesa',
    terms: '',
    isAutoRenew: false,
    noticePeriod: '30',
  });

  const handleSubmit = async () => {
    if (!form.leaseStartDate || !form.leaseEndDate) {
      toast.error('Please select lease start and end dates');
      return;
    }

    const startDate = new Date(form.leaseStartDate);
    const endDate = new Date(form.leaseEndDate);
    if (startDate >= endDate) {
      toast.error('Lease end date must be after start date');
      return;
    }

    setLoading(true);
    try {
      await rentService.createRentalAgreement({
        houseId: house._id,
        tenantId: tenant._id,
        leaseStartDate: form.leaseStartDate,
        leaseEndDate: form.leaseEndDate,
        monthlyRent: Number(form.monthlyRent),
        securityDeposit: Number(form.securityDeposit) || 0,
        paymentSchedule: form.paymentSchedule,
        paymentMethod: form.paymentMethod,
        terms: form.terms,
        isAutoRenew: form.isAutoRenew,
        noticePeriod: Number(form.noticePeriod),
      });
      toast.success('Rental agreement created successfully! Owner has been notified.');
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create rental agreement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-white z-10">
          <div>
            <h2 className="font-bold text-foreground text-xl">Create Rental Agreement</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {house.title} · {tenant.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Info banner */}
          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-blue-800 text-sm">Rental Agreement</p>
              <p className="text-xs text-blue-600 mt-0.5">
                This will create a formal rental agreement and notify the property owner.
                The property will be marked as rented and hidden from listings.
              </p>
            </div>
          </div>

          {/* Tenant info */}
          <div className="p-4 rounded-2xl bg-muted/40 border border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Tenant</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm">
                {tenant.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">{tenant.name}</p>
                <p className="text-xs text-muted-foreground">{tenant.email}</p>
                {tenant.phone && <p className="text-xs text-muted-foreground">{tenant.phone}</p>}
              </div>
            </div>
          </div>

          {/* Lease dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">
                Lease Start Date *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="date"
                  value={form.leaseStartDate}
                  onChange={(e) => setForm({ ...form, leaseStartDate: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:border-amber-500 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">
                Lease End Date *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="date"
                  value={form.leaseEndDate}
                  onChange={(e) => setForm({ ...form, leaseEndDate: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:border-amber-500 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Financial details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">
                Monthly Rent (ETB) *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="number"
                  min="0"
                  value={form.monthlyRent}
                  onChange={(e) => setForm({ ...form, monthlyRent: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:border-amber-500 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">
                Security Deposit (ETB)
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="number"
                  min="0"
                  value={form.securityDeposit}
                  onChange={(e) => setForm({ ...form, securityDeposit: e.target.value })}
                  placeholder="Optional"
                  className="w-full pl-10 pr-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:border-amber-500 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Payment method */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">
              Payment Method *
            </label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <select
                value={form.paymentMethod}
                onChange={(e) => setForm({ ...form, paymentMethod: e.target.value as any })}
                className="w-full pl-10 pr-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:border-amber-500 text-sm bg-background"
              >
                <option value="bank_transfer">Bank Transfer</option>
                <option value="telebirr">Telebirr</option>
                <option value="chapa">Chapa</option>
                <option value="mpesa">M-Pesa</option>
                <option value="cash">Cash</option>
              </select>
            </div>
          </div>

          {/* Payment schedule */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">
              Payment Schedule *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['monthly', 'quarterly', 'yearly'] as const).map((schedule) => (
                <button
                  key={schedule}
                  type="button"
                  onClick={() => setForm({ ...form, paymentSchedule: schedule })}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border-2 transition-all capitalize ${
                    form.paymentSchedule === schedule
                      ? 'border-amber-500 bg-amber-50 text-amber-700'
                      : 'border-border text-muted-foreground hover:border-amber-300'
                  }`}
                >
                  {schedule}
                </button>
              ))}
            </div>
          </div>

          {/* Notice period */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">
              Notice Period (days)
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="number"
                min="1"
                value={form.noticePeriod}
                onChange={(e) => setForm({ ...form, noticePeriod: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:border-amber-500 text-sm"
              />
            </div>
          </div>

          {/* Terms */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">
              Terms & Conditions
            </label>
            <textarea
              rows={4}
              value={form.terms}
              onChange={(e) => setForm({ ...form, terms: e.target.value })}
              placeholder="Enter any special terms or conditions for this rental agreement..."
              className="w-full px-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:border-amber-500 text-sm resize-none"
            />
          </div>

          {/* Auto-renew */}
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-muted/40 border border-border">
            <input
              type="checkbox"
              id="autoRenew"
              checked={form.isAutoRenew}
              onChange={(e) => setForm({ ...form, isAutoRenew: e.target.checked })}
              className="w-5 h-5 rounded border-2 border-border text-amber-500 focus:ring-amber-500"
            />
            <label htmlFor="autoRenew" className="text-sm text-foreground cursor-pointer">
              Auto-renew lease after expiry
            </label>
          </div>

          {/* Warning */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-800 text-sm">Important</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Once created, the property will be marked as rented and hidden from public listings.
                The owner will be notified immediately. This action cannot be undone.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3 rounded-xl border-2 border-border font-semibold text-sm text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all hover:scale-[1.02]"
              style={{ background: 'linear-gradient(135deg, #E8B84B, #C9922A)', color: '#070C17' }}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Create Agreement
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
