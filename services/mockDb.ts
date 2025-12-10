import { User, Complaint } from '../types';

// Simulating SQL Tables with LocalStorage keys
const USERS_TABLE_KEY = 'agrifair_users';
const COMPLAINTS_TABLE_KEY = 'agrifair_complaints';

const safeParse = <T>(key: string, fallback: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (error) {
    console.error(`Error parsing ${key} from localStorage:`, error);
    return fallback;
  }
};

export const MockDB = {
  // User "Table" Operations
  findUserByMobile: (mobile: string): User | undefined => {
    const users = safeParse<User[]>(USERS_TABLE_KEY, []);
    // SQL Equivalent: SELECT * FROM users WHERE mobile = ? LIMIT 1
    return users.find(u => u.mobile === mobile);
  },

  createUser: (user: User): void => {
    const users = safeParse<User[]>(USERS_TABLE_KEY, []);
    users.push(user);
    localStorage.setItem(USERS_TABLE_KEY, JSON.stringify(users));
    
    // Simulate SQL Logging
    console.log(`%c[MockDB] SQL EXEC: INSERT INTO users (id, username, mobile) VALUES ('${user.id}', '${user.username}', '${user.mobile}');`, 'color: #3b82f6; font-weight: bold;');
  },

  // Complaint "Table" Operations
  getComplaintsByUserId: (userId: string): Complaint[] => {
    const complaints = safeParse<Complaint[]>(COMPLAINTS_TABLE_KEY, []);
    // SQL Equivalent: SELECT * FROM complaints WHERE userId = ?
    return complaints.filter(c => c.userId === userId);
  },

  createComplaint: (complaint: Complaint): void => {
    const complaints = safeParse<Complaint[]>(COMPLAINTS_TABLE_KEY, []);
    complaints.push(complaint);
    localStorage.setItem(COMPLAINTS_TABLE_KEY, JSON.stringify(complaints));
    
    // Simulate SQL Logging
    console.log(`%c[MockDB] SQL EXEC: INSERT INTO complaints (id, userId, traderName, issue, status) VALUES ('${complaint.id}', '${complaint.userId}', '${complaint.traderName}', '${complaint.issue}', '${complaint.status}');`, 'color: #3b82f6; font-weight: bold;');
  }
};