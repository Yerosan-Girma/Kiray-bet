import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import {
  MapPin, Bed, Bath, Square, Heart, Share2, Eye, MessageSquare,
  ChevronLeft, ChevronRight, X, Phone, Award, CheckCircle, ArrowLeft,
  Wifi, Car, Waves, Dumbbell, Trees, Shield, Star, Send, Key,
} from 'lucide-react';
import { houseService } from '../services/house.service';
import { favoriteService } from '../services/favorite.service';
import { inquiryService } from '../services/inquiry.service';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import type { House } from '../types';

const AMENITY_ICONS: Record<string, any> = {
  wifi: Wifi, parking: Car, pool: Waves, gym: Dumbbell,
  garden: Trees, security: Shield,
};

const BACKEND_BASE = (import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://kiray-bet.onrender.com/api' : 'http://localhost:5000/api')).replace(/\/api\/?$/, '');

function formatImg(src?: string): string {
  if (!src) return '';
  if (src.startsWith('/uploads')) return `${BACKEND_BASE}${src}`;
  return src;
}

function ImageGallery({ images, title }: { images: string[]; title: string }) {
  const [current, setCurrent] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  if (!images.length) return (
    <div className="aspect-[16/9] bg-gray-100 rounded-3xl flex items-center justify-center">
      <span className="text-gray-400">No images</span>
    </div>
  );

  return (
    <>
      <div className="relative rounded-3xl overflow-hidden aspect-[16/9] bg-gray-900 cursor-pointer" onClick={() => setLightbox(true)}>
        <img src={formatImg(images[current])} alt={title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

        {images.length > 1 && (
          <>
            <button onClick={(e) => { e.stopPropagation(); setCurrent((c) => (c - 1 + images.length) % images.length); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); setCurrent((c) => (c + 1) % images.length); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        <div className="absolute bottom-4 right-4 px-3 py-1 rounded-full bg-black/60 text-white text-xs font-medium">
          {current + 1} / {images.length}
        </div>
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button key={i} onClick={() => setCurrent(i)}
              className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${i === current ? 'border-amber-500' : 'border-transparent opacity-60 hover:opacity-100'}`}>
              <img src={formatImg(img)} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
            onClick={() => setLightbox(false)}>
            <button className="absolute top-4 right-4 text-white/80 hover:text-white p-2">
              <X className="w-6 h-6" />
            </button>
            <img src={formatImg(images[current])} alt={title} className="max-h-[90vh] max-w-full object-contain rounded-2xl"
              onClick={(e) => e.stopPropagation()} />
            {images.length > 1 && (
              <>
                <button onClick={(e) => { e.stopPropagation(); setCurrent((c) => (c - 1 + images.length) % images.length); }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white">
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); setCurrent((c) => (c + 1) % images.length); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white">
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function InquiryForm({ house }: { house: House }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ contactPhone: user?.phone || '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { navigate('/login'); return; }
    setLoading(true);
    try {
      await inquiryService.createInquiry({ houseId: house._id, ...form });
      toast.success('Inquiry sent! The broker will contact you shortly.');
      setForm({ contactPhone: user?.phone || '', message: '' });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send inquiry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-border shadow-sm p-6">
      <h3 className="font-bold text-foreground text-lg mb-4 flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-amber-500" /> Send Inquiry
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Phone Number</label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="tel" required placeholder="+251 911 234 567"
              value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
              className="w-full pl-10 pr-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:border-amber-500 text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Message</label>
          <textarea required rows={4} placeholder="I'm interested in this property..."
            value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
            className="w-full px-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:border-amber-500 text-sm resize-none" />
        </div>
        <button type="submit" disabled={loading}
          className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all hover:scale-[1.02]"
          style={{ background: 'linear-gradient(135deg, #E8B84B 0%, #C9922A 100%)', color: '#070C17' }}>
          {loading ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
          {loading ? 'Sending...' : 'Send Inquiry'}
        </button>
      </form>
    </div>
  );
}

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [wished, setWished] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['house', id],
    queryFn: () => houseService.getHouse(id!),
    enabled: !!id,
  });

  const house: House | undefined = data?.data;

  const favMutation = useMutation({
    mutationFn: () => wished ? favoriteService.removeFavorite(id!) : favoriteService.addFavorite(id!),
    onSuccess: () => {
      setWished((w) => !w);
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
    onError: () => toast.error('Please login to save favorites'),
  });

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-background pt-24">
      <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error || !house) return (
    <div className="min-h-screen flex items-center justify-center bg-background pt-24">
      <div className="text-center">
        <p className="text-muted-foreground mb-4">Property not found</p>
        <button onClick={() => navigate('/')} className="px-6 py-2 rounded-xl bg-amber-500 text-white font-semibold">
          Back to Home
        </button>
      </div>
    </div>
  );

  const broker = typeof house.brokerId === 'object' ? house.brokerId : 
                  typeof house.assignedBroker === 'object' ? house.assignedBroker :
                  typeof house.listedBy === 'object' ? house.listedBy : null;

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Back */}
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left — main content */}
          <div className="lg:col-span-2 space-y-8">
            {house.status === 'rented' && (
              <div className="p-4 rounded-2xl bg-purple-50 border-2 border-purple-200 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
                  <Key className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-bold text-purple-900 text-base">This Property Has Been Rented</h3>
                  <p className="text-xs text-purple-700 mt-0.5">
                    A formal lease agreement is in effect for this property. It is currently off the market and no longer accepting inquiries.
                  </p>
                </div>
              </div>
            )}
            <ImageGallery images={house.images} title={house.title} />

            {/* Title + badges */}
            <div>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {house.isPremium && (
                      <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold"
                        style={{ background: 'linear-gradient(135deg, #E8B84B, #C9922A)', color: '#070C17' }}>
                        <Award className="w-3 h-3" /> Premium
                      </span>
                    )}
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground capitalize">
                      {house.propertyType}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      house.status === 'rented' ? 'bg-purple-100 text-purple-700 border border-purple-300 font-bold uppercase tracking-wider' : house.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {house.status === 'rented' ? '🔒 Rented' : house.status}
                    </span>
                  </div>
                  <h1 className="text-2xl md:text-3xl font-black text-foreground" style={{ fontFamily: 'Urbanist, sans-serif' }}>
                    {house.title}
                  </h1>
                  <div className="flex items-center gap-1.5 mt-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">{house.location}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => { if (!user) { navigate('/login'); return; } favMutation.mutate(); }}
                    className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all hover:scale-110 ${
                      wished ? 'border-red-400 bg-red-50' : 'border-border bg-background'
                    }`}>
                    <Heart className={`w-4 h-4 ${wished ? 'fill-red-400 text-red-400' : 'text-muted-foreground'}`} />
                  </button>
                  <button onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Link copied!'); }}
                    className="w-10 h-10 rounded-full border-2 border-border bg-background flex items-center justify-center hover:scale-110 transition-all">
                    <Share2 className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </div>

              {/* Price + stats */}
              <div className="flex items-center gap-6 mt-4 flex-wrap">
                <div>
                  <span className="text-3xl font-black text-foreground" style={{ fontFamily: 'Urbanist, sans-serif' }}>
                    ETB {house.price.toLocaleString()}
                  </span>
                  <span className="text-muted-foreground text-sm ml-1">/month</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Eye className="w-4 h-4" />{house.views} views</span>
                  <span className="flex items-center gap-1"><MessageSquare className="w-4 h-4" />{house.inquiryCount} inquiries</span>
                </div>
              </div>

              {/* Key specs */}
              <div className="grid grid-cols-3 gap-4 mt-6 p-4 rounded-2xl bg-muted/50">
                {[
                  { icon: Bed, label: 'Bedrooms', value: house.bedrooms },
                  { icon: Bath, label: 'Bathrooms', value: house.bathrooms },
                  { icon: Square, label: 'Sq Ft', value: '—' },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="text-center">
                    <Icon className="w-5 h-5 mx-auto mb-1 text-amber-500" />
                    <div className="font-bold text-foreground text-lg">{value}</div>
                    <div className="text-xs text-muted-foreground">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <h2 className="text-xl font-bold text-foreground mb-3">Description</h2>
              <p className="text-muted-foreground leading-relaxed text-sm">{house.description}</p>
            </div>

            {/* Amenities */}
            {house.amenities.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-foreground mb-4">Amenities</h2>
                <div className="flex flex-wrap gap-3">
                  {house.amenities.map((a) => {
                    const key = a.toLowerCase().replace(/\s+/g, '');
                    const Icon = AMENITY_ICONS[key] || CheckCircle;
                    return (
                      <div key={a} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted text-sm font-medium text-foreground">
                        <Icon className="w-4 h-4 text-amber-500" />
                        {a}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Map placeholder */}
            {house.coordinates?.coordinates && (
              <div>
                <h2 className="text-xl font-bold text-foreground mb-4">Location</h2>
                <div className="rounded-2xl overflow-hidden h-64 bg-muted flex items-center justify-center border border-border">
                  <div className="text-center text-muted-foreground">
                    <MapPin className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">{house.location}</p>
                    <p className="text-xs mt-1">
                      {house.coordinates.coordinates[1].toFixed(4)}, {house.coordinates.coordinates[0].toFixed(4)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <div className="space-y-6">
            {/* Broker card */}
            {broker && (
              <div className="bg-white rounded-3xl border border-border shadow-sm p-6">
                <h3 className="font-bold text-foreground mb-4">Contact Broker</h3>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center overflow-hidden">
                    {broker.profileImage
                      ? <img src={broker.profileImage} alt={broker.name} className="w-full h-full object-cover" />
                      : <span className="font-bold text-amber-700 text-lg">{broker.name?.[0]}</span>
                    }
                  </div>
                  <div>
                    <p className="font-bold text-foreground text-sm">{broker.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{broker.role}</p>
                    {(broker as any).brokerCompanyName && (
                      <p className="text-xs text-muted-foreground">{(broker as any).brokerCompanyName}</p>
                    )}
                  </div>
                </div>
                {broker.phone && (
                  <a href={`tel:${broker.phone}`}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-border text-sm font-semibold text-foreground hover:border-amber-500 transition-colors">
                    <Phone className="w-4 h-4" /> {broker.phone}
                  </a>
                )}
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  Renters contact the broker for this property
                </p>
              </div>
            )}

            {/* Inquiry form */}
            {house.status === 'rented' ? (
              <div className="bg-white rounded-3xl border-2 border-purple-200 shadow-sm p-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto mb-3">
                  <Key className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-foreground text-lg">Property is Rented</h3>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  This property has already been leased to a tenant and is not accepting inquiries at this time.
                </p>
                <button
                  onClick={() => navigate('/properties')}
                  className="mt-5 w-full py-3 rounded-xl font-bold text-sm bg-purple-600 hover:bg-purple-700 text-white transition-colors"
                >
                  Browse Available Properties
                </button>
              </div>
            ) : (
              <InquiryForm house={house} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
