
import { User, Complaint, FeaturedFarmer } from '../types';
import { supabase } from './supabaseClient';

/**
 * --- REPAIR INSTRUCTIONS ---
 * If you see 'user_id column not found', go to Supabase SQL Editor and run:
 * 
 * DROP TABLE IF EXISTS featured_farmers;
 * CREATE TABLE featured_farmers (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
 *   name TEXT NOT NULL,
 *   bio TEXT NOT NULL,
 *   photo TEXT NOT NULL,
 *   date TEXT NOT NULL
 * );
 */

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
    } catch (e) {
      console.error("[AgriFair] Cloud lookup error:", e);
    }
  }
  const local = getLocal<User>('agrifair_users').find(u => u.mobile === mobile);
  return local ? { ...local, id: String(local.id) } : undefined;
};

const createUser = async (user: Partial<User>): Promise<User> => {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([{
          username: user.username,
          mobile: user.mobile,
          role: user.role || 'user'
        }])
        .select()
        .single();
      
      if (!error && data) {
        return mapDbToUser(data);
      } 
      
      // Handle existing user gracefully
      if (error && (error.code === '23505' || error.message?.includes('unique'))) {
        const existing = await findUserByMobile(user.mobile!);
        if (existing) return existing;
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
  
  if (supabase) {
    console.log("[AgriFair] Starting Cloud Sync for Spotlight...");
    try {
      // 1. Resolve true Cloud Identity
      if (isUuid(sUserId)) {
        const { data } = await supabase.from('users').select('id').eq('id', sUserId).maybeSingle();
        if (data) finalCloudId = data.id;
      }

      // 2. Recovery: Lookup by mobile if ID is local or missing in cloud
      if (!finalCloudId && userMobile) {
        const { data } = await supabase.from('users').select('id').eq('mobile', userMobile).maybeSingle();
        if (data) finalCloudId = data.id;
      }

      // 3. Last resort auto-repair
      if (!finalCloudId && userMobile) {
        const repairedUser = await createUser({ username: farmer.name, mobile: userMobile });
        if (isUuid(repairedUser.id)) finalCloudId = repairedUser.id;
      }

      // 4. Perform Upsert with verified cloud ID
      if (finalCloudId) {
        const payload = {
          user_id: finalCloudId, // Must match DB column name exactly
          name: farmer.name,
          bio: farmer.bio,
          photo: farmer.photo,
          date: farmer.date
        };

        const { error } = await supabase
          .from('featured_farmers')
          .upsert(payload, { onConflict: 'user_id' });
        
        if (error) {
          console.error("[AgriFair] DB Schema Error Detail:", error);
          if (error.message.includes('user_id')) {
            throw new Error("Schema Mismatch: Please ensure your 'featured_farmers' table has a 'user_id' column (UUID type). See logs for SQL fix.");
          }
          throw error;
        }
      } else {
        throw new Error("Identity Sync Failed: Could not link your local account to a Cloud UUID. Please logout and login again.");
      }
    } catch (e: any) {
      console.error("[AgriFair] Upsert Error:", e);
      throw e;
    }
  }
  
  // Update local for UI state
  const farmers = getLocal<FeaturedFarmer>('agrifair_featured');
  const index = farmers.findIndex(f => String(f.userId) === sUserId || (finalCloudId && String(f.userId) === finalCloudId));
  const localFarmer = { ...farmer, userId: finalCloudId || sUserId };
  if (index > -1) farmers[index] = localFarmer;
  else farmers.push(localFarmer);
  setLocal('agrifair_featured', farmers);

  return finalCloudId;
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
