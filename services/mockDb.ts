
import { User, Complaint, FeaturedFarmer } from '../types';
import { supabase } from './supabaseClient';

// --- Local Storage Helpers (Fallback Layer) ---
const getLocal = <T>(key: string): T[] => {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch (e) {
    return [];
  }
};

const setLocal = <T>(key: string, data: T[]) => localStorage.setItem(key, JSON.stringify(data));
const generateId = () => Math.random().toString(36).substring(2, 15);

// --- Attribute Mapping (Ensures Supabase Compatibility) ---
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
  photo: f.photo, // Base64 string
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
        if (error) console.error('[Supabase] findUser error:', error.message);
      } catch (e) {
        console.warn('[Supabase] Search failed, falling back to local storage.');
      }
    }
    return getLocal<User>('agrifair_users').find(u => u.mobile === mobile);
  },

  createUser: async (user: Partial<User>): Promise<void> => {
    if (supabase) {
      try {
        const payload = mapUserToDb(user);
        const { error } = await supabase.from('users').insert([payload]);
        if (error) console.error('[Supabase] createUser error:', error.message);
      } catch (e) {
        console.error('[Supabase] Network error during createUser');
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
        if (error) console.error('[Supabase] getComplaints error:', error.message);
      } catch (e) {}
    }
    return getLocal<Complaint>('agrifair_complaints').filter(c => c.userId === userId);
  },

  createComplaint: async (complaint: Partial<Complaint>): Promise<void> => {
    if (supabase) {
      try {
        const payload = mapComplaintToDb(complaint);
        const { error } = await supabase.from('complaints').insert([payload]);
        if (error) console.error('[Supabase] createComplaint error:', error.message);
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
        if (error) console.error('[Supabase] getAllFarmers error:', error.message);
      } catch (e) {}
    }
    return getLocal<FeaturedFarmer>('agrifair_featured');
  },

  upsertFeaturedFarmer: async (farmer: FeaturedFarmer): Promise<void> => {
    if (supabase) {
      try {
        const payload = mapFarmerToDb(farmer);
        
        // Use user_id as the conflict key to ensure one farmer profile per account
        const { error } = await supabase
          .from('featured_farmers')
          .upsert(payload, { onConflict: 'user_id' });
          
        if (error) {
          console.error('[Supabase] upsertFarmer failed:', error.message);
          // If upsert fails because column names are wrong, try alternative mapping
          const fallbackPayload = { userId: farmer.userId, name: farmer.name, bio: farmer.bio, photo: farmer.photo, date: farmer.date };
          await supabase.from('featured_farmers').upsert(fallbackPayload, { onConflict: 'userId' });
        }
      } catch (e) {
        console.error('[Supabase] Exception in upsertFarmer');
      }
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
