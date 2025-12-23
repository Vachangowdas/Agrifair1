
import { User, Complaint, FeaturedFarmer } from '../types';
import { supabase } from './supabaseClient';

// Helper for local storage fallbacks
const getLocal = <T>(key: string): T[] => {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch (e) {
    return [];
  }
};

const setLocal = <T>(key: string, data: T[]) => localStorage.setItem(key, JSON.stringify(data));

// Simple UUID generator for local mode
const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

export const DatabaseService = {
  // User Operations
  findUserByMobile: async (mobile: string): Promise<User | undefined> => {
    if (supabase) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('mobile', mobile)
        .maybeSingle();
      
      if (error) {
        console.error('[Supabase] Error finding user:', error.message);
        return undefined;
      }
      return data as User;
    } else {
      const users = getLocal<User>('agrifair_users');
      return users.find(u => u.mobile === mobile);
    }
  },

  createUser: async (user: Partial<User>): Promise<void> => {
    if (supabase) {
      const { error } = await supabase
        .from('users')
        .insert([user]);
      
      if (error) {
        console.error('[Supabase] Error creating user:', error.message);
        throw error;
      }
    } else {
      const users = getLocal<User>('agrifair_users');
      const newUser = { ...user, id: user.id || generateId() } as User;
      users.push(newUser);
      setLocal('agrifair_users', users);
    }
  },

  // NEW: OTP Operations for Cross-Device Login
  setUserOtp: async (mobile: string, otp: string): Promise<void> => {
    if (supabase) {
      // Try to update the 'otp' column. Note: This column must exist in your Supabase 'users' table.
      // If it doesn't exist, this might fail silently or throw, but we catch it in AuthContext.
      try {
        await supabase.from('users').update({ otp_code: otp }).eq('mobile', mobile);
      } catch (e) {
        console.warn("[Supabase] Could not save OTP to DB (Column might be missing). Fallback to local state.");
      }
    }
    // Local storage doesn't need this as local state handles single-device
  },

  verifyUserOtp: async (mobile: string, otp: string): Promise<boolean> => {
    if (supabase) {
      const { data } = await supabase
        .from('users')
        .select('otp_code')
        .eq('mobile', mobile)
        .maybeSingle();
      
      // If DB has the code and it matches
      if (data && data.otp_code && String(data.otp_code) === String(otp)) {
        return true;
      }
    }
    return false;
  },

  // Complaint Operations
  getComplaintsByUserId: async (userId: string): Promise<Complaint[]> => {
    if (supabase) {
      const { data, error } = await supabase
        .from('complaints')
        .select('*')
        .or(`userId.eq.${userId},user_id.eq.${userId}`)
        .order('date', { ascending: false });
      
      if (error) {
        console.error('[Supabase] Error fetching complaints:', error.message);
        return [];
      }
      return data as Complaint[];
    } else {
      const complaints = getLocal<Complaint>('agrifair_complaints');
      return complaints.filter(c => c.userId === userId);
    }
  },

  createComplaint: async (complaint: Partial<Complaint>): Promise<void> => {
    if (supabase) {
      const { error } = await supabase
        .from('complaints')
        .insert([complaint]);
      
      if (error) {
        console.error('[Supabase] Error creating complaint:', error.message);
        throw error;
      }
    } else {
      const complaints = getLocal<Complaint>('agrifair_complaints');
      const newComplaint = { ...complaint, id: generateId() } as Complaint;
      complaints.push(newComplaint);
      setLocal('agrifair_complaints', complaints);
    }
  },

  // Featured Farmer Operations
  getAllFeaturedFarmers: async (): Promise<FeaturedFarmer[]> => {
    if (supabase) {
      const { data, error } = await supabase
        .from('featured_farmers')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) {
        console.error('[Supabase] Error fetching featured farmers:', error.message);
        return [];
      }
      return (data || []).map(item => ({
        id: item.id,
        userId: item.userId || item.user_id,
        name: item.name,
        bio: item.bio,
        photo: item.photo,
        date: item.date
      })) as FeaturedFarmer[];
    } else {
      return getLocal<FeaturedFarmer>('agrifair_featured');
    }
  },

  upsertFeaturedFarmer: async (farmer: FeaturedFarmer): Promise<void> => {
    if (supabase) {
      const payload = {
        ...farmer,
        user_id: farmer.userId
      };
      
      const { error } = await supabase
        .from('featured_farmers')
        .upsert(payload);
      
      if (error) {
        console.error('[Supabase] Error upserting farmer:', error.message);
        throw error;
      }
    } else {
      const farmers = getLocal<FeaturedFarmer>('agrifair_featured');
      const index = farmers.findIndex(f => f.userId === farmer.userId);
      if (index > -1) {
        farmers[index] = farmer;
      } else {
        farmers.push(farmer);
      }
      setLocal('agrifair_featured', farmers);
    }
  },

  deleteFeaturedFarmer: async (identifier: string): Promise<void> => {
    if (supabase) {
      const { error } = await supabase
        .from('featured_farmers')
        .delete()
        .or(`id.eq.${identifier},userId.eq.${identifier},user_id.eq.${identifier}`);
      
      if (error) {
        console.error('[Supabase] Error deleting farmer:', error.message);
        throw error;
      }
    } 
    
    const farmers = getLocal<FeaturedFarmer>('agrifair_featured');
    const filtered = farmers.filter(f => f.userId !== identifier && f.id !== identifier);
    setLocal('agrifair_featured', filtered);
  }
};
