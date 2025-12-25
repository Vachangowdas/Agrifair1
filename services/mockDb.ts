
import { User, Complaint, FeaturedFarmer } from '../types';
import { supabase } from './supabaseClient';

// --- Local Storage Helpers ---
const getLocal = <T>(key: string): T[] => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

const setLocal = <T>(key: string, data: T[]) => localStorage.setItem(key, JSON.stringify(data));
const generateId = () => Math.random().toString(36).substring(2, 15);

// --- Advanced Mapping (Handles Schema Variations) ---
const mapUserToDb = (u: Partial<User>) => {
  const payload: any = {
    username: u.username,
    mobile: u.mobile,
  };
  // Explicitly include ID to ensure spotlight associations work immediately after signup
  if (u.id) payload.id = u.id;
  if (u.role) payload.role = u.role;
  return payload;
};

const mapComplaintToDb = (c: Partial<Complaint>) => ({
  user_id: c.userId,
  trader_name: c.traderName,
  issue: c.issue,
  date: c.date,
  status: c.status || 'Pending'
});

const mapDbToComplaint = (item: any): Complaint => ({
  id: item.id,
  userId: item.user_id || item.userId,
  traderName: item.trader_name || item.traderName,
  issue: item.issue,
  date: item.date,
  status: item.status
});

export const DatabaseService = {
  // --- Connection Check ---
  testConnection: async () => {
    if (!supabase) return false;
    try {
      const { error } = await supabase.from('users').select('count', { count: 'exact', head: true });
      return !error;
    } catch (e) {
      return false;
    }
  },

  // --- User Operations ---
  findUserByMobile: async (mobile: string): Promise<User | undefined> => {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('mobile', mobile)
          .maybeSingle();
        
        if (error) {
          console.error('[Supabase Error] findUserByMobile:', error.message, error.details);
        } else if (data) {
          return data as User;
        }
      } catch (e) {
        console.error('[Supabase Exception] findUserByMobile:', e);
      }
    }
    return getLocal<User>('agrifair_users').find(u => u.mobile === mobile);
  },

  createUser: async (user: Partial<User>): Promise<void> => {
    if (supabase) {
      try {
        const payload = mapUserToDb(user);
        const { error } = await supabase.from('users').insert([payload]);
        if (error) {
          console.error('[Supabase Error] createUser:', error.message, error.hint);
        }
      } catch (e: any) {
        console.warn('[Supabase Sync Failed] Falling back to local storage.');
      }
    } 

    const users = getLocal<User>('agrifair_users');
    if (!users.find(u => u.mobile === user.mobile)) {
      users.push({ ...user, id: user.id || generateId() } as User);
      setLocal('agrifair_users', users);
    }
  },

  setUserOtp: async (mobile: string, otp: string): Promise<void> => {
    if (supabase) {
      try {
        const { error } = await supabase
          .from('users')
          .update({ otp_code: otp })
          .eq('mobile', mobile);
        if (error) console.error('[Supabase Error] setUserOtp:', error.message);
      } catch (e) {}
    }
  },

  verifyUserOtp: async (mobile: string, otp: string): Promise<boolean> => {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('otp_code')
          .eq('mobile', mobile)
          .maybeSingle();
        
        if (error) return false;
        return data && String(data.otp_code) === String(otp);
      } catch (e) { return false; }
    }
    return false;
  },

  // --- Complaint Operations ---
  getComplaintsByUserId: async (userId: string): Promise<Complaint[]> => {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('complaints')
          .select('*')
          .or(`user_id.eq.${userId},userId.eq.${userId}`)
          .order('date', { ascending: false });
        
        if (error) {
          console.error('[Supabase Error] getComplaints:', error.message);
        } else if (data) {
          return data.map(mapDbToComplaint);
        }
      } catch (e) {}
    }
    return getLocal<Complaint>('agrifair_complaints').filter(c => String(c.userId) === String(userId));
  },

  createComplaint: async (complaint: Partial<Complaint>): Promise<void> => {
    if (supabase) {
      try {
        const payload = mapComplaintToDb(complaint);
        const { error } = await supabase.from('complaints').insert([payload]);
        if (error) console.error('[Supabase Error] createComplaint:', error.message);
      } catch (e) {}
    }
    const complaints = getLocal<Complaint>('agrifair_complaints');
    complaints.push({ ...complaint, id: generateId() } as Complaint);
    setLocal('agrifair_complaints', complaints);
  },

  // --- Featured Farmer Operations ---
  getAllFeaturedFarmers: async (): Promise<FeaturedFarmer[]> => {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('featured_farmers')
          .select('*')
          .order('date', { ascending: false });

        if (!error && data) {
          return data.map(item => ({
            id: item.id,
            userId: String(item.user_id || item.userId),
            name: item.name,
            bio: item.bio,
            photo: item.photo,
            date: item.date
          }));
        }
      } catch (e) {}
    }
    return getLocal<FeaturedFarmer>('agrifair_featured');
  },

  upsertFeaturedFarmer: async (farmer: FeaturedFarmer): Promise<void> => {
    if (supabase) {
      try {
        const payload = {
          user_id: farmer.userId,
          name: farmer.name,
          bio: farmer.bio,
          photo: farmer.photo,
          date: farmer.date
        };
        
        // Try snake_case first (standard)
        const { error } = await supabase
          .from('featured_farmers')
          .upsert(payload, { onConflict: 'user_id' });
          
        if (error) {
          // Fallback to camelCase if that's how the table was built
          const fallback = { userId: farmer.userId, name: farmer.name, bio: farmer.bio, photo: farmer.photo, date: farmer.date };
          await supabase.from('featured_farmers').upsert(fallback, { onConflict: 'userId' });
        }
      } catch (e) {}
    }
    
    const farmers = getLocal<FeaturedFarmer>('agrifair_featured');
    const index = farmers.findIndex(f => String(f.userId) === String(farmer.userId));
    if (index > -1) farmers[index] = farmer;
    else farmers.push(farmer);
    setLocal('agrifair_featured', farmers);
  },

  deleteFeaturedFarmer: async (userId: string): Promise<void> => {
    const targetId = String(userId);
    
    if (supabase) {
      try {
        // Try deleting by user_id
        const { error: err1 } = await supabase
          .from('featured_farmers')
          .delete()
          .eq('user_id', targetId);
        
        // If that failed or found nothing, try camelCase userId
        if (err1) {
          await supabase
            .from('featured_farmers')
            .delete()
            .eq('userId', targetId);
        }
      } catch (e) {
        console.error('[Supabase Delete Exception]', e);
      }
    } 
    
    // Crucial: Update local storage using string comparison to handle mixed types
    const farmers = getLocal<FeaturedFarmer>('agrifair_featured');
    const filtered = farmers.filter(f => String(f.userId) !== targetId);
    setLocal('agrifair_featured', filtered);
  }
};
