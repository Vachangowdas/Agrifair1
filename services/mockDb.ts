
import { User, Complaint, FeaturedFarmer } from '../types';
import { supabase } from './supabaseClient';

// Helper for local storage fallbacks
const getLocal = <T>(key: string): T[] => JSON.parse(localStorage.getItem(key) || '[]');
const setLocal = <T>(key: string, data: T[]) => localStorage.setItem(key, JSON.stringify(data));

// Simple UUID generator for local mode
const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

export const DatabaseService = {
  // User Operations
  findUserByMobile: async (mobile: string): Promise<User | undefined> => {
    if (supabase) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('mobile', mobile)
        .maybeSingle();
      
      if (error) {
        console.error('[Supabase] Error finding user:', error.message);
        return undefined;
      }
      return data as User;
    } else {
      const users = getLocal<User>('agrifair_users');
      return users.find(u => u.mobile === mobile);
    }
  },

  createUser: async (user: Partial<User>): Promise<void> => {
    if (supabase) {
      const { error } = await supabase
        .from('users')
        .insert([user]);
      
      if (error) {
        console.error('[Supabase] Error creating user:', error.message);
        throw error;
      }
    } else {
      const users = getLocal<User>('agrifair_users');
      const newUser = { ...user, id: generateId() } as User;
      users.push(newUser);
      setLocal('agrifair_users', users);
    }
  },

  // Complaint Operations
  getComplaintsByUserId: async (userId: string): Promise<Complaint[]> => {
    if (supabase) {
      const { data, error } = await supabase
        .from('complaints')
        .select('*')
        .eq('userId', userId)
        .order('date', { ascending: false });
      
      if (error) {
        console.error('[Supabase] Error fetching complaints:', error.message);
        return [];
      }
      return data as Complaint[];
    } else {
      const complaints = getLocal<Complaint>('agrifair_complaints');
      return complaints.filter(c => c.userId === userId);
    }
  },

  createComplaint: async (complaint: Partial<Complaint>): Promise<void> => {
    if (supabase) {
      const { error } = await supabase
        .from('complaints')
        .insert([complaint]);
      
      if (error) {
        console.error('[Supabase] Error creating complaint:', error.message);
        throw error;
      }
    } else {
      const complaints = getLocal<Complaint>('agrifair_complaints');
      const newComplaint = { ...complaint, id: generateId() } as Complaint;
      complaints.push(newComplaint);
      setLocal('agrifair_complaints', complaints);
    }
  },

  // Featured Farmer Operations
  getAllFeaturedFarmers: async (): Promise<FeaturedFarmer[]> => {
    if (supabase) {
      const { data, error } = await supabase
        .from('featured_farmers')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) {
        console.error('[Supabase] Error fetching featured farmers:', error.message);
        return [];
      }
      return data as FeaturedFarmer[];
    } else {
      return getLocal<FeaturedFarmer>('agrifair_featured');
    }
  },

  upsertFeaturedFarmer: async (farmer: FeaturedFarmer): Promise<void> => {
    if (supabase) {
      const { error } = await supabase
        .from('featured_farmers')
        .upsert(farmer);
      
      if (error) {
        console.error('[Supabase] Error upserting farmer:', error.message);
        throw error;
      }
    } else {
      const farmers = getLocal<FeaturedFarmer>('agrifair_featured');
      const index = farmers.findIndex(f => f.userId === farmer.userId);
      if (index > -1) {
        farmers[index] = farmer;
      } else {
        farmers.push(farmer);
      }
      setLocal('agrifair_featured', farmers);
    }
  },

  deleteFeaturedFarmer: async (userId: string): Promise<void> => {
    if (supabase) {
      const { error } = await supabase
        .from('featured_farmers')
        .delete()
        .eq('userId', userId);
      
      if (error) {
        console.error('[Supabase] Error deleting farmer:', error.message);
        throw error;
      }
    } else {
      const farmers = getLocal<FeaturedFarmer>('agrifair_featured');
      const filtered = farmers.filter(f => f.userId !== userId);
      setLocal('agrifair_featured', filtered);
    }
  }
};
