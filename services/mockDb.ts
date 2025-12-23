
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
        
        if (!error && data) return data as User;
        if (error) console.warn('[Supabase] Find user error:', error.message);
      } catch (e) {
        console.warn('[Supabase] Connection failed, checking local:', e);
      }
    }
    
    // Priority 2: Fallback to Local Storage
    const users = getLocal<User>('agrifair_users');
    return users.find(u => u.mobile === mobile);
  },

  createUser: async (user: Partial<User>): Promise<void> => {
    // Attempt Cloud Creation
    if (supabase) {
      try {
        const { error } = await supabase
          .from('users')
          .insert([user]);
        
        if (error) {
          console.error('[Supabase] Create user failed:', error.message);
        }
      } catch (e) {
        console.error('[Supabase] Exception during create:', e);
      }
    } 

    // Always ensure data exists in Local Storage as a fail-safe backup
    const users = getLocal<User>('agrifair_users');
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
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('complaints')
          .select('*')
          // Check both standard snake_case and camelCase to be safe
          .or(`userId.eq.${userId},user_id.eq.${userId}`)
          .order('date', { ascending: false });
        
        if (!error && data) {
           // Map response back to App Type
           return data.map((item: any) => ({
             id: item.id,
             userId: item.userId || item.user_id,
             traderName: item.traderName || item.trader_name,
             issue: item.issue,
             date: item.date,
             status: item.status
           })) as Complaint[];
        }
      } catch (e) { console.warn(e); }
    }
    
    // Fallback only if Supabase is not configured or errored
    const complaints = getLocal<Complaint>('agrifair_complaints');
    return complaints.filter(c => c.userId === userId);
  },

  createComplaint: async (complaint: Partial<Complaint>): Promise<void> => {
    if (supabase) {
      try {
        // Prepare payload: Map to snake_case and remove camelCase keys to avoid "Column not found"
        const payload = {
          user_id: complaint.userId,
          trader_name: complaint.traderName,
          issue: complaint.issue,
          date: complaint.date,
          status: complaint.status
        };

        const { error } = await supabase.from('complaints').insert([payload]);
        if (error) console.error('[Supabase] Create complaint failed:', error.message);
      } catch (e) { console.warn('[Supabase] Create complaint exception:', e); }
    }
    
    // Backup locally
    const complaints = getLocal<Complaint>('agrifair_complaints');
    const newComplaint = { ...complaint, id: generateId() } as Complaint;
    complaints.push(newComplaint);
    setLocal('agrifair_complaints', complaints);
  },

  // Featured Farmer Operations (Hybrid)
  getAllFeaturedFarmers: async (): Promise<FeaturedFarmer[]> => {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('featured_farmers')
          .select('*')
          .order('date', { ascending: false });

        if (!error && data) {
           // Map DB columns to App Type
           return data.map(item => ({
            id: item.id,
            userId: item.userId || item.user_id,
            name: item.name,
            bio: item.bio,
            photo: item.photo,
            date: item.date
          })) as FeaturedFarmer[];
        } else if (error) {
           console.warn('[Supabase] Fetch farmers failed:', error.message);
        }
      } catch (e) { console.warn(e); }
    }

    // Only fetch local if Supabase is down or not configured
    // If Supabase returned [] (empty list) successfully, we returned above.
    return getLocal<FeaturedFarmer>('agrifair_featured');
  },

  upsertFeaturedFarmer: async (farmer: FeaturedFarmer): Promise<void> => {
    if (supabase) {
      try {
        // Clean Payload: Use snake_case for DB, remove camelCase 'userId'
        const payload = {
          user_id: farmer.userId,
          name: farmer.name,
          bio: farmer.bio,
          photo: farmer.photo,
          date: farmer.date,
          // Only include ID if it exists (for updates)
          ...(farmer.id ? { id: farmer.id } : {})
        };
        
        const { error } = await supabase.from('featured_farmers').upsert(payload);
        if (error) console.error('[Supabase] Upsert failed:', error.message);
        
      } catch (e) { console.warn('[Supabase] Upsert exception:', e); }
    }
    
    // Local Backup
    const farmers = getLocal<FeaturedFarmer>('agrifair_featured');
    const index = farmers.findIndex(f => f.userId === farmer.userId);
    if (index > -1) farmers[index] = farmer;
    else farmers.push(farmer);
    setLocal('agrifair_featured', farmers);
  },

  deleteFeaturedFarmer: async (identifier: string): Promise<void> => {
    if (supabase) {
      try {
        const { error } = await supabase
          .from('featured_farmers')
          .delete()
          .or(`id.eq.${identifier},userId.eq.${identifier},user_id.eq.${identifier}`);
          
        if (error) console.error('[Supabase] Delete failed:', error.message);
      } catch (e) { console.warn('[Supabase] Delete exception:', e); }
    } 
    
    const farmers = getLocal<FeaturedFarmer>('agrifair_featured');
    const filtered = farmers.filter(f => f.userId !== identifier && f.id !== identifier);
    setLocal('agrifair_featured', filtered);
  }
};
