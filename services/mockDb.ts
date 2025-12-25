
import { User, Complaint, FeaturedFarmer } from '../types';
import { supabase } from './supabaseClient';

// --- Local Storage Helpers ---
const getLocal = <T>(key: string): T[] => {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch (e) {
    return [];
  }
};

const setLocal = <T>(key: string, data: T[]) => localStorage.setItem(key, JSON.stringify(data));
const generateId = () => Math.random().toString(36).substring(2, 15);

// --- Mapping Layer (Critical for Supabase Sync) ---
const mapUserToDb = (u: Partial<User>) => ({
  username: u.username,
  mobile: u.mobile,
  role: u.role || 'user'
});

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

const mapFarmerToDb = (f: FeaturedFarmer) => ({
  user_id: f.userId,
  name: f.name,
  bio: f.bio,
  photo: f.photo,
  date: f.date
});

const mapDbToFarmer = (item: any): FeaturedFarmer => ({
  id: item.id,
  userId: item.user_id || item.userId,
  name: item.name,
  bio: item.bio,
  photo: item.photo,
  date: item.date
});

export const DatabaseService = {
  // --- User Operations ---
  findUserByMobile: async (mobile: string): Promise<User | undefined> => {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('mobile', mobile)
          .maybeSingle();
        
        if (!error && data) return data as User;
        if (error) console.warn('[Supabase] Search failed:', error.message);
      } catch (e) {
        console.warn('[Supabase] Connection error');
      }
    }
    return getLocal<User>('agrifair_users').find(u => u.mobile === mobile);
  },

  createUser: async (user: Partial<User>): Promise<void> => {
    let cloudSuccess = false;
    if (supabase) {
      try {
        const payload = mapUserToDb(user);
        const { error } = await supabase.from('users').insert([payload]);
        if (error) throw error;
        cloudSuccess = true;
      } catch (e: any) {
        console.error('[Supabase] Cloud user creation failed:', e.message);
        throw new Error("Cloud synchronization failed. Please check your Supabase setup.");
      }
    } 

    // Always mirror to local storage for speed
    const users = getLocal<User>('agrifair_users');
    if (!users.find(u => u.mobile === user.mobile)) {
      users.push({ ...user, id: user.id || generateId() } as User);
      setLocal('agrifair_users', users);
    }
  },

  setUserOtp: async (mobile: string, otp: string): Promise<void> => {
    if (supabase) {
      try {
        await supabase.from('users').update({ otp_code: otp }).eq('mobile', mobile);
      } catch (e) {}
    }
  },

  verifyUserOtp: async (mobile: string, otp: string): Promise<boolean> => {
    if (supabase) {
      try {
        const { data } = await supabase.from('users').select('otp_code').eq('mobile', mobile).maybeSingle();
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
        
        if (!error && data) return data.map(mapDbToComplaint);
      } catch (e) {}
    }
    return getLocal<Complaint>('agrifair_complaints').filter(c => c.userId === userId);
  },

  createComplaint: async (complaint: Partial<Complaint>): Promise<void> => {
    if (supabase) {
      try {
        const payload = mapComplaintToDb(complaint);
        await supabase.from('complaints').insert([payload]);
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

        if (!error && data) return data.map(mapDbToFarmer);
      } catch (e) {}
    }
    return getLocal<FeaturedFarmer>('agrifair_featured');
  },

  upsertFeaturedFarmer: async (farmer: FeaturedFarmer): Promise<void> => {
    if (supabase) {
      try {
        const payload = mapFarmerToDb(farmer);
        const { error } = await supabase
          .from('featured_farmers')
          .upsert(payload, { onConflict: 'user_id' });
          
        if (error) {
          // Fallback if schema doesn't match snake_case
          const fallback = { userId: farmer.userId, name: farmer.name, bio: farmer.bio, photo: farmer.photo, date: farmer.date };
          await supabase.from('featured_farmers').upsert(fallback, { onConflict: 'userId' });
        }
      } catch (e) {}
    }
    
    const farmers = getLocal<FeaturedFarmer>('agrifair_featured');
    const index = farmers.findIndex(f => f.userId === farmer.userId);
    if (index > -1) farmers[index] = farmer;
    else farmers.push(farmer);
    setLocal('agrifair_featured', farmers);
  },

  deleteFeaturedFarmer: async (userId: string): Promise<void> => {
    if (supabase) {
      try {
        await supabase.from('featured_farmers').delete().or(`user_id.eq.${userId},userId.eq.${userId}`);
      } catch (e) {}
    } 
    const farmers = getLocal<FeaturedFarmer>('agrifair_featured');
    setLocal('agrifair_featured', farmers.filter(f => f.userId !== userId));
  }
};
