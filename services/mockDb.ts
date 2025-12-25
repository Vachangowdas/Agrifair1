
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
  // Ensure ID is passed as string to DB
  if (u.id) payload.id = String(u.id);
  if (u.role) payload.role = u.role;
  return payload;
};

const mapComplaintToDb = (c: Partial<Complaint>) => ({
  user_id: String(c.userId),
  trader_name: c.traderName,
  issue: c.issue,
  date: c.date,
  status: c.status || 'Pending'
});

const mapDbToComplaint = (item: any): Complaint => ({
  id: String(item.id),
  userId: String(item.user_id || item.userId),
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
        
        if (!error && data) {
          return { ...data, id: String(data.id) } as User;
        }
      } catch (e) {}
    }
    const local = getLocal<User>('agrifair_users').find(u => u.mobile === mobile);
    return local ? { ...local, id: String(local.id) } : undefined;
  },

  createUser: async (user: Partial<User>): Promise<void> => {
    // Crucial: Use the provided ID or generate one immediately
    const finalId = String(user.id || generateId());
    const userData = { ...user, id: finalId };

    if (supabase) {
      try {
        const payload = mapUserToDb(userData);
        await supabase.from('users').insert([payload]);
      } catch (e) {}
    } 

    const users = getLocal<User>('agrifair_users');
    if (!users.find(u => u.mobile === user.mobile)) {
      users.push(userData as User);
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
        const { data, error } = await supabase
          .from('users')
          .select('otp_code')
          .eq('mobile', mobile)
          .maybeSingle();
        return !error && data && String(data.otp_code) === String(otp);
      } catch (e) { return false; }
    }
    return false;
  },

  // --- Complaint Operations ---
  getComplaintsByUserId: async (userId: string): Promise<Complaint[]> => {
    const sUserId = String(userId);
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('complaints')
          .select('*')
          .or(`user_id.eq.${sUserId},userId.eq.${sUserId}`)
          .order('date', { ascending: false });
        if (!error && data) return data.map(mapDbToComplaint);
      } catch (e) {}
    }
    return getLocal<Complaint>('agrifair_complaints')
      .filter(c => String(c.userId) === sUserId);
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

        if (!error && data) {
          return data.map(item => ({
            id: String(item.id),
            userId: String(item.user_id || item.userId),
            name: item.name,
            bio: item.bio,
            photo: item.photo,
            date: item.date
          }));
        }
      } catch (e) {}
    }
    return getLocal<FeaturedFarmer>('agrifair_featured').map(f => ({ ...f, userId: String(f.userId) }));
  },

  upsertFeaturedFarmer: async (farmer: FeaturedFarmer): Promise<void> => {
    const sUserId = String(farmer.userId);
    if (supabase) {
      try {
        const payload = {
          user_id: sUserId,
          name: farmer.name,
          bio: farmer.bio,
          photo: farmer.photo,
          date: farmer.date
        };
        const { error } = await supabase.from('featured_farmers').upsert(payload, { onConflict: 'user_id' });
        if (error) {
          const fallback = { userId: sUserId, name: farmer.name, bio: farmer.bio, photo: farmer.photo, date: farmer.date };
          await supabase.from('featured_farmers').upsert(fallback, { onConflict: 'userId' });
        }
      } catch (e) {}
    }
    
    const farmers = getLocal<FeaturedFarmer>('agrifair_featured');
    const index = farmers.findIndex(f => String(f.userId) === sUserId);
    if (index > -1) farmers[index] = { ...farmer, userId: sUserId };
    else farmers.push({ ...farmer, userId: sUserId });
    setLocal('agrifair_featured', farmers);
  },

  deleteFeaturedFarmer: async (userId: string): Promise<void> => {
    const targetId = String(userId);
    if (supabase) {
      try {
        await supabase.from('featured_farmers').delete().eq('user_id', targetId);
        await supabase.from('featured_farmers').delete().eq('userId', targetId);
      } catch (e) {}
    } 
    const farmers = getLocal<FeaturedFarmer>('agrifair_featured');
    const filtered = farmers.filter(f => String(f.userId) !== targetId);
    setLocal('agrifair_featured', filtered);
  }
};
