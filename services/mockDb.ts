
import { User, Complaint, FeaturedFarmer } from '../types';

// Simulating Cloud Database Tables (Vercel Postgres/KV)
const USERS_TABLE_KEY = 'agrifair_users';
const COMPLAINTS_TABLE_KEY = 'agrifair_complaints';
const FARMERS_TABLE_KEY = 'agrifair_featured_farmers';

const safeParse = <T>(key: string, fallback: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (error) {
    console.error(`[VercelDB] Error parsing ${key}:`, error);
    return fallback;
  }
};

const simulateLatency = (ms: number = 600) => new Promise(resolve => setTimeout(resolve, ms));

export const DatabaseService = {
  // User Operations
  findUserByMobile: async (mobile: string): Promise<User | undefined> => {
    await simulateLatency(300);
    const users = safeParse<User[]>(USERS_TABLE_KEY, []);
    return users.find(u => u.mobile === mobile);
  },

  // Synchronous version for internal auth logic if needed
  findUserByMobileSync: (mobile: string): User | undefined => {
    const users = safeParse<User[]>(USERS_TABLE_KEY, []);
    return users.find(u => u.mobile === mobile);
  },

  createUser: async (user: User): Promise<void> => {
    await simulateLatency(800);
    const users = safeParse<User[]>(USERS_TABLE_KEY, []);
    users.push(user);
    localStorage.setItem(USERS_TABLE_KEY, JSON.stringify(users));
    console.log(`%c[VercelDB] SQL: INSERT INTO users (id, username, mobile) VALUES ('${user.id}', '${user.username}', '${user.mobile}');`, 'color: #0070f3; font-weight: bold;');
  },

  // Complaint Operations
  getComplaintsByUserId: async (userId: string): Promise<Complaint[]> => {
    await simulateLatency(500);
    const complaints = safeParse<Complaint[]>(COMPLAINTS_TABLE_KEY, []);
    return complaints.filter(c => c.userId === userId).reverse();
  },

  createComplaint: async (complaint: Complaint): Promise<void> => {
    await simulateLatency(1000);
    const complaints = safeParse<Complaint[]>(COMPLAINTS_TABLE_KEY, []);
    complaints.push(complaint);
    localStorage.setItem(COMPLAINTS_TABLE_KEY, JSON.stringify(complaints));
    console.log(`%c[VercelDB] SQL: INSERT INTO complaints (trader, issue) VALUES ('${complaint.traderName}', '...');`, 'color: #0070f3; font-weight: bold;');
  },

  // Featured Farmer Operations (New)
  getAllFeaturedFarmers: async (): Promise<FeaturedFarmer[]> => {
    await simulateLatency(700);
    return safeParse<FeaturedFarmer[]>(FARMERS_TABLE_KEY, []);
  },

  upsertFeaturedFarmer: async (farmer: FeaturedFarmer): Promise<void> => {
    await simulateLatency(1200);
    const farmers = safeParse<FeaturedFarmer[]>(FARMERS_TABLE_KEY, []);
    const index = farmers.findIndex(f => f.userId === farmer.userId);
    
    if (index > -1) {
      farmers[index] = farmer;
    } else {
      farmers.push(farmer);
    }
    
    localStorage.setItem(FARMERS_TABLE_KEY, JSON.stringify(farmers));
    console.log(`%c[VercelDB] SQL: UPSERT INTO featured_farmers (userId, name) VALUES ('${farmer.userId}', '${farmer.name}');`, 'color: #0070f3; font-weight: bold;');
  },

  deleteFeaturedFarmer: async (userId: string): Promise<void> => {
    await simulateLatency(600);
    const farmers = safeParse<FeaturedFarmer[]>(FARMERS_TABLE_KEY, []);
    const filtered = farmers.filter(f => f.userId !== userId);
    localStorage.setItem(FARMERS_TABLE_KEY, JSON.stringify(filtered));
    console.log(`%c[VercelDB] SQL: DELETE FROM featured_farmers WHERE userId = '${userId}';`, 'color: #0070f3; font-weight: bold;');
  }
};
