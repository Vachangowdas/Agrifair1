
import { User, Complaint, FeaturedFarmer } from '../types';
import { supabase } from './supabaseClient';

// --- Local Storage Fallbacks ---
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

// --- Mapper Helpers ---
const mapDbToUser = (data: any): User => ({
  id: String(data.id),
  username: data.username,
  mobile: data.mobile,
  role: data.role
});

// --- Individual Function Exports (Fixed naming for stability) ---

const testConnection = async () => {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('users').select('count', { count: 'exact', head: true });
    return !error;
  } catch (e) {
    return false;
  }
};

const findUserByMobile = async (mobile: string): Promise<User | undefined> => {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('mobile', mobile)
        .maybeSingle();
      if (!error && data) return mapDbToUser(data);
    } catch (e) {
      console.error("Supabase find error:", e);
    }
  }
  const local = getLocal<User>('agrifair_users').find(u => u.mobile === mobile);
  return local ? { ...local, id: String(local.id) } : undefined;
};

const createUser = async (user: Partial<User>): Promise<User> => {
  let finalUser: User = { 
    id: user.id || generateId(), 
    username: user.username || '', 
    mobile: user.mobile || '', 
    role: user.role || 'user' 
  };

  if (supabase) {
    try {
      const payload = {
        username: user.username,
        mobile: user.mobile,
        role: user.role || 'user'
      };
      
      const { data, error } = await supabase
        .from('users')
        .insert([payload])
        .select()
        .single();
      
      if (!error && data) {
        finalUser = mapDbToUser(data);
      } else if (error) {
        console.warn("Supabase creation failed, checking if user exists:", error);
        const existing = await findUserByMobile(user.mobile!);
        if (existing) finalUser = existing;
      }
    } catch (e) {
      console.error("Supabase creation exception:", e);
    }
  } 

  const users = getLocal<User>('agrifair_users');
  if (!users.find(u => u.mobile === finalUser.mobile)) {
    users.push(finalUser);
    setLocal('agrifair_users', users);
  }
  return finalUser;
};

const setUserOtp = async (mobile: string, otp: string): Promise<void> => {
  if (supabase) {
    try {
      await supabase.from('users').update({ otp_code: otp }).eq('mobile', mobile);
    } catch (e) {}
  }
};

const verifyUserOtp = async (mobile: string, otp: string): Promise<boolean> => {
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
};

const getComplaintsByUserId = async (userId: string): Promise<Complaint[]> => {
  const sId = String(userId);
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('complaints')
        .select('*')
        .or(`user_id.eq.${sId},userId.eq.${sId}`)
        .order('date', { ascending: false });
      if (!error && data) return data.map((item: any) => ({
        id: String(item.id),
        userId: String(item.user_id || item.userId),
        traderName: item.trader_name || item.traderName,
        issue: item.issue,
        date: item.date,
        status: item.status
      }));
    } catch (e) {}
  }
  return getLocal<Complaint>('agrifair_complaints').filter(c => String(c.userId) === sId);
};

const createComplaint = async (complaint: Partial<Complaint>): Promise<void> => {
  if (supabase) {
    try {
      const payload = {
        user_id: String(complaint.userId),
        trader_name: complaint.traderName,
        issue: complaint.issue,
        date: complaint.date,
        status: complaint.status || 'Pending'
      };
      await supabase.from('complaints').insert([payload]);
    } catch (e) {}
  }
  const complaints = getLocal<Complaint>('agrifair_complaints');
  complaints.push({ ...complaint, id: generateId() } as Complaint);
  setLocal('agrifair_complaints', complaints);
};

const getAllFeaturedFarmers = async (): Promise<FeaturedFarmer[]> => {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('featured_farmers')
        .select('*')
        .order('date', { ascending: false });

      if (!error && data) {
        return data.map((item: any) => ({
          id: String(item.id),
          userId: String(item.user_id || item.userId),
          name: item.name,
          bio: item.bio,
          photo: item.photo,
          date: item.date
        }));
      } else if (error) {
        console.error("Supabase fetch farmers error:", error);
      }
    } catch (e) {
      console.error("Cloud fetch exception:", e);
    }
  }
  return getLocal<FeaturedFarmer>('agrifair_featured').map(f => ({ ...f, userId: String(f.userId) }));
};

const upsertFeaturedFarmer = async (farmer: FeaturedFarmer): Promise<void> => {
  const sUserId = String(farmer.userId);
  
  if (supabase) {
    try {
      const { data: userRecord } = await supabase.from('users').select('id').eq('id', sUserId).maybeSingle();
      
      if (userRecord) {
        const payload = {
          user_id: sUserId,
          name: farmer.name,
          bio: farmer.bio,
          photo: farmer.photo,
          date: farmer.date
        };
        
        const { error } = await supabase.from('featured_farmers').upsert(payload, { onConflict: 'user_id' });
        if (error) {
           console.error("Upsert failed, trying alternative column names:", error);
           await supabase.from('featured_farmers').upsert({
             userId: sUserId,
             name: farmer.name,
             bio: farmer.bio,
             photo: farmer.photo,
             date: farmer.date
           }, { onConflict: 'userId' });
        }
      }
    } catch (e) {
      console.error("Supabase Spotlight Error:", e);
    }
  }
  
  const farmers = getLocal<FeaturedFarmer>('agrifair_featured');
  const index = farmers.findIndex(f => String(f.userId) === sUserId);
  if (index > -1) farmers[index] = { ...farmer, userId: sUserId };
  else farmers.push({ ...farmer, userId: sUserId });
  setLocal('agrifair_featured', farmers);
};

const deleteFeaturedFarmer = async (userId: string): Promise<void> => {
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
};

// --- Service Object Export ---
export const DatabaseService = {
  testConnection,
  findUserByMobile,
  createUser,
  setUserOtp,
  verifyUserOtp,
  getComplaintsByUserId,
  createComplaint,
  getAllFeaturedFarmers,
  upsertFeaturedFarmer,
  deleteFeaturedFarmer
};
