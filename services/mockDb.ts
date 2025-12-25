
import { User, Complaint, FeaturedFarmer } from '../types';
import { supabase } from './supabaseClient';

const getLocal = <T>(key: string): T[] => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (e) { return []; }
};

const setLocal = <T>(key: string, data: T[]) => localStorage.setItem(key, JSON.stringify(data));

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const isUuid = (str: string | undefined): str is string => {
  if (!str) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

const mapDbToUser = (data: any): User => ({
  id: String(data.id),
  username: data.username,
  mobile: data.mobile,
  role: data.role
});

const findUserByMobile = async (mobile: string): Promise<User | undefined> => {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('mobile', mobile)
        .maybeSingle();
      if (error) console.error("[Supabase Error] findUserByMobile:", error.message);
      if (data) return mapDbToUser(data);
    } catch (e) { console.error("[Sync Error]", e); }
  }
  return getLocal<User>('agrifair_users').find(u => u.mobile === mobile);
};

const createUser = async (user: Partial<User>): Promise<User> => {
  if (supabase) {
    try {
      const payload = {
        username: user.username,
        mobile: user.mobile,
        role: user.role || 'user'
      };
      
      const { data, error } = await supabase
        .from('users')
        .upsert(payload, { onConflict: 'mobile' })
        .select()
        .single();
      
      if (!error && data) {
        console.log("[AgriFair] User synced to Supabase:", data.id);
        return mapDbToUser(data);
      }
      if (error) console.error("[Supabase Error] createUser:", error.message);
    } catch (e) { console.error("[Sync Error]", e); }
  } 

  const finalUser: User = { 
    id: generateId(), 
    username: user.username || '', 
    mobile: user.mobile || '', 
    role: user.role || 'user' 
  };
  const users = getLocal<User>('agrifair_users');
  users.push(finalUser);
  setLocal('agrifair_users', users);
  return finalUser;
};

const setUserOtp = async (mobile: string, otp: string, username?: string): Promise<void> => {
  if (supabase) {
    try {
      const payload: any = { mobile, otp_code: otp };
      if (username) payload.username = username;
      const { error } = await supabase.from('users').upsert(payload, { onConflict: 'mobile' });
      if (error) console.error("[Supabase Error] setUserOtp:", error.message);
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
      if (error) return false;
      return data && String(data.otp_code) === String(otp);
    } catch (e) { return false; }
  }
  return false;
};

const getComplaintsByUserId = async (userId: string): Promise<Complaint[]> => {
  if (supabase && isUuid(userId)) {
    try {
      const { data, error } = await supabase
        .from('complaints')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (!error && data) return data.map(item => ({
        id: String(item.id),
        userId: String(item.user_id),
        traderName: item.trader_name,
        issue: item.issue,
        date: item.date,
        status: item.status
      }));
    } catch (e) {}
  }
  return getLocal<Complaint>('agrifair_complaints').filter(c => String(c.userId) === userId);
};

const createComplaint = async (complaint: Partial<Complaint>): Promise<void> => {
  let synced = false;
  if (supabase && isUuid(complaint.userId)) {
    try {
      const payload = {
        user_id: complaint.userId,
        trader_name: complaint.traderName,
        issue: complaint.issue,
        date: complaint.date,
        status: complaint.status || 'Pending'
      };
      const { error } = await supabase.from('complaints').insert([payload]);
      if (!error) synced = true;
      else console.error("[Supabase Error] createComplaint:", error.message);
    } catch (e) {}
  }
  
  if (!synced) {
    const complaints = getLocal<Complaint>('agrifair_complaints');
    complaints.push({ ...complaint, id: generateId() } as Complaint);
    setLocal('agrifair_complaints', complaints);
  }
};

const getAllFeaturedFarmers = async (): Promise<FeaturedFarmer[]> => {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('featured_farmers')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) return data.map(item => ({
        id: String(item.id),
        userId: String(item.user_id),
        name: item.name,
        bio: item.bio,
        photo: item.photo,
        date: item.date
      }));
    } catch (e) {}
  }
  return getLocal<FeaturedFarmer>('agrifair_featured');
};

const upsertFeaturedFarmer = async (farmer: FeaturedFarmer, userMobile?: string): Promise<string | null> => {
  if (supabase) {
    try {
      let finalUserId = farmer.userId;
      if (!isUuid(finalUserId) && userMobile) {
        const user = await findUserByMobile(userMobile);
        if (user && isUuid(user.id)) finalUserId = user.id;
      }

      if (isUuid(finalUserId)) {
        const payload = {
          user_id: finalUserId,
          name: farmer.name,
          bio: farmer.bio,
          photo: farmer.photo,
          date: farmer.date
        };
        const { error } = await supabase.from('featured_farmers').upsert(payload, { onConflict: 'user_id' });
        if (!error) return finalUserId;
        console.error("[Supabase Error] upsertFeaturedFarmer:", error.message);
      }
    } catch (e) {}
  }
  
  const farmers = getLocal<FeaturedFarmer>('agrifair_featured');
  const index = farmers.findIndex(f => f.userId === farmer.userId);
  if (index > -1) farmers[index] = farmer;
  else farmers.push(farmer);
  setLocal('agrifair_featured', farmers);
  return null;
};

const deleteFeaturedFarmer = async (userId: string): Promise<void> => {
  if (supabase && isUuid(userId)) {
    try {
      await supabase.from('featured_farmers').delete().eq('user_id', userId);
    } catch (e) {}
  } 
  const farmers = getLocal<FeaturedFarmer>('agrifair_featured');
  setLocal('agrifair_featured', farmers.filter(f => f.userId !== userId));
};

export const DatabaseService = {
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
