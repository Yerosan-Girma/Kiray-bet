import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import {
  Home, CheckCircle, XCircle, Clock, MessageSquare, Eye,
  Edit2, Trash2, Upload, X, ArrowRight, Image as ImageIcon,
  Plus, Users,
} from 'lucide-react';
import { brokerService } from '../services/broker.service';
import { houseService } from '../services/house.service';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Link, Navigate } from 'react-router';
import type { House } from '../types';

type BrokerTab = 'submissions' | 'listings' | 'messages';

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending_broker: { label: 'Pending Review', cls: 'bg-yellow-100 text-yellow-700' },
    accepted: { label: 'Accepted', cls: 'bg-blue-100 text-blue-700' },
    rejected: { label: 'Rejected', cls: 'bg-red-100 text-red-700' },
    approved: { label: 'Published', cls: 'bg-green-100 text-green-700' },
    pending: { label: 'Pending Admin', cls: 'bg-orange-100 text-orange-700' },
  };
  const s = map[status] || { label: status, cls: 'bg-muted text-muted-foreground' };
  return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${s.cls}`}>{s.label}</span>;
}

export default function BrokerDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<BrokerTab>('submissions');

  // Gate: must be approved broker
  if (!user?.isApproved || user?.role !== 'broker') {
    return <Navigate to="/broker/pending" replace />;
  }

  // Queries
  const { data: submissionsData, isLoading: subLoading } = useQuery({
    queryKey: ['brokerSubmissions'],
    queryFn: () => brokerService.getMySubmissions(),
    enabled: tab === 'submissions',
    staleTime: 30_000,
  });

  const { data: listingsData, isLoading: listLoading } = useQuery({
    queryKey: ['myListings'],
    queryFn: () => houseService.getMyListings(),
    enabled: tab === 'listings',
    staleTime: 30_000,
  });

  const respondMutation = useMutation({
    mutationFn: ({ houseId, action, notes }: { houseId: string; action: 'accept' | 'reject'; notes?: string }) =>
      brokerService.respondToSubmission(houseId, action, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brokerSubmissions'] });
      toast.success('Response sent to owner');
    },
    onError: () => toast.error('Failed to respond'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => houseService.deleteHouse(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['myListings'] }); toast.success('Listing deleted'); },
  });

  const submissions: House[] = submissionsData?.data || [];
  const listings: House[] = listingsData?.data || [];

  const pending = submissions.filter((s) => (s as any).brokerSubmissionStatus === 'pending_broker');
  const accepted = submissions.filter((s) => (s as any).brokerSubmissionStatus === 'accepted');

  const TABS: { id: BrokerTab; label: string; icon: any; count?: number }[] = [
    { id: 'submissions', label: 'Owner Submissions', icon: Users, count: pending.length },
    { id: 'listings', label: 'My Listings', icon: Home },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-foreground" style={{ fontFamily: 'Urbanist, sans-serif' }}>
            Broker Dashboard
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Welcome, {user?.name}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Pending Reviews', value: pending.length, color: 'bg-yellow-50 text-yellow-600', icon: Clock },
            { label: 'Accepted', value: accepted.length, color: 'bg-blue-50 text-blue-600', icon: CheckCircle },
            { label: 'Published', value: listings.filter((l) => l.status === 'approved').length, color: 'bg-green-50 text-green-600', icon: Eye },
            { label: 'Total Listings', value: listings.length, color: 'bg-purple-50 text-purple-600', icon: Home },
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} className="bg-white rounded-2xl border border-border p-5 shadow-sm">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-black text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {TABS.map(({ id, label, icon: Icon, count }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                tab === id ? 'text-[#070C17]' : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
              style={tab === id ? { background: 'linear-gradient(135deg, #E8B84B, #C9922A)' } : {}}>
              <Icon className="w-4 h-4" />
              {label}
              {count !== undefined && count > 0 && (
                <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                  tab === id ? 'bg-[#070C17]/20 text-[#070C17]' : 'bg-amber-500 text-white'
                }`}>{count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Owner Submissions */}
        {tab === 'submissions' && (
          <div className="bg-white rounded-3xl border border-border shadow-sm overflow-hidden">
            <div className="p-5 border-b border-border">
              <h2 className="font-bold text-foreground">Owner Submissions</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Review and respond to property submissions from owners</p>
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
                {submissions.map((s) => {
                  const owner = typeof (s as any).ownerId === 'object' ? (s as any).ownerId : null;
                  const subStatus = (s as any).brokerSubmissionStatus;
                  return (
                    <div key={s._id} className="p-6 hover:bg-muted/10 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-muted shrink-0">
                          {s.images?.[0] ? <img src={s.images[0]} alt="" className="w-full h-full object-cover" /> : <ImageIcon className="w-6 h-6 text-muted-foreground m-auto" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <div>
                              <h3 className="font-bold text-foreground">{s.title}</h3>
                              <p className="text-xs text-muted-foreground mt-0.5">{s.location} · ETB {s.price?.toLocaleString()}/mo</p>
                              <p className="text-xs text-muted-foreground">{s.bedrooms} bed · {s.bathrooms} bath · {s.propertyType}</p>
                              {owner && (
                                <div className="flex items-center gap-2 mt-2">
                                  <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-700">
                                    {owner.name?.[0]}
                                  </div>
                                  <span className="text-xs text-muted-foreground">from {owner.name}</span>
                                  {owner.phone && <span className="text-xs text-muted-foreground">· {owner.phone}</span>}
                                </div>
                              )}
                            </div>
                            <StatusBadge status={subStatus} />
                          </div>

                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{s.description}</p>

                          {/* Actions */}
                          {subStatus === 'pending_broker' && (
                            <div className="flex items-center gap-3 mt-4">
                              <button onClick={() => respondMutation.mutate({ houseId: s._id, action: 'accept' })}
                                disabled={respondMutation.isPending}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-50 text-green-700 hover:bg-green-100 font-semibold text-sm transition-colors">
                                <CheckCircle className="w-4 h-4" /> Accept
                              </button>
                              <button onClick={() => {
                                const notes = prompt('Rejection reason (optional):') || '';
                                respondMutation.mutate({ houseId: s._id, action: 'reject', notes });
                              }}
                                disabled={respondMutation.isPending}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 font-semibold text-sm transition-colors">
                                <XCircle className="w-4 h-4" /> Reject
                              </button>
                              {owner && (
                                <Link to={`/messages/${owner._id}`}
                                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted text-foreground hover:bg-muted/80 font-semibold text-sm transition-colors ml-auto">
                                  <MessageSquare className="w-4 h-4" /> Message Owner
                                </Link>
                              )}
                            </div>
                          )}

                          {subStatus === 'accepted' && owner && (
                            <div className="mt-4">
                              <Link to={`/messages/${owner._id}`}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-muted text-foreground hover:bg-muted/80 font-semibold text-sm transition-colors">
                                <MessageSquare className="w-4 h-4" /> Message Owner
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* My Listings */}
        {tab === 'listings' && (
          <div className="bg-white rounded-3xl border border-border shadow-sm overflow-hidden">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h2 className="font-bold text-foreground">My Published Listings</h2>
            </div>

            {listLoading ? (
              <div className="p-8 text-center"><div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
            ) : listings.length === 0 ? (
              <div className="p-12 text-center">
                <Home className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="font-bold text-foreground mb-2">No listings yet</p>
                <p className="text-sm text-muted-foreground">Accept owner submissions to create listings</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase">Property</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase">Owner</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase">Status</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase">Views</th>
                      <th className="px-6 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {listings.map((l) => {
                      const owner = typeof (l as any).ownerId === 'object' ? (l as any).ownerId : null;
                      return (
                        <tr key={l._id} className="border-b border-border hover:bg-muted/20">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl overflow-hidden bg-muted shrink-0">
                                {l.images?.[0] ? <img src={l.images[0]} alt="" className="w-full h-full object-cover" /> : <ImageIcon className="w-5 h-5 text-muted-foreground m-auto" />}
                              </div>
                              <div>
                                <p className="font-semibold text-foreground truncate max-w-40">{l.title}</p>
                                <p className="text-xs text-muted-foreground">ETB {l.price?.toLocaleString()}/mo</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-xs text-muted-foreground">{owner?.name || '—'}</td>
                          <td className="px-6 py-4"><StatusBadge status={l.status} /></td>
                          <td className="px-6 py-4 text-muted-foreground">{l.views}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 justify-end">
                              {owner && (
                                <Link to={`/messages/${owner._id}`}
                                  className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-amber-500">
                                  <MessageSquare className="w-4 h-4" />
                                </Link>
                              )}
                              <button onClick={() => { if (confirm('Delete?')) deleteMutation.mutate(l._id); }}
                                className="p-2 rounded-xl hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors">
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
        )}

        {/* Messages redirect */}
        {tab === 'messages' && (
          <div className="bg-white rounded-3xl border border-border shadow-sm p-12 text-center">
            <MessageSquare className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h3 className="font-bold text-foreground text-lg mb-2">Messaging Center</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Communicate with property owners and renters in real time
            </p>
            <Link to="/messages"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-sm transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #E8B84B, #C9922A)', color: '#070C17' }}>
              Open Messages <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
