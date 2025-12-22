
import { User, Complaint, FeaturedFarmer } from '../types';
import { supabase } from './supabaseClient';

export const DatabaseService = {
  // User Operations
  findUserByMobile: async (mobile: string): Promise<User | undefined> => {
    if (!supabase) return undefined;
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('mobile', mobile)
      .single();
    
    if (error) {
      console.error('[Supabase] Error finding user:', error.message);
      return undefined;
    }
    return data as User;
  },

  // Mocked sync check for auth context (requires async internally)
  findUserByMobileSync: (mobile: string): User | undefined => {
    // In a real Supabase app, we should migrate the AuthContext to be fully async.
    // For now, we return undefined to prevent errors, but warn the developer.
    console.warn('[Supabase] Sync method called. Use findUserByMobile instead.');
    return undefined; 
  },

  createUser: async (user: User): Promise<void> => {
    if (!supabase) throw new Error("Database not connected");

    const { error } = await supabase
      .from('users')
      .insert([user]);
    
    if (error) {
      console.error('[Supabase] Error creating user:', error.message);
      throw error;
    }
  },

  // Complaint Operations
  getComplaintsByUserId: async (userId: string): Promise<Complaint[]> => {
    if (!supabase) return [];

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
  },

  createComplaint: async (complaint: Complaint): Promise<void> => {
    if (!supabase) throw new Error("Database not connected");

    const { error } = await supabase
      .from('complaints')
      .insert([complaint]);
    
    if (error) {
      console.error('[Supabase] Error creating complaint:', error.message);
      throw error;
    }
  },

  // Featured Farmer Operations
  getAllFeaturedFarmers: async (): Promise<FeaturedFarmer[]> => {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('featured_farmers')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) {
      console.error('[Supabase] Error fetching featured farmers:', error.message);
      return [];
    }
    return data as FeaturedFarmer[];
  },

  upsertFeaturedFarmer: async (farmer: FeaturedFarmer): Promise<void> => {
    if (!supabase) throw new Error("Database not connected");

    const { error } = await supabase
      .from('featured_farmers')
      .upsert(farmer);
    
    if (error) {
      console.error('[Supabase] Error upserting farmer:', error.message);
      throw error;
    }
  },

  deleteFeaturedFarmer: async (userId: string): Promise<void> => {
    if (!supabase) throw new Error("Database not connected");

    const { error } = await supabase
      .from('featured_farmers')
      .delete()
      .eq('userId', userId);
    
    if (error) {
      console.error('[Supabase] Error deleting farmer:', error.message);
      throw error;
    }
  }
};
