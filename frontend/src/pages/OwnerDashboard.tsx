import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import {
  Home, Plus, Eye, MessageSquare, TrendingUp, Edit2, Trash2,
  CheckCircle, Clock, XCircle, Award, X, Upload, Image as ImageIcon,
} from 'lucide-react';
import { houseService } from '../services/house.service';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import type { House } from '../types';

const PROPERTY_TYPES = ['apartment', 'house', 'condo', 'studio', 'villa', 'townhouse'];
const AMENITY_OPTIONS = ['WiFi', 'Parking', 'Pool', 'Gym', 'Garden', 'Security', 'Balcony', 'Air Conditioning'];

function StatusBadge({ status }: { status: House['status'] }) {
  const map: Record<string, { label: string; class: string; icon: any }> = {
    approved: { label: 'Approved', class: 'bg-green-100 text-green-700', icon: CheckCircle },
    pending: { label: 'Pending', class: 'bg-yellow-100 text-yellow-700', icon: Clock },
    rejected: { label: 'Rejected', class: 'bg-red-100 text-red-700', icon: XCircle },
    inactive: { label: 'Inactive', class: 'bg-gray-100 text-gray-600', icon: XCircle },
  };
  const { label, class: cls, icon: Icon } = map[status] || map.pending;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${cls}`}>
      <Icon className="w-3 h-3" /> {label}
    </span>
  );
}

function ListingModal({ listing, onClose }: { listing?: House | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isEdit = !!listing;

  const [form, setForm] = useState({
    title: listing?.title || '',
    description: listing?.description || '',
    price: listing?.price || '',
    location: listing?.location || '',
    bedrooms: listing?.bedrooms || '',
    bathrooms: listing?.bathrooms || '',
    propertyType: listing?.propertyType || 'apartment',
    amenities: listing?.amenities || [] as string[],
    coordinates: {
      lat: listing?.coordinates?.coordinates?.[1] || '',
      lng: listing?.coordinates?.coordinates?.[0] || '',
    },
  });
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleAmenity = (a: string) => {
    setForm((f) => ({
      ...f,
      amenities: f.amenities.includes(a) ? f.amenities.filter((x) => x !== a) : [...f.amenities, a],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEdit && images.length === 0) { toast.error('Please add at least one image'); return; }

    setLoading(true);
    try {
      if (isEdit) {
        await houseService.updateHouse(listing!._id, {
          ...form,
          price: Number(form.price),
          bedrooms: Number(form.bedrooms),
          bathrooms: Number(form.bathrooms),
          coordinates: {
            type: 'Point',
            coordinates: [Number(form.coordinates.lng), Number(form.coordinates.lat)],
          },
        });
        toast.success('Listing updated');
      } else {
        const fd = new FormData();
        Object.entries(form).forEach(([k, v]) => {
          if (k === 'amenities') (v as string[]).forEach((a) => fd.append('amenities', a));
          else if (k === 'coordinates') {
            fd.append('coordinates[type]', 'Point');
            fd.append('coordinates[coordinates][0]', String((v as any).lng));
            fd.append('coordinates[coordinates][1]', String((v as any).lat));
          } else fd.append(k, String(v));
        });
        images.forEach((img) => fd.append('images', img));
        await houseService.createHouse(fd);
        toast.success('Listing created and submitted for review');
      }
      queryClient.invalidateQueries({ queryKey: ['myListings'] });
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save listing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-white z-10">
          <h2 className="font-bold text-foreground text-xl">{isEdit ? 'Edit Listing' : 'New Listing'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-xl transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Title *</label>
              <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Modern 3BR Apartment in Westlands"
                className="w-full px-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:border-amber-500 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Price (KSh/mo) *</label>
              <input required type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full px-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:border-amber-500 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Property Type *</label>
              <select required value={form.propertyType} onChange={(e) => setForm({ ...form, propertyType: e.target.value as any })}
                className="w-full px-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:border-amber-500 text-sm bg-background">
                {PROPERTY_TYPES.map((t) => <option key={t} value={t} className="capitalize">{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Bedrooms *</label>
              <input required type="number" min="0" value={form.bedrooms} onChange={(e) => setForm({ ...form, bedrooms: e.target.value })}
                className="w-full px-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:border-amber-500 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Bathrooms *</label>
              <input required type="number" min="0" value={form.bathrooms} onChange={(e) => setForm({ ...form, bathrooms: e.target.value })}
                className="w-full px-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:border-amber-500 text-sm" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Location *</label>
              <input required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="e.g. Westlands, Nairobi"
                className="w-full px-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:border-amber-500 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Latitude *</label>
              <input required type="number" step="any" value={form.coordinates.lat}
                onChange={(e) => setForm({ ...form, coordinates: { ...form.coordinates, lat: e.target.value } })}
                placeholder="-1.2921"
                className="w-full px-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:border-amber-500 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Longitude *</label>
              <input required type="number" step="any" value={form.coordinates.lng}
                onChange={(e) => setForm({ ...form, coordinates: { ...form.coordinates, lng: e.target.value } })}
                placeholder="36.8219"
                className="w-full px-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:border-amber-500 text-sm" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Description *</label>
              <textarea required rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:border-amber-500 text-sm resize-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Amenities</label>
            <div className="flex flex-wrap gap-2">
              {AMENITY_OPTIONS.map((a) => (
                <button key={a} type="button" onClick={() => toggleAmenity(a)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border-2 transition-all ${
                    form.amenities.includes(a)
                      ? 'border-amber-500 bg-amber-50 text-amber-700'
                      : 'border-border text-muted-foreground hover:border-amber-300'
                  }`}>{a}</button>
              ))}
            </div>
          </div>

          {!isEdit && (
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Images (max 10) *</label>
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-amber-400 transition-colors">
                <Upload className="w-6 h-6 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">Click to upload images</span>
                <input type="file" multiple accept="image/*" className="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []).slice(0, 10);
                    setImages(files);
                  }} />
              </label>
              {images.length > 0 && (
                <div className="flex gap-2 mt-2 flex-wrap">
                  {images.map((f, i) => (
                    <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden">
                      <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setImages((imgs) => imgs.filter((_, j) => j !== i))}
                        className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center text-xs">
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl border-2 border-border font-semibold text-sm text-foreground hover:bg-muted transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-3 rounded-xl font-bold text-sm disabled:opacity-50 transition-all"
              style={{ background: 'linear-gradient(135deg, #E8B84B, #C9922A)', color: '#070C17' }}>
              {loading ? 'Saving...' : isEdit ? 'Update Listing' : 'Submit Listing'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function OwnerDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<{ open: boolean; listing?: House | null }>({ open: false });

  const { data, isLoading } = useQuery({
    queryKey: ['myListings'],
    queryFn: () => houseService.getMyListings(),
    staleTime: 30_000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => houseService.deleteHouse(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['myListings'] }); toast.success('Listing deleted'); },
    onError: () => toast.error('Failed to delete listing'),
  });

  const listings: House[] = data?.data || [];
  const stats = {
    total: listings.length,
    approved: listings.filter((l) => l.status === 'approved').length,
    pending: listings.filter((l) => l.status === 'pending').length,
    totalViews: listings.reduce((s, l) => s + l.views, 0),
  };

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-foreground" style={{ fontFamily: 'Urbanist, sans-serif' }}>
              My Dashboard
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Welcome back, {user?.name}</p>
          </div>
          <button onClick={() => setModal({ open: true, listing: null })}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #E8B84B, #C9922A)', color: '#070C17' }}>
            <Plus className="w-4 h-4" /> New Listing
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Listings', value: stats.total, icon: Home, color: 'bg-blue-50 text-blue-600' },
            { label: 'Approved', value: stats.approved, icon: CheckCircle, color: 'bg-green-50 text-green-600' },
            { label: 'Pending Review', value: stats.pending, icon: Clock, color: 'bg-yellow-50 text-yellow-600' },
            { label: 'Total Views', value: stats.totalViews.toLocaleString(), icon: Eye, color: 'bg-purple-50 text-purple-600' },
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

        {/* Listings table */}
        <div className="bg-white rounded-3xl border border-border shadow-sm overflow-hidden">
          <div className="p-5 border-b border-border">
            <h2 className="font-bold text-foreground">My Listings</h2>
          </div>

          {isLoading ? (
            <div className="p-8 text-center">
              <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : listings.length === 0 ? (
            <div className="p-12 text-center">
              <Home className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-bold text-foreground mb-2">No listings yet</h3>
              <p className="text-sm text-muted-foreground mb-4">Create your first property listing</p>
              <button onClick={() => setModal({ open: true, listing: null })}
                className="px-6 py-2.5 rounded-xl font-semibold text-sm"
                style={{ background: 'linear-gradient(135deg, #E8B84B, #C9922A)', color: '#070C17' }}>
                Add Listing
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Property</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Price</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Views</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Inquiries</th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {listings.map((listing) => (
                    <tr key={listing._id} className="border-b border-border hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl overflow-hidden bg-muted shrink-0">
                            {listing.images?.[0]
                              ? <img src={listing.images[0]} alt="" className="w-full h-full object-cover" />
                              : <ImageIcon className="w-5 h-5 text-muted-foreground m-auto" />}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground truncate max-w-48">{listing.title}</p>
                            <p className="text-xs text-muted-foreground">{listing.location}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-foreground">KSh {listing.price.toLocaleString()}</td>
                      <td className="px-6 py-4"><StatusBadge status={listing.status} /></td>
                      <td className="px-6 py-4 text-muted-foreground">{listing.views}</td>
                      <td className="px-6 py-4 text-muted-foreground">{listing.inquiryCount}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 justify-end">
                          <button onClick={() => setModal({ open: true, listing })}
                            className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => { if (confirm('Delete this listing?')) deleteMutation.mutate(listing._id); }}
                            className="p-2 rounded-xl hover:bg-red-50 transition-colors text-muted-foreground hover:text-red-500">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {modal.open && (
          <ListingModal listing={modal.listing} onClose={() => setModal({ open: false })} />
        )}
      </AnimatePresence>
    </div>
  );
}
