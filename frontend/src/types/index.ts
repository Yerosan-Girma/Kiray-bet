export interface User {
  _id: string;
  id?: string;
  name: string;
  email: string;
  phone?: string;
  role: 'renter' | 'owner' | 'broker' | 'admin';
  profileImage?: string;
  isApproved: boolean;
  isPremium: boolean;
  premiumExpiry?: string | null;
  status: 'active' | 'suspended' | 'banned';
  emailVerified?: boolean;
  createdAt?: string;
}

export interface House {
  _id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  coordinates: {
    type: 'Point';
    coordinates: [number, number];
  };
  bedrooms: number;
  bathrooms: number;
  propertyType: 'apartment' | 'house' | 'condo' | 'studio' | 'villa' | 'townhouse';
  amenities: string[];
  images: string[];
  listedBy: User | string;
  isPremium: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'inactive';
  isActive: boolean;
  views: number;
  inquiryCount: number;
  isFlagged?: boolean;
  flagReason?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface HouseFilters {
  search?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  propertyType?: string;
  amenities?: string[];
  isPremium?: boolean;
  sort?: 'newest' | 'oldest' | 'price_asc' | 'price_desc' | 'views' | 'inquiries';
  page?: number;
  limit?: number;
}

export interface Reply {
  _id?: string;
  userId: User | string;
  message: string;
  createdAt: string;
}

export interface Inquiry {
  _id: string;
  houseId: House | string;
  userId: User | string;
  contactPhone: string;
  status: 'active' | 'resolved' | 'archived';
  replies: Reply[];
  createdAt: string;
  updatedAt?: string;
}

export interface Notification {
  _id: string;
  userId: string;
  type: 'new_inquiry' | 'new_reply' | 'listing_approved' | 'listing_rejected' | 'premium_activated' | 'listing_flagged';
  message: string;
  data: Record<string, any>;
  read: boolean;
  createdAt: string;
}

export interface Transaction {
  _id: string;
  userId: string;
  amount: number;
  paymentMethod: 'chapa' | 'telebirr' | 'mpesa';
  reference: string;
  receiptNumber?: string;
  status: 'pending' | 'success' | 'failed';
  failureReason?: string;
  createdAt: string;
}

export interface Favorite {
  _id: string;
  userId: string;
  houseId: House;
  createdAt: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalListings: number;
  totalTransactions: number;
  totalRevenue: number;
  pendingListings: number;
  pendingUsers: number;
  activeListings: number;
  recentActivity?: any[];
}
