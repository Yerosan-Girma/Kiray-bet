import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { User, Mail, Phone, Lock, Camera, Award, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/auth.service';
import api from '../api/axios';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
  });
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      // Backend doesn't have a dedicated update-profile route yet, we use what's available
      // For now we update via auth service pattern
      const response = await api.put('/auth/profile', profileForm);
      updateUser(response.data.data);
      toast.success('Profile updated successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setPasswordLoading(true);
    try {
      await authService.changePassword({
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success('Password changed successfully');
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile Info', icon: User },
    { id: 'password', label: 'Change Password', icon: Lock },
  ];

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-6 mb-8 p-6 rounded-3xl bg-white border border-border shadow-sm">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-amber-100 flex items-center justify-center overflow-hidden">
              {user?.profileImage
                ? <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
                : <span className="text-3xl font-black text-amber-700">{user?.name?.[0]}</span>
              }
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground" style={{ fontFamily: 'Urbanist, sans-serif' }}>
              {user?.name}
            </h1>
            <p className="text-muted-foreground text-sm">{user?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 capitalize">
                {user?.role}
              </span>
              {user?.isPremium && (
                <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold"
                  style={{ background: 'linear-gradient(135deg, #E8B84B, #C9922A)', color: '#070C17' }}>
                  <Award className="w-3 h-3" /> Premium
                </span>
              )}
              <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                user?.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {user?.status === 'active'
                  ? <><CheckCircle className="w-3 h-3" /> Active</>
                  : <><AlertCircle className="w-3 h-3" /> {user?.status}</>}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id as any)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                activeTab === id
                  ? 'text-[#070C17]'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
              style={activeTab === id ? { background: 'linear-gradient(135deg, #E8B84B, #C9922A)' } : {}}>
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-white rounded-3xl border border-border shadow-sm p-6 md:p-8">
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileUpdate} className="space-y-5 max-w-md">
              <h2 className="font-bold text-foreground text-lg mb-6">Personal Information</h2>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type="text" required value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:border-amber-500 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type="email" disabled value={user?.email || ''}
                    className="w-full pl-10 pr-4 py-3 border-2 border-border rounded-xl bg-muted text-sm text-muted-foreground cursor-not-allowed" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type="tel" value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    placeholder="+254 700 000 000"
                    className="w-full pl-10 pr-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:border-amber-500 text-sm" />
                </div>
              </div>
              <button type="submit" disabled={profileLoading}
                className="px-8 py-3 rounded-xl font-bold text-sm disabled:opacity-50 transition-all hover:scale-[1.02]"
                style={{ background: 'linear-gradient(135deg, #E8B84B, #C9922A)', color: '#070C17' }}>
                {profileLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          )}

          {activeTab === 'password' && (
            <form onSubmit={handlePasswordChange} className="space-y-5 max-w-md">
              <h2 className="font-bold text-foreground text-lg mb-6">Change Password</h2>
              {['oldPassword', 'newPassword', 'confirmPassword'].map((field) => (
                <div key={field}>
                  <label className="block text-sm font-semibold text-foreground mb-1.5 capitalize">
                    {field === 'oldPassword' ? 'Current Password' : field === 'newPassword' ? 'New Password' : 'Confirm New Password'}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input type="password" required
                      value={passwordForm[field as keyof typeof passwordForm]}
                      onChange={(e) => setPasswordForm({ ...passwordForm, [field]: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:border-amber-500 text-sm" />
                  </div>
                </div>
              ))}
              <button type="submit" disabled={passwordLoading}
                className="px-8 py-3 rounded-xl font-bold text-sm disabled:opacity-50 transition-all hover:scale-[1.02]"
                style={{ background: 'linear-gradient(135deg, #E8B84B, #C9922A)', color: '#070C17' }}>
                {passwordLoading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
