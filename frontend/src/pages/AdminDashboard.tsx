import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users, Home, DollarSign, TrendingUp, CheckCircle, XCircle,
  Shield, Clock, Trash2, Ban, Search, Briefcase,
} from 'lucide-react';
import { adminService } from '../services/admin.service';
import { brokerService } from '../services/broker.service';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

type AdminTab = 'dashboard' | 'users' | 'brokers' | 'listings' | 'transactions' | 'auditlogs';

function StatCard({ label, value, icon: Icon, color }: any) {
  return (
    <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-black text-foreground">{typeof value === 'number' ? value.toLocaleString() : value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<AdminTab>('dashboard');
  const [userSearch, setUserSearch] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [listingPage, setListingPage] = useState(1);
  const [listingStatus, setListingStatus] = useState('');

  // Queries
  const { data: dashData } = useQuery({
    queryKey: ['adminDashboard'],
    queryFn: () => adminService.getDashboard(),
    enabled: tab === 'dashboard',
    staleTime: 60_000,
  });

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['adminUsers', userPage, userSearch],
    queryFn: () => adminService.getUsers({ page: userPage, limit: 15, search: userSearch || undefined }),
    enabled: tab === 'users',
    staleTime: 30_000,
  });

  const { data: listingsData, isLoading: listingsLoading } = useQuery({
    queryKey: ['adminListings', listingPage, listingStatus],
    queryFn: () => adminService.getListings({ page: listingPage, limit: 15, status: listingStatus || undefined }),
    enabled: tab === 'listings',
    staleTime: 30_000,
  });

  const { data: txData } = useQuery({
    queryKey: ['adminTransactions'],
    queryFn: () => adminService.getTransactions({ limit: 20 }),
    enabled: tab === 'transactions',
    staleTime: 30_000,
  });

  const { data: auditData } = useQuery({
    queryKey: ['adminAuditLogs'],
    queryFn: () => adminService.getAuditLogs({ limit: 30 }),
    enabled: tab === 'auditlogs',
    staleTime: 30_000,
  });

  // Broker applications
  const [brokerPage, setBrokerPage] = useState(1);
  const [brokerStatus, setBrokerStatus] = useState('pending');

  const { data: brokerAppsData, isLoading: brokerLoading } = useQuery({
    queryKey: ['brokerApplications', brokerPage, brokerStatus],
    queryFn: () => brokerService.getBrokerApplications({ page: brokerPage, limit: 15, status: brokerStatus || undefined }),
    enabled: tab === 'brokers',
    staleTime: 30_000,
  });

  const approveBroker = useMutation({
    mutationFn: (userId: string) => brokerService.approveBrokerApplication(userId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['brokerApplications'] }); toast.success('Broker approved!'); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const rejectBroker = useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) =>
      brokerService.rejectBrokerApplication(userId, reason),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['brokerApplications'] }); toast.success('Broker rejected'); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  // Mutations
  const approveUser = useMutation({
    mutationFn: (id: string) => adminService.approveUser(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['adminUsers'] }); toast.success('User approved'); },
  });
  const suspendUser = useMutation({
    mutationFn: (id: string) => adminService.suspendUser(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['adminUsers'] }); toast.success('User suspended'); },
  });
  const banUser = useMutation({
    mutationFn: (id: string) => adminService.banUser(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['adminUsers'] }); toast.success('User banned'); },
  });
  const approveListing = useMutation({
    mutationFn: (id: string) => adminService.approveListing(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['adminListings'] }); toast.success('Listing approved'); },
  });
  const rejectListing = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => adminService.rejectListing(id, reason),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['adminListings'] }); toast.success('Listing rejected'); },
  });
  const deleteListing = useMutation({
    mutationFn: (id: string) => adminService.deleteListing(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['adminListings'] }); toast.success('Listing deleted'); },
  });

  const stats = dashData?.data;
  const users = usersData?.data || [];
  const userPagination = usersData?.pagination;
  const listings = listingsData?.data || [];
  const listingPagination = listingsData?.pagination;
  const transactions = txData?.data || [];
  const auditLogs = auditData?.data || [];

  const brokerApps: any[] = brokerAppsData?.data || [];
  const brokerAppPagination = brokerAppsData?.pagination;

  const TABS: { id: AdminTab; label: string; icon: any }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'brokers', label: 'Broker Apps', icon: Briefcase },
    { id: 'listings', label: 'Listings', icon: Home },
    { id: 'transactions', label: 'Transactions', icon: DollarSign },
    { id: 'auditlogs', label: 'Audit Logs', icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-foreground" style={{ fontFamily: 'Urbanist, sans-serif' }}>
            Admin Panel
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Welcome, {user?.name}</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm whitespace-nowrap transition-all ${
                tab === id ? 'text-[#070C17]' : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
              style={tab === id ? { background: 'linear-gradient(135deg, #E8B84B, #C9922A)' } : {}}>
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        {/* Dashboard */}
        {tab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total Users" value={stats?.totalUsers || 0} icon={Users} color="bg-blue-50 text-blue-600" />
              <StatCard label="Total Listings" value={stats?.totalListings || 0} icon={Home} color="bg-amber-50 text-amber-600" />
              <StatCard label="Revenue (ETB)" value={stats?.totalRevenue || 0} icon={DollarSign} color="bg-green-50 text-green-600" />
              <StatCard label="Pending Approvals" value={(stats?.pendingListings || 0) + (stats?.pendingUsers || 0)} icon={Clock} color="bg-orange-50 text-orange-600" />
            </div>
          </div>
        )}

        {/* Users */}
        {tab === 'users' && (
          <div className="bg-white rounded-3xl border border-border shadow-sm overflow-hidden">
            <div className="p-5 border-b border-border flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input value={userSearch} onChange={(e) => { setUserSearch(e.target.value); setUserPage(1); }}
                  placeholder="Search users..."
                  className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-amber-500" />
              </div>
            </div>
            {usersLoading ? (
              <div className="p-8 text-center"><div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase">Name</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase">Role</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase">Status</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase">Approved</th>
                      <th className="px-6 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u: any) => (
                      <tr key={u._id} className="border-b border-border hover:bg-muted/20">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-foreground">{u.name}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </td>
                        <td className="px-6 py-4 capitalize"><span className="px-2 py-1 rounded-full text-xs bg-muted text-muted-foreground">{u.role}</span></td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            u.status === 'active' ? 'bg-green-100 text-green-700' :
                            u.status === 'suspended' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>{u.status}</span>
                        </td>
                        <td className="px-6 py-4">
                          {u.isApproved
                            ? <span className="flex items-center gap-1 text-green-600 text-xs"><CheckCircle className="w-3 h-3" />Yes</span>
                            : <span className="text-xs text-muted-foreground">No</span>}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1 justify-end">
                            {!u.isApproved && (
                              u.role === 'broker' ? (
                                <button onClick={() => setTab('brokers')}
                                  className="px-2 py-1 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 text-xs font-semibold">
                                  Review in Broker Apps
                                </button>
                              ) : (
                                <button onClick={() => approveUser.mutate(u._id)}
                                  className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 text-xs font-semibold">
                                  Approve
                                </button>
                              )
                            )}
                            {u.status === 'active' && (
                              <button onClick={() => suspendUser.mutate(u._id)}
                                className="p-1.5 rounded-lg bg-yellow-50 text-yellow-600 hover:bg-yellow-100 text-xs">
                                Suspend
                              </button>
                            )}
                            {u.status !== 'banned' && (
                              <button onClick={() => { if (confirm(`Ban ${u.name}?`)) banUser.mutate(u._id); }}
                                className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100">
                                <Ban className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {userPagination && userPagination.pages > 1 && (
              <div className="flex items-center justify-center gap-2 p-4 border-t border-border">
                <button disabled={userPage === 1} onClick={() => setUserPage((p) => p - 1)}
                  className="px-4 py-2 rounded-xl border text-sm disabled:opacity-40">Previous</button>
                <span className="text-sm text-muted-foreground">Page {userPage} of {userPagination.pages}</span>
                <button disabled={userPage === userPagination.pages} onClick={() => setUserPage((p) => p + 1)}
                  className="px-4 py-2 rounded-xl border text-sm disabled:opacity-40">Next</button>
              </div>
            )}
          </div>
        )}

        {/* Listings */}
        {tab === 'listings' && (
          <div className="bg-white rounded-3xl border border-border shadow-sm overflow-hidden">
            <div className="p-5 border-b border-border flex items-center gap-4">
              <select value={listingStatus} onChange={(e) => { setListingStatus(e.target.value); setListingPage(1); }}
                className="px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-amber-500 bg-background">
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            {listingsLoading ? (
              <div className="p-8 text-center"><div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase">Title</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase">Price</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase">Status</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase">Owner</th>
                      <th className="px-6 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {listings.map((l: any) => (
                      <tr key={l._id} className="border-b border-border hover:bg-muted/20">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-foreground truncate max-w-48">{l.title}</p>
                          <p className="text-xs text-muted-foreground">{l.location}</p>
                        </td>
                        <td className="px-6 py-4 font-semibold">ETB {l.price?.toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            l.status === 'approved' ? 'bg-green-100 text-green-700' :
                            l.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>{l.status}</span>
                        </td>
                        <td className="px-6 py-4 text-xs text-muted-foreground">{l.listedBy?.name || '—'}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1 justify-end">
                            {l.status === 'pending' && (
                              <>
                                <button onClick={() => approveListing.mutate(l._id)}
                                  className="px-2 py-1 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 text-xs font-medium">
                                  Approve
                                </button>
                                <button onClick={() => { const r = prompt('Rejection reason?') || 'Does not meet requirements'; rejectListing.mutate({ id: l._id, reason: r }); }}
                                  className="px-2 py-1 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 text-xs font-medium">
                                  Reject
                                </button>
                              </>
                            )}
                            <button onClick={() => { if (confirm('Delete this listing?')) deleteListing.mutate(l._id); }}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {listingPagination && listingPagination.pages > 1 && (
              <div className="flex items-center justify-center gap-2 p-4 border-t border-border">
                <button disabled={listingPage === 1} onClick={() => setListingPage((p) => p - 1)}
                  className="px-4 py-2 rounded-xl border text-sm disabled:opacity-40">Previous</button>
                <span className="text-sm text-muted-foreground">Page {listingPage} of {listingPagination.pages}</span>
                <button disabled={listingPage === listingPagination.pages} onClick={() => setListingPage((p) => p + 1)}
                  className="px-4 py-2 rounded-xl border text-sm disabled:opacity-40">Next</button>
              </div>
            )}
          </div>
        )}

        {/* Broker Applications */}
        {tab === 'brokers' && (
          <div className="bg-white rounded-3xl border border-border shadow-sm overflow-hidden">
            <div className="p-5 border-b border-border flex items-center gap-4">
              <select value={brokerStatus} onChange={(e) => { setBrokerStatus(e.target.value); setBrokerPage(1); }}
                className="px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-amber-500 bg-background">
                <option value="">All Applications</option>
                <option value="pending">Pending Review (500 ETB Paid)</option>
                <option value="payment_pending">Payment Pending (Unpaid)</option>
                <option value="approved">Approved Brokers</option>
                <option value="rejected">Rejected Applications</option>
              </select>
            </div>
            {brokerLoading ? (
              <div className="p-8 text-center"><div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
            ) : brokerApps.length === 0 ? (
              <div className="p-12 text-center">
                <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="font-bold text-foreground mb-2">No broker applications</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {brokerApps.map((app: any) => {
                  const tx = app.brokerRegistrationTxId;
                  return (
                    <div key={app._id} className="p-6 hover:bg-muted/10 transition-colors">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0">
                            <span className="font-bold text-amber-700 text-lg">{app.name?.[0]}</span>
                          </div>
                          <div>
                            <p className="font-bold text-foreground">{app.name}</p>
                            <p className="text-xs text-muted-foreground">{app.email}</p>
                            {app.brokerCompanyName && <p className="text-xs text-muted-foreground mt-0.5">{app.brokerCompanyName}</p>}
                            {app.brokerOfficeAddress && <p className="text-xs text-muted-foreground">{app.brokerOfficeAddress}</p>}
                            {app.brokerYearsExperience > 0 && <p className="text-xs text-amber-600">{app.brokerYearsExperience} years experience</p>}
                            {app.brokerDescription && (
                              <p className="text-xs text-muted-foreground mt-2 max-w-md line-clamp-2">{app.brokerDescription}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            app.brokerApplicationStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            app.brokerApplicationStatus === 'approved' ? 'bg-green-100 text-green-700' :
                            app.brokerApplicationStatus === 'payment_pending' ? 'bg-amber-100 text-amber-800' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {app.brokerApplicationStatus === 'payment_pending' ? 'Payment Pending' :
                             app.brokerApplicationStatus === 'pending' ? 'Pending Admin Review' :
                             app.brokerApplicationStatus}
                          </span>

                          {tx ? (
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">Registration Fee: <span className="font-semibold text-foreground">ETB {tx.amount}</span></p>
                              <p className={`text-xs font-semibold capitalize ${tx.status === 'success' ? 'text-green-600' : 'text-amber-600'}`}>
                                {tx.status === 'success' ? '✓ Paid & Confirmed' : '⏳ Payment Unconfirmed'} · {tx.paymentMethod}
                              </p>
                              {tx.receiptNumber && (
                                <p className="text-[10px] text-muted-foreground font-mono">{tx.receiptNumber}</p>
                              )}
                            </div>
                          ) : (
                            <div className="text-right">
                              <p className="text-xs text-red-600 font-semibold">No Payment Initiated</p>
                            </div>
                          )}

                          {app.brokerApplicationStatus === 'pending' && (
                            <div className="flex gap-2">
                              {tx?.status === 'success' ? (
                                <button onClick={() => approveBroker.mutate(app._id)} disabled={approveBroker.isPending}
                                  className="px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 text-xs font-semibold transition-colors">
                                  Approve Broker
                                </button>
                              ) : (
                                <button disabled
                                  title="Cannot approve without verified 500 ETB payment"
                                  className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-400 text-xs font-semibold cursor-not-allowed">
                                  Payment Required
                                </button>
                              )}
                              <button onClick={() => {
                                const reason = prompt('Rejection reason:') || 'Does not meet requirements';
                                rejectBroker.mutate({ userId: app._id, reason });
                              }} disabled={rejectBroker.isPending}
                                className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-xs font-semibold transition-colors">
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {brokerAppPagination && brokerAppPagination.pages > 1 && (
              <div className="flex items-center justify-center gap-2 p-4 border-t border-border">
                <button disabled={brokerPage === 1} onClick={() => setBrokerPage((p) => p - 1)} className="px-4 py-2 rounded-xl border text-sm disabled:opacity-40">Previous</button>
                <span className="text-sm text-muted-foreground">Page {brokerPage} of {brokerAppPagination.pages}</span>
                <button disabled={brokerPage === brokerAppPagination.pages} onClick={() => setBrokerPage((p) => p + 1)} className="px-4 py-2 rounded-xl border text-sm disabled:opacity-40">Next</button>
              </div>
            )}
          </div>
        )}

        {/* Transactions */}
        {tab === 'transactions' && (
          <div className="bg-white rounded-3xl border border-border shadow-sm overflow-hidden">
            <div className="p-5 border-b border-border"><h2 className="font-bold text-foreground">Transactions</h2></div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase">Reference</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase">Amount</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase">Method</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase">Status</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx: any) => (
                    <tr key={tx._id} className="border-b border-border hover:bg-muted/20">
                      <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{tx.reference}</td>
                      <td className="px-6 py-4 font-semibold">ETB {tx.amount?.toLocaleString()}</td>
                      <td className="px-6 py-4 capitalize text-muted-foreground">{tx.paymentMethod}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          tx.status === 'success' ? 'bg-green-100 text-green-700' :
                          tx.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>{tx.status}</span>
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Audit Logs */}
        {tab === 'auditlogs' && (
          <div className="bg-white rounded-3xl border border-border shadow-sm overflow-hidden">
            <div className="p-5 border-b border-border"><h2 className="font-bold text-foreground">Audit Logs</h2></div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase">Action</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase">Admin</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase">Target</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log: any) => (
                    <tr key={log._id} className="border-b border-border hover:bg-muted/20">
                      <td className="px-6 py-4"><span className="px-2 py-1 rounded bg-muted text-xs font-mono">{log.action}</span></td>
                      <td className="px-6 py-4 text-muted-foreground">{log.adminId?.name || log.adminId}</td>
                      <td className="px-6 py-4 text-muted-foreground">{log.targetId}</td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
