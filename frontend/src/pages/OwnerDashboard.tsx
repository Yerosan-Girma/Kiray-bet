import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import {
  Home, Plus, Eye, MessageSquare, Clock, CheckCircle, XCircle,
  Upload, X, ArrowRight, Users, Image as ImageIcon,
} from 'lucide-react';
import { brokerService } from '../services/broker.service';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import type { House, User } from '../types';
import { Link } from 'react-router';

const PROPERTY_TYPES = ['apartment', 'house', 'condo', 'studio', 'villa', 'townhouse'];
const AMENITY_OPTIONS = ['WiFi', 'Parking', 'Pool', 'Gym', 'Garden', 'Security', 'Balcony', 'Air Conditioning'];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; icon: any }> = {
    pending_broker: { label: 'Pending Broker Review', cls: 'bg-yellow-100 text-yellow-700', icon: Clock },
    accepted: { label: 'Accepted by Broker', cls: 'bg-blue-100 text-blue-700', icon: CheckCircle },
    rejected: { label: 'Rejected', cls: 'bg-red-100 text-red-700', icon: XCircle },
    approved: { label: 'Published', cls: 'bg-green-100 text-green-700', icon: CheckCircle },
    pending: { label: 'Pending Admin', cls: 'bg-orange-100 text-orange-700', icon: Clock },
    rented: { label: 'Rented', cls: 'bg-purple-100 text-purple-700', icon: CheckCircle },
    none: { label: 'Draft', cls: 'bg-gray-100 text-gray-600', icon: Clock },
  };
  const { label, cls, icon: Icon } = map[status] || map.none;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${cls}`}>
      <Icon className="w-3 h-3" /> {label}
    </span>
  );
}

function SubmitModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [step, setStep] = useState(0); // 0=form, 1=pick broker
  const [form, setForm] = useState({
    title: '', description: '', price: '', location: '',
    bedrooms: '', bathrooms: '', propertyType: 'apartment',
    amenities: [] as string[], contactPhone: user?.phone || '',
    coordinates: { lat: '8.9939', lng: '38.7469' },
  });
  const [selectedBroker, setSelectedBroker] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  const { data: brokersData } = useQuery({
    queryKey: ['approvedBrokers'],
    queryFn: () => brokerService.getApprovedBrokers(),
    staleTime: 60_000,
  });
  const brokers: User[] = brokersData?.data || [];

  const toggleAmenity = (a: string) =>
    setForm((f) => ({
      ...f,
      amenities: f.amenities.includes(a) ? f.amenities.filter((x) => x !== a) : [...f.amenities, a],
    }));

  const isFormValid = form.title && form.description && form.price && form.location &&
    form.bedrooms && form.bathrooms && form.contactPhone &&
    form.coordinates.lat && form.coordinates.lng;

  const handleSubmit = async () => {
    if (!selectedBroker) { toast.error('Please select a broker'); return; }
    setLoading(true);
    try {
      await brokerService.ownerSubmitToBroker({
        brokerId: selectedBroker._id,
        title: form.title,
        description: form.description,
        price: Number(form.price),
        location: form.location,
        coordinates: {
          type: 'Point',
          coordinates: [Number(form.coordinates.lng), Number(form.coordinates.lat)],
        },
        bedrooms: Number(form.bedrooms),
        bathrooms: Number(form.bathrooms),
        propertyType: form.propertyType as any,
        amenities: form.amenities,
        contactPhone: form.contactPhone,
      });
      toast.success('Property submitted to broker!');
      queryClient.invalidateQueries({ queryKey: ['ownerSubmissions'] });
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit property');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-white z-10">
          <h2 className="font-bold text-foreground text-xl">
            {step === 0 ? 'Property Details' : 'Select a Broker'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === 0 ? (
          <div className="p-6 space-y-5">
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-700">
              💡 As an owner, you submit your property to an approved broker. The broker will list it on your behalf.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Title *</label>
                <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Modern 3BR Penthouse in Bole"
                  className="w-full px-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:border-amber-500 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Price (ETB/mo) *</label>
                <input required type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:border-amber-500 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Type *</label>
                <select required value={form.propertyType} onChange={(e) => setForm({ ...form, propertyType: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:border-amber-500 text-sm bg-background">
                  {PROPERTY_TYPES.map((t) => <option key={t} value={t} className="capitalize">{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Bedrooms *</label>
                <input required type="number" min="0" value={form.bedrooms} onChange={(e) => setForm({ ...form, bedrooms: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:border-amber-500 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Bathrooms *</label>
                <input required type="number" min="0" value={form.bathrooms} onChange={(e) => setForm({ ...form, bathrooms: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:border-amber-500 text-sm" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Location *</label>
                <input required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="e.g. Bole, Addis Ababa"
                  className="w-full px-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:border-amber-500 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Latitude *</label>
                <input required type="number" step="any" value={form.coordinates.lat}
                  onChange={(e) => setForm({ ...form, coordinates: { ...form.coordinates, lat: e.target.value } })}
                  placeholder="-1.2921" className="w-full px-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:border-amber-500 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Longitude *</label>
                <input required type="number" step="any" value={form.coordinates.lng}
                  onChange={(e) => setForm({ ...form, coordinates: { ...form.coordinates, lng: e.target.value } })}
                  placeholder="36.8219" className="w-full px-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:border-amber-500 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Contact Phone *</label>
                <input required value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                  placeholder="+254 700 000 000" className="w-full px-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:border-amber-500 text-sm" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Description *</label>
                <textarea required rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:border-amber-500 text-sm resize-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-2">Amenities</label>
              <div className="flex flex-wrap gap-2">
                {AMENITY_OPTIONS.map((a) => (
                  <button key={a} type="button" onClick={() => toggleAmenity(a)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border-2 transition-all ${
                      form.amenities.includes(a) ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-border text-muted-foreground'
                    }`}>{a}</button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose}
                className="flex-1 py-3 rounded-xl border-2 border-border font-semibold text-sm text-foreground">
                Cancel
              </button>
              <button onClick={() => setStep(1)} disabled={!isFormValid}
                className="flex-1 py-3 rounded-xl font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #E8B84B, #C9922A)', color: '#070C17' }}>
                Select Broker <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <button onClick={() => setStep(0)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-5 transition-colors">
              ← Back to form
            </button>

            {brokers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="font-bold text-foreground mb-2">No approved brokers yet</p>
                <p className="text-sm text-muted-foreground">Check back soon as more brokers get approved.</p>
              </div>
            ) : (
              <div className="space-y-3 mb-6">
                {brokers.map((b) => (
                  <label key={b._id}
                    className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      selectedBroker?._id === b._id ? 'border-amber-500 bg-amber-50' : 'border-border hover:border-amber-200'
                    }`}>
                    <input type="radio" name="broker" className="sr-only" onChange={() => setSelectedBroker(b)} />
                    <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center overflow-hidden shrink-0">
                      {b.profileImage
                        ? <img src={b.profileImage} alt="" className="w-full h-full object-cover" />
                        : <span className="font-bold text-amber-700 text-lg">{b.name?.[0]}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-foreground">{b.name}</p>
                      <p className="text-xs text-muted-foreground">{(b as any).brokerCompanyName || 'Independent Broker'}</p>
                      <p className="text-xs text-muted-foreground">{(b as any).brokerOfficeAddress}</p>
                      {(b as any).brokerYearsExperience > 0 && (
                        <p className="text-xs text-amber-600 mt-0.5">{(b as any).brokerYearsExperience} yrs experience</p>
                      )}
                    </div>
                    {selectedBroker?._id === b._id && <CheckCircle className="w-5 h-5 text-amber-500 shrink-0" />}
                  </label>
                ))}
              </div>
            )}

            <button onClick={handleSubmit} disabled={!selectedBroker || loading}
              className="w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all hover:scale-[1.02]"
              style={{ background: 'linear-gradient(135deg, #E8B84B, #C9922A)', color: '#070C17' }}>
              {loading
                ? <><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> Submitting...</>
                : `Submit to ${selectedBroker?.name || 'Broker'}`}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default function OwnerDashboard() {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['ownerSubmissions'],
    queryFn: async () => {
      const token = localStorage.getItem('nesthub_token') || sessionStorage.getItem('nesthub_token') || '';
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/houses/my-owner-submissions`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();
      return data;
    },
    staleTime: 30_000,
  });

  const submissions: House[] = data?.data || [];
  const stats = {
    total: submissions.length,
    pending: submissions.filter((s) => (s as any).brokerSubmissionStatus === 'pending_broker').length,
    accepted: submissions.filter((s) => (s as any).brokerSubmissionStatus === 'accepted').length,
    published: submissions.filter((s) => s.status === 'approved').length,
  };

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-foreground" style={{ fontFamily: 'Urbanist, sans-serif' }}>
              Owner Dashboard
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Welcome back, {user?.name}</p>
          </div>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #E8B84B, #C9922A)', color: '#070C17' }}>
            <Plus className="w-4 h-4" /> List My Property
          </button>
        </div>

        {/* Info banner */}
        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 mb-8 flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="font-semibold text-blue-800 text-sm">How it works</p>
            <p className="text-xs text-blue-600 mt-0.5">
              Submit your property to an approved broker. The broker reviews it, lists it on the platform, and handles inquiries from renters on your behalf.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Submitted', value: stats.total, icon: Home, color: 'bg-blue-50 text-blue-600' },
            { label: 'Pending Broker', value: stats.pending, icon: Clock, color: 'bg-yellow-50 text-yellow-600' },
            { label: 'Accepted', value: stats.accepted, icon: CheckCircle, color: 'bg-green-50 text-green-600' },
            { label: 'Published', value: stats.published, icon: Eye, color: 'bg-purple-50 text-purple-600' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-2xl border border-border p-5 shadow-sm">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-black text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Messages shortcut */}
        <Link to="/messages"
          className="flex items-center justify-between p-5 rounded-2xl bg-white border border-border shadow-sm mb-8 hover:border-amber-500 transition-colors group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="font-bold text-foreground text-sm">Messages with Broker</p>
              <p className="text-xs text-muted-foreground">Discuss property details, commission, and more</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-amber-500 transition-colors" />
        </Link>

        {/* Submissions table */}
        <div className="bg-white rounded-3xl border border-border shadow-sm overflow-hidden">
          <div className="p-5 border-b border-border">
            <h2 className="font-bold text-foreground">My Property Submissions</h2>
          </div>

          {isLoading ? (
            <div className="p-8 text-center">
              <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : submissions.length === 0 ? (
            <div className="p-12 text-center">
              <Home className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-bold text-foreground mb-2">No submissions yet</h3>
              <p className="text-sm text-muted-foreground mb-4">Submit your first property to a broker</p>
              <button onClick={() => setShowModal(true)}
                className="px-6 py-2.5 rounded-xl font-semibold text-sm"
                style={{ background: 'linear-gradient(135deg, #E8B84B, #C9922A)', color: '#070C17' }}>
                Submit Property
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase">Property</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase">Broker</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase">Status</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((s) => {
                    const broker = typeof (s as any).assignedBroker === 'object' ? (s as any).assignedBroker : null;
                    return (
                      <tr key={s._id} className="border-b border-border hover:bg-muted/20">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl overflow-hidden bg-muted shrink-0">
                              {s.images?.[0] ? <img src={s.images[0]} alt="" className="w-full h-full object-cover" /> : <ImageIcon className="w-5 h-5 text-muted-foreground m-auto" />}
                            </div>
                            <div>
                              <p className="font-semibold text-foreground truncate max-w-48">{s.title}</p>
                              <p className="text-xs text-muted-foreground">{s.location}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {broker?.name || '—'}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={s.status === 'rented' ? 'rented' : ((s as any).brokerSubmissionStatus || s.status)} />
                        </td>
                        <td className="px-6 py-4 text-xs text-muted-foreground">
                          {new Date(s.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showModal && <SubmitModal onClose={() => setShowModal(false)} />}
      </AnimatePresence>
    </div>
  );
}
