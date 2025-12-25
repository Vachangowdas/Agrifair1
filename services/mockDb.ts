
import { User, Complaint, FeaturedFarmer } from '../types';
import { supabase } from './supabaseClient';

/**
 * IMPORTANT: If you see "user_id column not found", run this in Supabase SQL Editor:
 * 
 * CREATE TABLE IF NOT EXISTS users (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   username TEXT NOT NULL,
 *   mobile TEXT UNIQUE NOT NULL,
 *   role TEXT DEFAULT 'user'
 * );
 * 
 * CREATE TABLE IF NOT EXISTS featured_farmers (
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

const isUuid = (str: string) => {
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
      console.error("Supabase find error:", e);
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
  if (supabase && isUuid(String(complaint.userId))) {
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
    try {
      // 1. Validate Identity
      if (isUuid(sUserId)) {
        const { data } = await supabase.from('users').select('id').eq('id', sUserId).maybeSingle();
        if (data) finalCloudId = data.id;
      }

      if (!finalCloudId && userMobile) {
        const { data } = await supabase.from('users').select('id').eq('mobile', userMobile).maybeSingle();
        if (data) finalCloudId = data.id;
      }

      // 2. Auto-repair account if missing in cloud
      if (!finalCloudId && userMobile) {
        const newUser = await createUser({ username: farmer.name, mobile: userMobile });
        if (isUuid(newUser.id)) finalCloudId = newUser.id;
      }

      // 3. Upsert Story
      if (finalCloudId) {
        const payload = {
          user_id: finalCloudId, // Code expects snake_case: user_id
          name: farmer.name,
          bio: farmer.bio,
          photo: farmer.photo,
          date: farmer.date
        };

        const { error } = await supabase
          .from('featured_farmers')
          .upsert(payload, { onConflict: 'user_id' });
        
        if (error) {
          if (error.message.includes('user_id') && error.message.includes('schema cache')) {
            throw new Error("Critical: Your Supabase table is missing the 'user_id' column. Please run the SQL fix from the instructions.");
          }
          throw error;
        }
      } else {
        throw new Error("Could not find a matching cloud account. Please log out and log in again.");
      }
    } catch (e: any) {
      console.error("[AgriFair] Sync Error:", e);
      throw e;
    }
  }
  
  // Local Backup
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
