import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import {
  Home, CheckCircle, XCircle, Clock, MessageSquare, Eye, EyeOff,
  Trash2, ArrowRight, Image as ImageIcon, Users, X,
  TrendingUp, Globe, Key, Edit2, AlertCircle, Search,
  MapPin, Bed, Bath, Wifi, ChevronLeft, ChevronRight, FileText, Plus,
} from 'lucide-react';
import ImageUploader from '../components/property/ImageUploader';
import { brokerService } from '../services/broker.service';
import { houseService } from '../services/house.service';
import { rentService } from '../services/rent.service';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Link, Navigate } from 'react-router';
import type { House } from '../types';
import RentalAgreementModal from '../components/RentalAgreementModal';

// ── Tenant Form Modal ───────────────────────────────────────────────────────
function TenantFormModal({ house, onClose, onSubmit }: {
  house: House;
  onClose: () => void;
  onSubmit: (tenant: any) => void;
}) {
  const [form, setForm] = useState({ email: '' });
  const [loading, setLoading] = useState(false);
  const [inquirers, setInquirers] = useState<any[]>([]);
  const [loadingInquirers, setLoadingInquirers] = useState(true);

  useEffect(() => {
    let mounted = true;
    rentService.getHouseInquirers(house._id)
      .then((res: any) => {
        if (mounted && res?.data) {
          setInquirers(res.data);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setLoadingInquirers(false);
      });
    return () => { mounted = false; };
  }, [house._id]);

  const handleSubmit = async () => {
    if (!form.email.trim()) {
      toast.error('Please enter tenant email');
      return;
    }

    setLoading(true);
    try {
      const res = await rentService.searchTenant(form.email.trim());
      if (res?.data) {
        onSubmit(res.data);
      } else {
        toast.error('User not found. The tenant must be registered on the platform.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'User not found. The tenant must be registered on the platform.');
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
        className="w-full max-w-lg rounded-3xl bg-white shadow-2xl p-6 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-foreground text-xl">Select Tenant for Rental Agreement</h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-xl transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          {house.title} · <span className="font-semibold text-foreground">ETB {house.price?.toLocaleString()}/mo</span>
        </p>

        {/* Inquirers list */}
        {loadingInquirers ? (
          <div className="py-4 text-center text-xs text-muted-foreground">Checking property inquirers...</div>
        ) : inquirers.length > 0 ? (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50/60 border border-amber-200">
            <p className="text-xs font-bold text-amber-900 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> Renters Who Inquired About This House
            </p>
            <div className="space-y-2 mt-2">
              {inquirers.map((inq) => (
                <div key={inq._id} className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-amber-200/80">
                  <div className="min-w-0 mr-2">
                    <p className="font-semibold text-foreground text-sm truncate">{inq.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{inq.email} {inq.phone ? `· ${inq.phone}` : ''}</p>
                  </div>
                  <button
                    onClick={() => onSubmit(inq)}
                    className="shrink-0 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-colors">
                    Select
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 mb-6">
          <p className="text-xs text-blue-800">
            Enter the tenant's email address to search any registered renter on the platform.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">
            Search Tenant by Email *
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="tenant@example.com"
            className="w-full px-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:border-amber-500 text-sm"
          />
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-3 rounded-xl border-2 border-border font-semibold text-sm text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #E8B84B, #C9922A)', color: '#070C17' }}
          >
            {loading ? 'Searching...' : 'Find & Select Tenant'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

type BrokerTab = 'overview' | 'submissions' | 'listings' | 'messages';

const PROPERTY_TYPES = ['apartment', 'house', 'condo', 'studio', 'villa', 'townhouse'];
const AMENITY_OPTIONS = ['WiFi', 'Parking', 'Pool', 'Gym', 'Garden', 'Security', 'Balcony', 'Air Conditioning'];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; icon: any }> = {
    pending_broker: { label: 'Awaiting Review', cls: 'bg-yellow-100 text-yellow-700', icon: Clock },
    accepted:       { label: 'Accepted',        cls: 'bg-blue-100 text-blue-700',   icon: CheckCircle },
    rejected:       { label: 'Rejected',        cls: 'bg-red-100 text-red-700',     icon: XCircle },
    approved:       { label: 'Published',       cls: 'bg-green-100 text-green-700', icon: Globe },
    pending:        { label: 'Pending',         cls: 'bg-orange-100 text-orange-700', icon: Clock },
    inactive:       { label: 'Hidden',          cls: 'bg-gray-100 text-gray-500',   icon: EyeOff },
    rented:         { label: 'Rented',          cls: 'bg-purple-100 text-purple-700', icon: Key },
    none:           { label: 'Draft',           cls: 'bg-gray-100 text-gray-500',   icon: Edit2 },
  };
  const s = map[status] || { label: status, cls: 'bg-muted text-muted-foreground', icon: AlertCircle };
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${s.cls}`}>
      <Icon className="w-3 h-3" /> {s.label}
    </span>
  );
}

// ── Property Detail Modal — full read-only preview before publishing ───────
function PropertyDetailModal({ house, onClose, onPublish, onEdit, onCreateAgreement }: {
  house: House;
  onClose: () => void;
  onPublish?: () => void;
  onEdit?: () => void;
  onCreateAgreement?: () => void;
}) {
  const [imgIdx, setImgIdx] = useState(0);
  const owner = typeof house.ownerId === 'object' ? house.ownerId as any : null;
  const isPublished = house.status === 'approved';
  // Only allow publish from the detail modal if broker has explicitly accepted this submission
  const canPublish = house.brokerSubmissionStatus === 'accepted';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-white z-10">
          <div>
            <h2 className="font-bold text-foreground text-xl">{house.title}</h2>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {house.location}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-xl transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-6">
          {/* Image gallery */}
          {house.images?.length > 0 ? (
            <div className="relative rounded-2xl overflow-hidden bg-muted aspect-video">
              <img src={house.images[imgIdx]} alt="" className="w-full h-full object-cover" />
              {house.images.length > 1 && (
                <>
                  <button onClick={() => setImgIdx(i => (i - 1 + house.images.length) % house.images.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button onClick={() => setImgIdx(i => (i + 1) % house.images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {house.images.map((_, i) => (
                      <button key={i} onClick={() => setImgIdx(i)}
                        className={`w-1.5 h-1.5 rounded-full transition-all ${i === imgIdx ? 'bg-white w-4' : 'bg-white/50'}`} />
                    ))}
                  </div>
                </>
              )}
              {/* Image count */}
              <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/50 text-white text-xs font-semibold">
                {imgIdx + 1} / {house.images.length}
              </span>
            </div>
          ) : (
            <div className="aspect-video rounded-2xl bg-muted flex items-center justify-center">
              <ImageIcon className="w-12 h-12 text-muted-foreground" />
            </div>
          )}

          {/* Thumbnail strip */}
          {house.images?.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {house.images.map((img, i) => (
                <button key={i} onClick={() => setImgIdx(i)}
                  className={`w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${i === imgIdx ? 'border-amber-500' : 'border-transparent'}`}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Price + status */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <p className="text-3xl font-black text-foreground">
              ETB {house.price?.toLocaleString()}<span className="text-base font-normal text-muted-foreground">/mo</span>
            </p>
            <div className="flex items-center gap-2">
              <StatusBadge status={house.brokerSubmissionStatus || house.status} />
              {house.isPremium && (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">Premium</span>
              )}
            </div>
          </div>

          {/* Key info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: Bed, label: 'Bedrooms', value: house.bedrooms },
              { icon: Bath, label: 'Bathrooms', value: house.bathrooms },
              { icon: Home, label: 'Type', value: house.propertyType },
              { icon: Eye, label: 'Views', value: house.views || 0 },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-muted/40 rounded-2xl p-3 text-center">
                <Icon className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                <p className="text-lg font-bold text-foreground capitalize">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>

          {/* Description */}
          <div>
            <h3 className="font-bold text-foreground mb-2">Description</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{house.description}</p>
          </div>

          {/* Amenities */}
          {house.amenities?.length > 0 && (
            <div>
              <h3 className="font-bold text-foreground mb-2">Amenities</h3>
              <div className="flex flex-wrap gap-2">
                {house.amenities.map(a => (
                  <span key={a} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-100">
                    <Wifi className="w-3 h-3" /> {a}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Owner info */}
          {owner && (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-muted/30 border border-border">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm shrink-0">
                {owner.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">Property Owner</p>
                <p className="text-xs text-muted-foreground">{owner.name}{owner.phone ? ` · ${owner.phone}` : ''}{owner.email ? ` · ${owner.email}` : ''}</p>
              </div>
            </div>
          )}

          {/* Coordinates */}
          {house.coordinates?.coordinates && (
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              Lat {house.coordinates.coordinates[1]?.toFixed(6)}, Lng {house.coordinates.coordinates[0]?.toFixed(6)}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 pt-2 border-t border-border">
            <button onClick={onClose}
              className="flex-1 py-3 rounded-xl border-2 border-border font-semibold text-sm text-foreground hover:bg-muted transition-colors">
              Close
            </button>
            {onEdit && (
              <button onClick={onEdit}
                className="flex-1 py-3 rounded-xl border-2 border-amber-400 text-amber-700 font-bold text-sm hover:bg-amber-50 transition-colors flex items-center justify-center gap-2">
                <Edit2 className="w-4 h-4" /> Edit Details
              </button>
            )}
            {canPublish && onPublish && !isPublished && (
              <button onClick={onPublish}
                className="flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                style={{ background: 'linear-gradient(135deg, #E8B84B, #C9922A)', color: '#070C17' }}>
                <Globe className="w-4 h-4" /> Publish to Website
              </button>
            )}
            {isPublished && house.status !== 'rented' && onCreateAgreement && (
              <button onClick={onCreateAgreement}
                className="flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.02] bg-purple-600 text-white hover:bg-purple-700">
                <FileText className="w-4 h-4" /> Create Rental Agreement
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ── Edit / Publish modal for an existing house ─────────────────────────────
function EditListingModal({ house, onClose }: { house: House; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title: house.title,
    description: house.description,
    price: String(house.price),
    location: house.location,
    bedrooms: String(house.bedrooms),
    bathrooms: String(house.bathrooms),
    propertyType: house.propertyType,
    amenities: [...house.amenities],
    coordinates: {
      lat: String(house.coordinates?.coordinates?.[1] || ''),
      lng: String(house.coordinates?.coordinates?.[0] || ''),
    },
    images: [...(house.images || [])],
  });
  const [publishing, setPublishing] = useState(false);
  const [saving, setSaving] = useState(false);

  const toggleAmenity = (a: string) =>
    setForm(f => ({ ...f, amenities: f.amenities.includes(a) ? f.amenities.filter(x => x !== a) : [...f.amenities, a] }));

  const buildPayload = (extraStatus?: string) => ({
    title: form.title,
    description: form.description,
    price: Number(form.price),
    location: form.location,
    bedrooms: Number(form.bedrooms),
    bathrooms: Number(form.bathrooms),
    propertyType: form.propertyType,
    amenities: form.amenities,
    coordinates: { type: 'Point' as const, coordinates: [Number(form.coordinates.lng), Number(form.coordinates.lat)] as [number,number] },
    images: form.images,
    ...(extraStatus ? { status: extraStatus, isActive: extraStatus === 'approved' ? true : undefined } : {}),
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await houseService.updateHouse(house._id, buildPayload());
      toast.success('Listing updated');
      queryClient.invalidateQueries({ queryKey: ['myListings'] });
      queryClient.invalidateQueries({ queryKey: ['brokerSubmissions'] });
      onClose();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      await houseService.updateHouse(house._id, buildPayload('approved'));
      toast.success('🎉 Property published! It\'s now live on the website.');
      queryClient.invalidateQueries({ queryKey: ['myListings'] });
      queryClient.invalidateQueries({ queryKey: ['brokerSubmissions'] });
      onClose();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed to publish'); }
    finally { setPublishing(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-white z-10">
          <div>
            <h2 className="font-bold text-foreground text-xl">Edit &amp; Publish</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Review and edit the details, then publish directly to the website</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-xl transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-5">
          {/* Current status banner */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40">
            <StatusBadge status={house.brokerSubmissionStatus || house.status} />
            <span className="text-xs text-muted-foreground">
              {house.status === 'approved' ? 'Already published — editing will update the live listing' :
               'Edit details below, then click Publish to make it live immediately'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Title *</label>
              <input value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                className="w-full px-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:border-amber-500 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Price (ETB/mo) *</label>
              <input type="number" min="0" value={form.price} onChange={e => setForm({...form, price: e.target.value})}
                className="w-full px-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:border-amber-500 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Property Type *</label>
              <select value={form.propertyType} onChange={e => setForm({...form, propertyType: e.target.value as any})}
                className="w-full px-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:border-amber-500 text-sm bg-background">
                {PROPERTY_TYPES.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Bedrooms *</label>
              <input type="number" min="0" value={form.bedrooms} onChange={e => setForm({...form, bedrooms: e.target.value})}
                className="w-full px-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:border-amber-500 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Bathrooms *</label>
              <input type="number" min="0" value={form.bathrooms} onChange={e => setForm({...form, bathrooms: e.target.value})}
                className="w-full px-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:border-amber-500 text-sm" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Location *</label>
              <input value={form.location} onChange={e => setForm({...form, location: e.target.value})}
                className="w-full px-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:border-amber-500 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Latitude</label>
              <input type="number" step="any" value={form.coordinates.lat}
                onChange={e => setForm({...form, coordinates: {...form.coordinates, lat: e.target.value}})}
                placeholder="-1.2921" className="w-full px-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:border-amber-500 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Longitude</label>
              <input type="number" step="any" value={form.coordinates.lng}
                onChange={e => setForm({...form, coordinates: {...form.coordinates, lng: e.target.value}})}
                placeholder="36.8219" className="w-full px-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:border-amber-500 text-sm" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Description *</label>
              <textarea rows={4} value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                className="w-full px-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:border-amber-500 text-sm resize-none" />
            </div>
          </div>

          {/* Photo Management */}
          <div className="pt-2 border-t border-border">
            <ImageUploader
              images={form.images}
              onChange={(imgs) => setForm((f) => ({ ...f, images: imgs }))}
              label="Listing Photos"
              description="Review and update photos for this property before publishing."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase mb-2">Amenities</label>
            <div className="flex flex-wrap gap-2">
              {AMENITY_OPTIONS.map(a => (
                <button key={a} type="button" onClick={() => toggleAmenity(a)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border-2 transition-all ${
                    form.amenities.includes(a) ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-border text-muted-foreground hover:border-amber-300'
                  }`}>{a}</button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2 border-t border-border">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl border-2 border-border font-semibold text-sm text-foreground hover:bg-muted transition-colors">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving || publishing}
              className="flex-1 py-3 rounded-xl border-2 border-amber-400 text-amber-700 font-bold text-sm hover:bg-amber-50 transition-colors disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Draft'}
            </button>
            <button onClick={handlePublish} disabled={saving || publishing}
              className="flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all hover:scale-[1.02]"
              style={{ background: 'linear-gradient(135deg, #E8B84B, #C9922A)', color: '#070C17' }}>
              {publishing ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Globe className="w-4 h-4" />}
              {publishing ? 'Publishing...' : house.status === 'approved' ? 'Update Live' : 'Publish to Website'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ── Broker Create Listing Modal ───────────────────────────────────────────
function BrokerCreateListingModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    location: '',
    bedrooms: '2',
    bathrooms: '2',
    sqft: '',
    propertyType: 'apartment',
    amenities: [] as string[],
    contactPhone: user?.phone || '',
    coordinates: { lat: '8.9806', lng: '38.7578' },
    images: [] as string[],
    publishImmediately: true,
  });
  const [submitting, setSubmitting] = useState(false);

  const toggleAmenity = (a: string) =>
    setForm(f => ({
      ...f,
      amenities: f.amenities.includes(a) ? f.amenities.filter(x => x !== a) : [...f.amenities, a]
    }));

  const isFormValid =
    form.title.trim() &&
    form.description.trim() &&
    form.price &&
    Number(form.price) > 0 &&
    form.location.trim() &&
    form.bedrooms &&
    form.bathrooms;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
      toast.error('Please fill in all required fields.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        location: form.location.trim(),
        propertyType: form.propertyType,
        bedrooms: Number(form.bedrooms),
        bathrooms: Number(form.bathrooms),
        sqft: form.sqft ? Number(form.sqft) : undefined,
        amenities: form.amenities,
        contactPhone: form.contactPhone.trim() || user?.phone,
        coordinates: {
          type: 'Point' as const,
          coordinates: [Number(form.coordinates.lng), Number(form.coordinates.lat)] as [number, number],
        },
        images: form.images,
        status: form.publishImmediately ? 'approved' : 'pending',
        isActive: form.publishImmediately ? true : false,
        brokerSubmissionStatus: 'accepted',
      };

      await houseService.createHouse(payload);
      toast.success(
        form.publishImmediately
          ? '🎉 Property listed and published live on Kiray Bet!'
          : 'Listing saved as draft.'
      );
      queryClient.invalidateQueries({ queryKey: ['myListings'] });
      queryClient.invalidateQueries({ queryKey: ['brokerSubmissions'] });
      queryClient.invalidateQueries({ queryKey: ['houses'] });
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create listing');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-white z-10">
          <div>
            <h2 className="font-bold text-foreground text-xl">List a New Property</h2>
            <p className="text-xs text-muted-foreground mt-0.5">As an approved broker, your listing goes live immediately</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-xl transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
            <span>✨</span>
            <span>You are listing directly as a verified broker. Upload photos and property details to publish live on Kiray Bet.</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Property Title *</label>
              <input required value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                placeholder="e.g. Modern Luxury 3-Bedroom Apartment in Bole"
                className="w-full px-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:border-amber-500 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Monthly Rent (ETB) *</label>
              <input required type="number" min="0" value={form.price} onChange={e => setForm({...form, price: e.target.value})}
                placeholder="e.g. 45000"
                className="w-full px-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:border-amber-500 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Property Type *</label>
              <select value={form.propertyType} onChange={e => setForm({...form, propertyType: e.target.value})}
                className="w-full px-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:border-amber-500 text-sm bg-background">
                {PROPERTY_TYPES.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Bedrooms *</label>
              <input required type="number" min="0" value={form.bedrooms} onChange={e => setForm({...form, bedrooms: e.target.value})}
                className="w-full px-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:border-amber-500 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Bathrooms *</label>
              <input required type="number" min="0" value={form.bathrooms} onChange={e => setForm({...form, bathrooms: e.target.value})}
                className="w-full px-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:border-amber-500 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Square Meters / SqFt</label>
              <input type="number" min="0" value={form.sqft} onChange={e => setForm({...form, sqft: e.target.value})}
                placeholder="e.g. 180"
                className="w-full px-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:border-amber-500 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Contact Phone *</label>
              <input required value={form.contactPhone} onChange={e => setForm({...form, contactPhone: e.target.value})}
                placeholder="+251 911 234 567"
                className="w-full px-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:border-amber-500 text-sm" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Location / Neighborhood *</label>
              <input required value={form.location} onChange={e => setForm({...form, location: e.target.value})}
                placeholder="e.g. Bole, Addis Ababa"
                className="w-full px-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:border-amber-500 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Latitude</label>
              <input type="number" step="any" value={form.coordinates.lat}
                onChange={e => setForm({...form, coordinates: {...form.coordinates, lat: e.target.value}})}
                placeholder="8.9806" className="w-full px-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:border-amber-500 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Longitude</label>
              <input type="number" step="any" value={form.coordinates.lng}
                onChange={e => setForm({...form, coordinates: {...form.coordinates, lng: e.target.value}})}
                placeholder="38.7578" className="w-full px-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:border-amber-500 text-sm" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Description *</label>
              <textarea required rows={4} value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                placeholder="Describe key features, floor, security, nearby landmarks..."
                className="w-full px-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:border-amber-500 text-sm resize-none" />
            </div>
          </div>

          {/* Photo Uploader */}
          <div className="pt-2 border-t border-border">
            <ImageUploader
              images={form.images}
              onChange={(imgs) => setForm(f => ({ ...f, images: imgs }))}
              label="Property Photos"
              description="Upload authentic photos of this property (cover image first)."
            />
          </div>

          {/* Amenities */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase mb-2">Amenities</label>
            <div className="flex flex-wrap gap-2">
              {AMENITY_OPTIONS.map(a => (
                <button key={a} type="button" onClick={() => toggleAmenity(a)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border-2 transition-all ${
                    form.amenities.includes(a) ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-border text-muted-foreground hover:border-amber-300'
                  }`}>{a}</button>
              ))}
            </div>
          </div>

          {/* Publishing toggle */}
          <div className="p-4 rounded-2xl bg-muted/40 border border-border flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-foreground">Publish Live Immediately</p>
              <p className="text-xs text-muted-foreground">Make this property searchable on the website right now</p>
            </div>
            <input
              type="checkbox"
              checked={form.publishImmediately}
              onChange={e => setForm({...form, publishImmediately: e.target.checked})}
              className="w-5 h-5 rounded accent-amber-500 cursor-pointer"
            />
          </div>

          <div className="flex gap-3 pt-2 border-t border-border">
            <button type="button" onClick={onClose}
              className="flex-1 py-3.5 rounded-xl border-2 border-border font-semibold text-sm text-foreground hover:bg-muted transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={!isFormValid || submitting}
              className="flex-1 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all hover:scale-[1.02] shadow-lg shadow-amber-500/20"
              style={{ background: 'linear-gradient(135deg, #E8B84B, #C9922A)', color: '#070C17' }}>
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Listing Property...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  {form.publishImmediately ? 'Publish to Kiray Bet' : 'Save as Draft'}
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ── Main Broker Dashboard ──────────────────────────────────────────────────
export default function BrokerDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<BrokerTab>('overview');
  const [editHouse, setEditHouse] = useState<House | null>(null);
  const [viewHouse, setViewHouse] = useState<House | null>(null);
  const [listingSearch, setListingSearch] = useState('');
  const [rentalHouse, setRentalHouse] = useState<House | null>(null);
  const [rentalTenant, setRentalTenant] = useState<any | null>(null);
  const [showRentalForm, setShowRentalForm] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  if (user?.role !== 'broker') return <Navigate to="/broker/pending" replace />;

  // Load ALL at once for overview stats
  const { data: submissionsData, isLoading: subLoading } = useQuery({
    queryKey: ['brokerSubmissions'],
    queryFn: () => brokerService.getMySubmissions(),
    staleTime: 30_000,
  });

  const { data: listingsData, isLoading: listLoading } = useQuery({
    queryKey: ['myListings'],
    queryFn: () => houseService.getMyListings(),
    staleTime: 30_000,
  });

  const respondMutation = useMutation({
    mutationFn: ({ houseId, action, notes }: { houseId: string; action: 'accept' | 'reject'; notes?: string }) =>
      brokerService.respondToSubmission(houseId, action, notes),
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ['brokerSubmissions'] });
      queryClient.invalidateQueries({ queryKey: ['myListings'] });
      toast.success(action === 'accept' ? 'Submission accepted! You can now review and publish it.' : 'Submission rejected');
    },
    onError: () => toast.error('Failed to respond'),
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) => houseService.updateHouse(id, { status: 'approved', isActive: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myListings'] });
      queryClient.invalidateQueries({ queryKey: ['brokerSubmissions'] });
      toast.success('🎉 Property published! It\'s now live on the website.');
      setViewHouse(null);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to publish'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => houseService.deleteHouse(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myListings'] });
      queryClient.invalidateQueries({ queryKey: ['brokerSubmissions'] });
      toast.success('Listing deleted');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => houseService.updateHouse(id, data),
    onSuccess: (_, { data }) => {
      queryClient.invalidateQueries({ queryKey: ['myListings'] });
      queryClient.invalidateQueries({ queryKey: ['brokerSubmissions'] });
      if (data.isActive !== undefined) toast.success(data.isActive ? 'Listing visible' : 'Listing hidden');
      if (data.status === 'rented') toast.success('Marked as rented');
    },
    onError: () => toast.error('Failed to update'),
  });

  const submissions: House[] = submissionsData?.data || [];
  const listings: House[] = listingsData?.data || [];

  const pendingSubs  = submissions.filter(s => s.brokerSubmissionStatus === 'pending_broker');
  const acceptedSubs = submissions.filter(s => s.brokerSubmissionStatus === 'accepted');
  const published    = listings.filter(l => l.status === 'approved' && l.isActive);
  const hidden       = listings.filter(l => l.status === 'approved' && !l.isActive);
  const rented       = listings.filter(l => l.status === 'rented');
  const totalViews   = listings.reduce((s, l) => s + (l.views || 0), 0);

  const filteredListings = listings.filter(l =>
    !listingSearch || l.title.toLowerCase().includes(listingSearch.toLowerCase()) || l.location.toLowerCase().includes(listingSearch.toLowerCase())
  );
  const filteredAcceptedSubs = acceptedSubs.filter(s =>
    !listingSearch || s.title.toLowerCase().includes(listingSearch.toLowerCase()) || s.location.toLowerCase().includes(listingSearch.toLowerCase())
  );

  const TABS = [
    { id: 'overview' as BrokerTab,     label: 'Overview',          icon: TrendingUp },
    { id: 'submissions' as BrokerTab,  label: 'Owner Submissions', icon: Users,          count: pendingSubs.length },
    { id: 'listings' as BrokerTab,     label: 'Listings',          icon: Home,           count: acceptedSubs.length },
    { id: 'messages' as BrokerTab,     label: 'Messages',          icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-black text-foreground" style={{ fontFamily: 'Urbanist, sans-serif' }}>
              Broker Dashboard
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Welcome back, <span className="font-semibold text-foreground">{user?.name}</span>
              {user?.brokerCompanyName && <span className="ml-1 text-amber-600">· {user.brokerCompanyName}</span>}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Link to="/messages"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-border text-sm font-semibold text-foreground hover:border-amber-500 transition-colors">
              <MessageSquare className="w-4 h-4" /> Messages
            </Link>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-105 shadow-md shadow-amber-500/20"
              style={{ background: 'linear-gradient(135deg, #E8B84B 0%, #C9922A 100%)', color: '#070C17' }}>
              <Plus className="w-4 h-4" /> List New Property
            </button>
          </div>
        </div>

        {/* ── Stats grid ──────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          {[
            { label: 'Pending Review', value: pendingSubs.length,   color: 'bg-yellow-50 text-yellow-600', icon: Clock },
            { label: 'Accepted',       value: acceptedSubs.length,  color: 'bg-blue-50 text-blue-600',    icon: CheckCircle },
            { label: 'Published',      value: published.length,     color: 'bg-green-50 text-green-600',  icon: Globe },
            { label: 'Hidden',         value: hidden.length,        color: 'bg-gray-100 text-gray-500',   icon: EyeOff },
            { label: 'Rented',         value: rented.length,        color: 'bg-purple-50 text-purple-600',icon: Key },
            { label: 'Total Views',    value: totalViews,           color: 'bg-amber-50 text-amber-600',  icon: Eye },
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} className="bg-white rounded-2xl border border-border p-4 shadow-sm">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* ── Tabs ────────────────────────────────────────────────── */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {TABS.map(({ id, label, icon: Icon, count }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm whitespace-nowrap transition-all ${
                tab === id ? 'text-[#070C17]' : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
              style={tab === id ? { background: 'linear-gradient(135deg, #E8B84B, #C9922A)' } : {}}>
              <Icon className="w-4 h-4" /> {label}
              {!!count && count > 0 && (
                <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                  tab === id ? 'bg-[#070C17]/20 text-[#070C17]' : 'bg-amber-500 text-white'
                }`}>{count}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── Overview tab ────────────────────────────────────────── */}
        {tab === 'overview' && (
          <div className="space-y-6">
            {/* Quick actions */}
            <div className="grid md:grid-cols-2 gap-4">
              <button onClick={() => setTab('submissions')}
                className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-border shadow-sm hover:border-amber-400 transition-colors text-left group">
                <div className="w-12 h-12 rounded-xl bg-yellow-50 flex items-center justify-center shrink-0">
                  <Users className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-foreground">Review Submissions</p>
                  <p className="text-xs text-muted-foreground">{pendingSubs.length} pending from owners</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-amber-500 transition-colors" />
              </button>
              <button onClick={() => setTab('listings')}
                className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-border shadow-sm hover:border-amber-400 transition-colors text-left group">
                <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                  <Globe className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-foreground">Manage Listings</p>
                  <p className="text-xs text-muted-foreground">{acceptedSubs.length} ready to publish · {published.length} live</p>
                </div>                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-amber-500 transition-colors" />
              </button>
            </div>

            {/* Recent accepted — ready to publish */}
            {acceptedSubs.length > 0 && (
              <div className="bg-white rounded-3xl border-2 border-amber-200 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between p-5 border-b border-amber-100">
                  <div>
                    <h2 className="font-bold text-foreground flex items-center gap-2">
                      <Globe className="w-4 h-4 text-amber-500" /> Ready to Publish
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Review each property, then publish directly to the website — no admin approval needed</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">{acceptedSubs.length} ready</span>
                </div>
                <div className="divide-y divide-border">
                  {acceptedSubs.slice(0, 5).map(s => {
                    const owner = typeof s.ownerId === 'object' ? s.ownerId as any : null;
                    return (
                      <div key={s._id} className="flex items-center gap-4 p-4 hover:bg-muted/10 transition-colors">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-muted shrink-0">
                          {s.images?.[0] ? <img src={s.images[0]} alt="" className="w-full h-full object-cover" /> : <ImageIcon className="w-5 h-5 text-muted-foreground m-auto" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground text-sm truncate">{s.title}</p>
                          <p className="text-xs text-muted-foreground">{s.location} · ETB {s.price?.toLocaleString()}/mo</p>
                          {owner && <p className="text-xs text-muted-foreground">Owner: {owner.name}</p>}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button onClick={() => setViewHouse(s)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 border-amber-300 text-amber-700 font-semibold text-xs hover:bg-amber-50 transition-colors">
                            <Search className="w-3.5 h-3.5" /> Review
                          </button>
                          <button onClick={() => setEditHouse(s)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all hover:scale-105"
                            style={{ background: 'linear-gradient(135deg, #E8B84B, #C9922A)', color: '#070C17' }}>
                            <Globe className="w-4 h-4" /> Publish
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Published listings preview */}
            {published.length > 0 && (
              <div className="bg-white rounded-3xl border border-border shadow-sm overflow-hidden">
                <div className="flex items-center justify-between p-5 border-b border-border">
                  <h2 className="font-bold text-foreground">Live on Website</h2>
                  <button onClick={() => setTab('listings')} className="text-xs text-amber-600 font-semibold">View all →</button>
                </div>
                <div className="divide-y divide-border">
                  {published.slice(0, 4).map(l => (
                    <div key={l._id} className="flex items-center gap-4 p-4">
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-muted shrink-0">
                        {l.images?.[0] ? <img src={l.images[0]} alt="" className="w-full h-full object-cover" /> : <ImageIcon className="w-4 h-4 text-muted-foreground m-auto" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground text-sm truncate">{l.title}</p>
                        <p className="text-xs text-muted-foreground">{l.views} views · {l.inquiryCount} inquiries</p>
                      </div>
                      <StatusBadge status="approved" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Submissions tab ──────────────────────────────────────── */}
        {tab === 'submissions' && (
          <div className="bg-white rounded-3xl border border-border shadow-sm overflow-hidden">
            <div className="p-5 border-b border-border">
              <h2 className="font-bold text-foreground">Owner Submissions</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Accept to edit and publish, or reject with a reason</p>
            </div>
            {subLoading ? (
              <div className="p-8 text-center"><div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
            ) : submissions.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="font-bold text-foreground mb-2">No submissions yet</p>
                <p className="text-sm text-muted-foreground">Property owners will submit listings to you for review</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {submissions.map(s => {
                  const owner = typeof s.ownerId === 'object' ? s.ownerId as any : null;
                  const subStatus = s.brokerSubmissionStatus || 'none';
                  return (
                    <div key={s._id} className="p-6 hover:bg-muted/10 transition-colors">
                      <div className="flex items-start gap-4">
                        <button onClick={() => setViewHouse(s)} className="w-16 h-16 rounded-2xl overflow-hidden bg-muted shrink-0 hover:ring-2 hover:ring-amber-400 transition-all">
                          {s.images?.[0] ? <img src={s.images[0]} alt="" className="w-full h-full object-cover" /> : <ImageIcon className="w-6 h-6 text-muted-foreground m-auto" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <div>
                              <button onClick={() => setViewHouse(s)} className="font-bold text-foreground hover:text-amber-600 transition-colors text-left">{s.title}</button>
                              <p className="text-xs text-muted-foreground">{s.location} · ETB {s.price?.toLocaleString()}/mo · {s.bedrooms}bd / {s.bathrooms}ba · {s.propertyType}</p>
                              {owner && (
                                <div className="flex items-center gap-1.5 mt-1">
                                  <div className="w-4 h-4 rounded-full bg-amber-100 flex items-center justify-center text-[10px] font-bold text-amber-700">{owner.name?.[0]}</div>
                                  <span className="text-xs text-muted-foreground">from {owner.name}{owner.phone ? ` · ${owner.phone}` : ''}</span>
                                </div>
                              )}
                            </div>
                            <StatusBadge status={subStatus} />
                          </div>
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{s.description}</p>

                          <div className="flex items-center gap-2 mt-4 flex-wrap">
                            {subStatus === 'pending_broker' && (
                              <>
                                <button onClick={() => setViewHouse(s)}
                                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-sm transition-colors">
                                  <Search className="w-4 h-4" /> View Details
                                </button>
                                <button onClick={() => respondMutation.mutate({ houseId: s._id, action: 'accept' })}
                                  disabled={respondMutation.isPending}
                                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-50 text-green-700 hover:bg-green-100 font-semibold text-sm transition-colors">
                                  <CheckCircle className="w-4 h-4" /> Accept
                                </button>
                                <button onClick={() => { const n = prompt('Rejection reason (optional):') || ''; respondMutation.mutate({ houseId: s._id, action: 'reject', notes: n }); }}
                                  disabled={respondMutation.isPending}
                                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 font-semibold text-sm transition-colors">
                                  <XCircle className="w-4 h-4" /> Reject
                                </button>
                              </>
                            )}
                            {subStatus === 'accepted' && (
                              <>
                                <button onClick={() => setViewHouse(s)}
                                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border-2 border-amber-300 text-amber-700 hover:bg-amber-50 font-semibold text-sm transition-colors">
                                  <Search className="w-4 h-4" /> Review Details
                                </button>
                                <button onClick={() => setEditHouse(s)}
                                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-sm transition-all hover:scale-105"
                                  style={{ background: 'linear-gradient(135deg, #E8B84B, #C9922A)', color: '#070C17' }}>
                                  <Globe className="w-4 h-4" /> Edit &amp; Publish
                                </button>
                              </>
                            )}
                            {owner && (
                              <Link to={`/messages/${owner._id}`}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-muted text-foreground hover:bg-muted/80 font-semibold text-sm transition-colors ml-auto">
                                <MessageSquare className="w-4 h-4" /> Message Owner
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Listings tab ─────────────────────────────────────────── */}
        {tab === 'listings' && (
          <div className="space-y-4">
            {/* Ready-to-publish banner */}
            {acceptedSubs.length > 0 && (
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200">
                <Globe className="w-5 h-5 text-amber-600 shrink-0" />
                <p className="text-sm text-amber-800">
                  <span className="font-bold">{acceptedSubs.length} accepted {acceptedSubs.length === 1 ? 'submission' : 'submissions'}</span> ready to publish.
                  Review each property then click "Publish" — they'll go live immediately, no admin approval needed.
                </p>
              </div>
            )}

            <div className="bg-white rounded-3xl border border-border shadow-sm overflow-hidden">
              <div className="p-5 border-b border-border flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h2 className="font-bold text-foreground">All Listings</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Manage, publish, hide or delete your property listings</p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs shadow-md shadow-amber-500/20 transition-all hover:scale-105"
                    style={{ background: 'linear-gradient(135deg, #E8B84B, #C9922A)', color: '#070C17' }}>
                    <Plus className="w-3.5 h-3.5" /> + New Listing
                  </button>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      value={listingSearch}
                      onChange={e => setListingSearch(e.target.value)}
                      placeholder="Search listings..."
                      className="pl-9 pr-4 py-2 border-2 border-border rounded-xl text-sm focus:outline-none focus:border-amber-500 w-48"
                    />
                  </div>
                </div>
              </div>

              {listLoading ? (
                <div className="p-8 text-center"><div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
              ) : filteredListings.length === 0 && filteredAcceptedSubs.length === 0 ? (
                <div className="p-12 text-center">
                  <Home className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="font-bold text-foreground mb-2">No listings yet</p>
                  <p className="text-sm text-muted-foreground">Accept owner submissions from the Submissions tab, then publish them here</p>
                  <div className="mt-4 flex items-center justify-center gap-3 flex-wrap">
                    <button onClick={() => setShowCreateModal(true)}
                      className="px-6 py-2.5 rounded-xl font-semibold text-sm inline-flex items-center gap-2 shadow-md shadow-amber-500/20 transition-all hover:scale-105"
                      style={{ background: 'linear-gradient(135deg, #E8B84B, #C9922A)', color: '#070C17' }}>
                      <Plus className="w-4 h-4" /> List a Property Directly
                    </button>
                    <button onClick={() => setTab('submissions')}
                      className="px-6 py-2.5 rounded-xl font-semibold text-sm inline-flex items-center gap-2 border border-border hover:bg-muted transition-colors">
                      <Users className="w-4 h-4" /> View Submissions
                    </button>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">Property</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">Owner</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">Status</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">Views / Inquiries</th>
                        <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Accepted submissions (not yet published) */}
                      {filteredAcceptedSubs.map(s => {
                        const owner = typeof s.ownerId === 'object' ? s.ownerId as any : null;
                        return (
                          <tr key={s._id} className="border-b border-border hover:bg-amber-50/30 transition-colors">
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <button onClick={() => setViewHouse(s)} className="w-10 h-10 rounded-xl overflow-hidden bg-muted shrink-0 hover:ring-2 hover:ring-amber-400 transition-all">
                                  {s.images?.[0] ? <img src={s.images[0]} alt="" className="w-full h-full object-cover" /> : <ImageIcon className="w-4 h-4 text-muted-foreground m-auto" />}
                                </button>
                                <div>
                                  <button onClick={() => setViewHouse(s)} className="font-semibold text-foreground hover:text-amber-600 transition-colors truncate max-w-40 text-left block">{s.title}</button>
                                  <p className="text-xs text-muted-foreground">ETB {s.price?.toLocaleString()}/mo</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-xs text-muted-foreground">{owner?.name || '—'}</td>
                            <td className="px-5 py-4"><StatusBadge status="accepted" /></td>
                            <td className="px-5 py-4 text-xs text-muted-foreground">—</td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-1 justify-end">
                                <button onClick={() => setViewHouse(s)} title="View Details"
                                  className="p-2 rounded-xl hover:bg-blue-50 transition-colors text-muted-foreground hover:text-blue-600">
                                  <Search className="w-4 h-4" />
                                </button>
                                <button onClick={() => setEditHouse(s)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs"
                                  style={{ background: 'linear-gradient(135deg, #E8B84B, #C9922A)', color: '#070C17' }}>
                                  <Globe className="w-3.5 h-3.5" /> Publish
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {/* Published/other listings */}
                      {filteredListings.map(l => {
                        const owner = typeof l.ownerId === 'object' ? l.ownerId as any : null;
                        return (
                          <tr key={l._id} className="border-b border-border hover:bg-muted/20 transition-colors">
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <button onClick={() => setViewHouse(l)} className="w-10 h-10 rounded-xl overflow-hidden bg-muted shrink-0 hover:ring-2 hover:ring-amber-400 transition-all">
                                  {l.images?.[0] ? <img src={l.images[0]} alt="" className="w-full h-full object-cover" /> : <ImageIcon className="w-4 h-4 text-muted-foreground m-auto" />}
                                </button>
                                <div>
                                  <button onClick={() => setViewHouse(l)} className="font-semibold text-foreground hover:text-amber-600 transition-colors truncate max-w-40 text-left block">{l.title}</button>
                                  <p className="text-xs text-muted-foreground">ETB {l.price?.toLocaleString()}/mo</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-xs text-muted-foreground">{owner?.name || '—'}</td>
                            <td className="px-5 py-4"><StatusBadge status={l.status} /></td>
                            <td className="px-5 py-4 text-xs text-muted-foreground">{l.views} / {l.inquiryCount}</td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-1 justify-end">
                                <button onClick={() => setViewHouse(l)} title="View Details"
                                  className="p-2 rounded-xl hover:bg-blue-50 transition-colors text-muted-foreground hover:text-blue-600">
                                  <Search className="w-4 h-4" />
                                </button>
                                <button onClick={() => setEditHouse(l)} title="Edit" className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                {l.status === 'approved' && (
                                  <button onClick={() => updateMutation.mutate({ id: l._id, data: { isActive: !l.isActive } })}
                                    title={l.isActive ? 'Hide' : 'Show'} className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-amber-500">
                                    {l.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                  </button>
                                )}
                                {l.status !== 'rented' && l.status === 'approved' && (
                                  <button onClick={() => {
                                    setRentalHouse(l);
                                    setShowRentalForm(true);
                                  }}
                                    title="Create rental agreement" className="p-2 rounded-xl hover:bg-purple-50 text-muted-foreground hover:text-purple-500 transition-colors">
                                    <FileText className="w-4 h-4" />
                                  </button>
                                )}
                                {owner && (
                                  <Link to={`/messages/${owner._id}`} title="Message owner" className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-amber-500">
                                    <MessageSquare className="w-4 h-4" />
                                  </Link>
                                )}
                                <button onClick={() => { if (confirm('Delete this listing?')) deleteMutation.mutate(l._id); }}
                                  title="Delete" className="p-2 rounded-xl hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
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
        )}

        {/* ── Messages tab ─────────────────────────────────────────── */}
        {tab === 'messages' && (
          <div className="bg-white rounded-3xl border border-border shadow-sm p-12 text-center">
            <MessageSquare className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h3 className="font-bold text-foreground text-lg mb-2">Messaging Center</h3>
            <p className="text-sm text-muted-foreground mb-6">Chat with property owners and respond to renter inquiries</p>
            <Link to="/messages"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-sm transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #E8B84B, #C9922A)', color: '#070C17' }}>
              Open Messages <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

      </div>

      {/* Edit / Publish modal */}
      <AnimatePresence>
        {showCreateModal && <BrokerCreateListingModal onClose={() => setShowCreateModal(false)} />}
        {editHouse && <EditListingModal house={editHouse} onClose={() => setEditHouse(null)} />}
        {viewHouse && (
          <PropertyDetailModal
            house={viewHouse}
            onClose={() => setViewHouse(null)}
            onPublish={() => publishMutation.mutate(viewHouse._id)}
            onEdit={() => { setEditHouse(viewHouse); setViewHouse(null); }}
            onCreateAgreement={() => {
              setRentalHouse(viewHouse);
              setShowRentalForm(true);
              setViewHouse(null);
            }}
          />
        )}
        {rentalHouse && showRentalForm && (
          <TenantFormModal
            house={rentalHouse}
            onClose={() => { setRentalHouse(null); setShowRentalForm(false); }}
            onSubmit={(tenant) => {
              setShowRentalForm(false);
              setRentalTenant(tenant);
            }}
          />
        )}
        {rentalHouse && rentalTenant && !showRentalForm && (
          <RentalAgreementModal
            house={rentalHouse}
            tenant={rentalTenant}
            onClose={() => { setRentalHouse(null); setRentalTenant(null); }}
            onSuccess={() => {
              setRentalHouse(null);
              setRentalTenant(null);
              queryClient.invalidateQueries({ queryKey: ['myListings'] });
              queryClient.invalidateQueries({ queryKey: ['brokerSubmissions'] });
              queryClient.invalidateQueries({ queryKey: ['houses'] });
              queryClient.invalidateQueries({ queryKey: ['house'] });
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
