
import { User, Complaint, FeaturedFarmer } from '../types';
import { supabase } from './supabaseClient';

/**
 * --- SUPABASE SQL SCHEMA ---
 * Run the following in your Supabase SQL Editor:
 * 
 * -- 1. Users Table
 * CREATE TABLE IF NOT EXISTS users (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   username TEXT NOT NULL,
 *   mobile TEXT UNIQUE NOT NULL,
 *   role TEXT DEFAULT 'user',
 *   otp_code TEXT,
 *   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
 * );
 * 
 * -- 2. Featured Farmers (Community Spotlight) Table
 * CREATE TABLE IF NOT EXISTS featured_farmers (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
 *   name TEXT NOT NULL,
 *   bio TEXT NOT NULL,
 *   photo TEXT NOT NULL, -- Stores Base64 image data
 *   date TEXT NOT NULL,
 *   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
 * );
 * 
 * -- 3. Complaints Table
 * CREATE TABLE IF NOT EXISTS complaints (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   user_id UUID REFERENCES users(id) ON DELETE CASCADE,
 *   trader_name TEXT NOT NULL,
 *   issue TEXT NOT NULL,
 *   date TEXT NOT NULL,
 *   status TEXT DEFAULT 'Pending',
 *   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
 * );
 * 
 * -- Optional: RLS (Row Level Security)
 * -- ALTER TABLE featured_farmers ENABLE ROW LEVEL SECURITY;
 * -- CREATE POLICY "Public Access" ON featured_farmers FOR SELECT USING (true);
 * ----------------------------
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
const generateId = () => Math.random().toString(36).substring(2, 15);

const mapDbToUser = (data: any): User => ({
  id: String(data.id),
  username: data.username,
  mobile: data.mobile,
  role: data.role
});

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
        return mapDbToUser(data);
      } else if (error) {
        // Handle case where user might already exist
        const existing = await findUserByMobile(user.mobile!);
        if (existing) return existing;
        console.error("Supabase user creation failed:", error);
      }
    } catch (e) {
      console.error("Supabase connection error during signup:", e);
    }
  } 

  // Fallback to local
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
  if (supabase) {
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
  if (supabase) {
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
      const payload = {
        user_id: sUserId,
        name: farmer.name,
        bio: farmer.bio,
        photo: farmer.photo,
        date: farmer.date
      };
      
      const { error } = await supabase
        .from('featured_farmers')
        .upsert(payload, { onConflict: 'user_id' });
        
      if (error) {
        console.error("Supabase upsert failed:", error);
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
    } catch (e) {}
  } 
  const farmers = getLocal<FeaturedFarmer>('agrifair_featured');
  const filtered = farmers.filter(f => String(f.userId) !== targetId);
  setLocal('agrifair_featured', filtered);
};

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
