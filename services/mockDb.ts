
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
      if (error) {
        console.warn("[AgriFair] Cloud lookup failed:", error.message);
      } else if (data) {
        return mapDbToUser(data);
      }
    } catch (e) { 
      console.error("[AgriFair] Unexpected Cloud Error:", e); 
    }
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
        return mapDbToUser(data);
      }
    } catch (e) {}
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
      await supabase.from('users').upsert(payload, { onConflict: 'mobile' });
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
  let finalUserId = complaint.userId;

  if (supabase && !isUuid(finalUserId)) {
    const localUser = JSON.parse(localStorage.getItem('agrifair_session') || '{}');
    if (localUser.mobile) {
      const cloudUser = await findUserByMobile(localUser.mobile);
      if (cloudUser && isUuid(cloudUser.id)) finalUserId = cloudUser.id;
    }
  }

  if (supabase && isUuid(finalUserId)) {
    try {
      const payload = {
        user_id: finalUserId,
        trader_name: complaint.traderName,
        issue: complaint.issue,
        date: complaint.date,
        status: complaint.status || 'Pending'
      };
      await supabase.from('complaints').insert([payload]);
      return;
    } catch (e) {}
  }
  
  const complaints = getLocal<Complaint>('agrifair_complaints');
  complaints.push({ ...complaint, id: generateId(), userId: finalUserId } as Complaint);
  setLocal('agrifair_complaints', complaints);
};

const getAllFeaturedFarmers = async (): Promise<FeaturedFarmer[]> => {
  if (supabase) {
    try {
      // Fetch farmers and join with their photos in a single request
      const { data, error } = await supabase
        .from('featured_farmers')
        .select(`
          user_id,
          name,
          bio,
          date,
          farmer_photos (
            image_data
          )
        `)
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data.map((item: any) => ({
          userId: item.user_id,
          name: item.name,
          bio: item.bio,
          date: item.date,
          photo: item.farmer_photos?.[0]?.image_data || '' // Get joined photo
        }));
      }
    } catch (e) {
      console.error("[AgriFair] Cloud Fetch Error:", e);
    }
  }
  return getLocal<FeaturedFarmer>('agrifair_featured');
};

const upsertFeaturedFarmer = async (farmer: FeaturedFarmer, userMobile?: string): Promise<string | null> => {
  let finalUserId = farmer.userId;

  if (supabase) {
    try {
      if (!isUuid(finalUserId) && userMobile) {
        const user = await findUserByMobile(userMobile);
        if (user && isUuid(user.id)) finalUserId = user.id;
      }

      if (isUuid(finalUserId)) {
        // Step 1: Upsert Farmer Metadata
        const { error: profileError } = await supabase
          .from('featured_farmers')
          .upsert({
            user_id: finalUserId,
            name: farmer.name,
            bio: farmer.bio,
            date: farmer.date
          }, { onConflict: 'user_id' });

        if (profileError) throw profileError;

        // Step 2: Upsert Photo Data in dedicated table
        const { error: photoError } = await supabase
          .from('farmer_photos')
          .upsert({
            farmer_id: finalUserId,
            image_data: farmer.photo
          }, { onConflict: 'farmer_id' });

        if (photoError) throw photoError;

        console.log("[AgriFair] Farmer profile and photo synced to Cloud.");
        return finalUserId;
      }
    } catch (e: any) {
      console.error("[AgriFair] Spotlight Cloud Error:", e.message);
    }
  }
  
  const farmers = getLocal<FeaturedFarmer>('agrifair_featured');
  const index = farmers.findIndex(f => f.userId === farmer.userId || f.userId === finalUserId);
  if (index > -1) farmers[index] = { ...farmer, userId: finalUserId };
  else farmers.push({ ...farmer, userId: finalUserId });
  setLocal('agrifair_featured', farmers);
  return null;
};

const deleteFeaturedFarmer = async (userId: string): Promise<void> => {
  if (supabase && isUuid(userId)) {
    try {
      // Cascading delete is handled in SQL via Foreign Key, 
      // but we explicitly delete from featured_farmers
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
