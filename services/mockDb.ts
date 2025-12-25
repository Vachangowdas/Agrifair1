
import { User, Complaint, FeaturedFarmer } from '../types';
import { supabase } from './supabaseClient';

const getLocal = <T>(key: string): T[] => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

const setLocal = <T>(key: string, data: T[]) => localStorage.setItem(key, JSON.stringify(data));

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
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
      if (!error && data) return mapDbToUser(data);
    } catch (e) {}
  }
  const local = getLocal<User>('agrifair_users').find(u => u.mobile === mobile);
  return local ? { ...local, id: String(local.id) } : undefined;
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
      
      if (!error && data) return mapDbToUser(data);
      
      // Fallback: If upsert failed but user exists, just get them
      const existing = await findUserByMobile(user.mobile!);
      if (existing) return existing;
    } catch (e) {
      console.warn("[AgriFair] Cloud user creation failed:", e);
    }
  } 

  const finalUser: User = { 
    id: generateId(), 
    username: user.username || '', 
    mobile: user.mobile || '', 
    role: user.role || 'user' 
  };
  const users = getLocal<User>('agrifair_users');
  const existingIdx = users.findIndex(u => u.mobile === user.mobile);
  if (existingIdx > -1) users[existingIdx] = finalUser;
  else users.push(finalUser);
  
  setLocal('agrifair_users', users);
  return finalUser;
};

/**
 * Capture user details early during OTP request for better sync
 */
const setUserOtp = async (mobile: string, otp: string, username?: string): Promise<void> => {
  if (supabase) {
    try {
      const payload: any = { mobile, otp_code: otp };
      if (username) payload.username = username;

      // Upsert ensures that even if it's a new registration, we capture the data
      await supabase
        .from('users')
        .upsert(payload, { onConflict: 'mobile' });
    } catch (e) {
      console.warn("[AgriFair] OTP Sync failed:", e);
    }
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
  if (supabase && isUuid(sId)) {
    try {
      const { data, error } = await supabase
        .from('complaints')
        .select('*')
        .eq('user_id', sId)
        .order('date', { ascending: false });
      if (!error && data) return data.map((item: any) => ({
        id: String(item.id),
        userId: String(item.user_id),
        traderName: item.trader_name,
        issue: item.issue,
        date: item.date,
        status: item.status
      }));
    } catch (e) {}
  }
  return getLocal<Complaint>('agrifair_complaints').filter(c => String(c.userId) === sId);
};

const createComplaint = async (complaint: Partial<Complaint>): Promise<void> => {
  if (supabase && isUuid(complaint.userId)) {
    try {
      const payload = {
        user_id: complaint.userId,
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
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data.map((item: any) => ({
          id: String(item.id),
          userId: String(item.user_id),
          name: item.name,
          bio: item.bio,
          photo: item.photo,
          date: item.date
        }));
      }
    } catch (e) {}
  }
  return getLocal<FeaturedFarmer>('agrifair_featured').map(f => ({ ...f, userId: String(f.userId) }));
};

const upsertFeaturedFarmer = async (farmer: FeaturedFarmer, userMobile?: string): Promise<string | null> => {
  let sUserId = String(farmer.userId);
  let finalCloudId: string | null = null;
  let syncSuccess = false;
  
  if (supabase) {
    try {
      if (isUuid(sUserId)) {
        const { data } = await supabase.from('users').select('id').eq('id', sUserId).maybeSingle();
        if (data) finalCloudId = data.id;
      }
      if (!finalCloudId && userMobile) {
        const { data } = await supabase.from('users').select('id').eq('mobile', userMobile).maybeSingle();
        if (data) finalCloudId = data.id;
      }
      if (!finalCloudId && userMobile) {
        const repairedUser = await createUser({ username: farmer.name, mobile: userMobile });
        if (isUuid(repairedUser.id)) finalCloudId = repairedUser.id;
      }

      if (finalCloudId) {
        const payload = {
          user_id: finalCloudId,
          name: farmer.name,
          bio: farmer.bio,
          photo: farmer.photo,
          date: farmer.date
        };

        const { error } = await supabase
          .from('featured_farmers')
          .upsert(payload, { onConflict: 'user_id' });
        
        if (error) {
          console.warn("[AgriFair] Cloud Sync Error:", error.message);
        } else {
          syncSuccess = true;
        }
      }
    } catch (e) {
      console.warn("[AgriFair] Cloud sync failed silently:", e);
    }
  }
  
  const farmers = getLocal<FeaturedFarmer>('agrifair_featured');
  const index = farmers.findIndex(f => String(f.userId) === sUserId || (finalCloudId && String(f.userId) === finalCloudId));
  const localFarmer = { ...farmer, userId: finalCloudId || sUserId };
  
  if (index > -1) farmers[index] = localFarmer;
  else farmers.push(localFarmer);
  
  setLocal('agrifair_featured', farmers);

  return syncSuccess ? (finalCloudId || sUserId) : null;
};

const deleteFeaturedFarmer = async (userId: string): Promise<void> => {
  const targetId = String(userId);
  if (supabase && isUuid(targetId)) {
    try {
      await supabase.from('featured_farmers').delete().eq('user_id', targetId);
    } catch (e) {}
  } 
  const farmers = getLocal<FeaturedFarmer>('agrifair_featured');
  const filtered = farmers.filter(f => String(f.userId) !== targetId);
  setLocal('agrifair_featured', filtered);
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
