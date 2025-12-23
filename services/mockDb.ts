
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
    // Priority 1: Check Cloud (Supabase)
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('mobile', mobile)
          .maybeSingle();
        
        if (data) return data as User;
        // Only log warning if it's a real error, not just 'not found'
        if (error) console.warn('[Supabase] Find user warning:', error.message);
      } catch (e) {
        console.warn('[Supabase] Connection failed, checking local:', e);
      }
    }
    
    // Priority 2: Fallback to Local Storage
    // This ensures that if the DB is down or the user was created offline/locally, they can still login.
    const users = getLocal<User>('agrifair_users');
    return users.find(u => u.mobile === mobile);
  },

  createUser: async (user: Partial<User>): Promise<void> => {
    let cloudSuccess = false;
    
    // Attempt Cloud Creation
    if (supabase) {
      try {
        const { error } = await supabase
          .from('users')
          .insert([user]);
        
        if (!error) {
          cloudSuccess = true;
        } else {
          console.warn('[Supabase] Create user failed, falling back to local:', error.message);
        }
      } catch (e) {
        console.warn('[Supabase] Exception during create, falling back to local:', e);
      }
    } 

    // Always ensure data exists in Local Storage as a fail-safe backup
    // Or if cloud failed, this becomes the primary storage
    const users = getLocal<User>('agrifair_users');
    // Prevent duplicates in local storage
    if (!users.find(u => u.mobile === user.mobile)) {
      const newUser = { ...user, id: user.id || generateId() } as User;
      users.push(newUser);
      setLocal('agrifair_users', users);
    }
  },

  // OTP Operations
  setUserOtp: async (mobile: string, otp: string): Promise<void> => {
    if (supabase) {
      try {
        // Attempt to update OTP. If column doesn't exist or user doesn't exist, ignore error.
        await supabase.from('users').update({ otp_code: otp }).eq('mobile', mobile);
      } catch (e) {
        console.warn("[Supabase] OTP update failed (Non-critical)");
      }
    }
  },

  verifyUserOtp: async (mobile: string, otp: string): Promise<boolean> => {
    if (supabase) {
      try {
        const { data } = await supabase
          .from('users')
          .select('otp_code')
          .eq('mobile', mobile)
          .maybeSingle();
        
        if (data && data.otp_code && String(data.otp_code) === String(otp)) {
          return true;
        }
      } catch (e) {
        return false;
      }
    }
    return false;
  },

  // Complaint Operations (Hybrid)
  getComplaintsByUserId: async (userId: string): Promise<Complaint[]> => {
    let cloudData: Complaint[] = [];
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('complaints')
          .select('*')
          .or(`userId.eq.${userId},user_id.eq.${userId}`)
          .order('date', { ascending: false });
        
        if (data) cloudData = data as Complaint[];
        if (error) console.warn('[Supabase] Fetch complaints error:', error.message);
      } catch (e) { console.warn(e); }
    }
    
    // If cloud has data, prefer it. Otherwise, use local.
    if (cloudData.length > 0) return cloudData;

    const complaints = getLocal<Complaint>('agrifair_complaints');
    return complaints.filter(c => c.userId === userId);
  },

  createComplaint: async (complaint: Partial<Complaint>): Promise<void> => {
    if (supabase) {
      try {
        await supabase.from('complaints').insert([complaint]);
      } catch (e) { console.warn('[Supabase] Create complaint failed:', e); }
    }
    
    // Always backup locally
    const complaints = getLocal<Complaint>('agrifair_complaints');
    const newComplaint = { ...complaint, id: generateId() } as Complaint;
    complaints.push(newComplaint);
    setLocal('agrifair_complaints', complaints);
  },

  // Featured Farmer Operations (Hybrid)
  getAllFeaturedFarmers: async (): Promise<FeaturedFarmer[]> => {
    let cloudData: FeaturedFarmer[] = [];
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('featured_farmers')
          .select('*')
          .order('date', { ascending: false });

        if (data) {
           cloudData = data.map(item => ({
            id: item.id,
            userId: item.userId || item.user_id,
            name: item.name,
            bio: item.bio,
            photo: item.photo,
            date: item.date
          })) as FeaturedFarmer[];
        }
      } catch (e) { console.warn(e); }
    }

    if (cloudData.length > 0) return cloudData;

    return getLocal<FeaturedFarmer>('agrifair_featured');
  },

  upsertFeaturedFarmer: async (farmer: FeaturedFarmer): Promise<void> => {
    if (supabase) {
      try {
        const payload = { ...farmer, user_id: farmer.userId };
        await supabase.from('featured_farmers').upsert(payload);
      } catch (e) { console.warn('[Supabase] Upsert failed:', e); }
    }
    
    const farmers = getLocal<FeaturedFarmer>('agrifair_featured');
    const index = farmers.findIndex(f => f.userId === farmer.userId);
    if (index > -1) farmers[index] = farmer;
    else farmers.push(farmer);
    setLocal('agrifair_featured', farmers);
  },

  deleteFeaturedFarmer: async (identifier: string): Promise<void> => {
    if (supabase) {
      try {
        await supabase
          .from('featured_farmers')
          .delete()
          .or(`id.eq.${identifier},userId.eq.${identifier},user_id.eq.${identifier}`);
      } catch (e) { console.warn('[Supabase] Delete failed:', e); }
    } 
    
    const farmers = getLocal<FeaturedFarmer>('agrifair_featured');
    const filtered = farmers.filter(f => f.userId !== identifier && f.id !== identifier);
    setLocal('agrifair_featured', filtered);
  }
};
