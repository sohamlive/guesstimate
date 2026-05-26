import { supabase, hasSupabaseConfig } from './supabase';
import {
  Category, Question, Profile, UserProgress, UserVote,
  Difficulty, QuestionStatus, ProgressStatus, VoteType, UserRole, AuthSession
} from '../types';

// ==========================================
// PRE-SEEDED SEED DATA FOR OFFLINE / MOCK DRIVER
// ==========================================

const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Population' },
  { id: 'cat-2', name: 'Market' },
  { id: 'cat-3', name: 'Revenue' },
  { id: 'cat-4', name: 'Product' },
];

const INITIAL_QUESTIONS: Question[] = [
  {
    id: 'q-1',
    question: 'How many coffee shops are there in Manhattan?',
    category_id: 'cat-1',
    difficulty: 'Medium',
    tags: ['retail', 'nyc', 'coffee'],
    url_1: 'https://en.wikipedia.org/wiki/Manhattan',
    url_2: 'https://www.statista.com',
    status: 'Published',
    upvotes: 42,
    downvotes: 3,
    created_at: new Date('2026-01-10').toISOString(),
    updated_at: new Date('2026-01-10').toISOString()
  },
  {
    id: 'q-2',
    question: 'How many piano tuners operate in Chicago?',
    category_id: 'cat-2',
    difficulty: 'Hard',
    tags: ['chicago', 'music', 'classic-fermi'],
    url_1: 'https://en.wikipedia.org/wiki/Fermi_problem',
    status: 'Published',
    upvotes: 128,
    downvotes: 4,
    created_at: new Date('2026-01-15').toISOString(),
    updated_at: new Date('2026-01-15').toISOString()
  },
  {
    id: 'q-3',
    question: 'What is the total mass of the Earth\'s atmosphere?',
    category_id: 'cat-1',
    difficulty: 'Hard',
    tags: ['physics', 'earth', 'atmosphere'],
    url_1: 'https://en.wikipedia.org/wiki/Atmosphere_of_Earth',
    status: 'Published',
    upvotes: 67,
    downvotes: 1,
    created_at: new Date('2026-02-01').toISOString(),
    updated_at: new Date('2026-02-01').toISOString()
  },
  {
    id: 'q-4',
    question: 'How many smartphones are sold globally each year?',
    category_id: 'cat-4',
    difficulty: 'Medium',
    tags: ['tech', 'global', 'phones'],
    status: 'Published',
    upvotes: 89,
    downvotes: 5,
    created_at: new Date('2026-02-10').toISOString(),
    updated_at: new Date('2026-02-10').toISOString()
  },
  {
    id: 'q-5',
    question: 'What is the population density of Monaco?',
    category_id: 'cat-1',
    difficulty: 'Easy',
    tags: ['monaco', 'density', 'geography'],
    url_1: 'https://en.wikipedia.org/wiki/Monaco',
    status: 'Published',
    upvotes: 12,
    downvotes: 0,
    created_at: new Date('2026-02-12').toISOString(),
    updated_at: new Date('2026-02-12').toISOString()
  },
  {
    id: 'q-6',
    question: 'How many gallons of gasoline are consumed in the US daily?',
    category_id: 'cat-3',
    difficulty: 'Medium',
    tags: ['us', 'energy', 'transportation'],
    status: 'Published',
    upvotes: 54,
    downvotes: 2,
    created_at: new Date('2026-02-18').toISOString(),
    updated_at: new Date('2026-02-18').toISOString()
  },
  {
    id: 'q-7',
    question: 'How many liters of water does an average human drink in a lifetime?',
    category_id: 'cat-4',
    difficulty: 'Easy',
    tags: ['health', 'biology', 'water'],
    status: 'Published',
    upvotes: 31,
    downvotes: 1,
    created_at: new Date('2026-03-01').toISOString(),
    updated_at: new Date('2026-03-01').toISOString()
  },
  {
    id: 'q-8',
    question: 'What is the collective weight of all ants on Earth?',
    category_id: 'cat-4',
    difficulty: 'Hard',
    tags: ['biology', 'nature', 'ants'],
    status: 'Published',
    upvotes: 176,
    downvotes: 8,
    created_at: new Date('2026-03-05').toISOString(),
    updated_at: new Date('2026-03-05').toISOString()
  },
  {
    id: 'q-9',
    question: 'How many tennis balls are used during the Wimbledon tournament?',
    category_id: 'cat-2',
    difficulty: 'Medium',
    tags: ['sports', 'london', 'events'],
    status: 'Published',
    upvotes: 24,
    downvotes: 3,
    created_at: new Date('2026-03-12').toISOString(),
    updated_at: new Date('2026-03-12').toISOString()
  },
  {
    id: 'q-10',
    question: 'Sample Draft Question for Admin practice only?',
    category_id: 'cat-3',
    difficulty: 'Easy',
    tags: ['draft', 'test'],
    status: 'Draft',
    upvotes: 0,
    downvotes: 0,
    created_at: new Date('2026-03-15').toISOString(),
    updated_at: new Date('2026-03-15').toISOString()
  }
];

const INITIAL_PROFILES: Profile[] = [
  {
    id: 'user-admin',
    first_name: 'Soham',
    last_name: 'Admin',
    email: 'admin@guesstimate.com',
    role: 'admin',
    created_at: new Date('2026-01-01').toISOString(),
    plain_password: 'admin'
  },
  {
    id: 'user-standard',
    first_name: 'John',
    last_name: 'Doe',
    email: 'user@guesstimate.com',
    role: 'user',
    created_at: new Date('2026-01-02').toISOString(),
    plain_password: 'user123'
  },
  {
    id: 'user-soham',
    first_name: 'Soham',
    last_name: 'Owner',
    email: 'sohamlive@gmail.com',
    role: 'user',
    created_at: new Date('2026-01-03').toISOString(),
    plain_password: 'user123'
  }
];

const INITIAL_PROGRESS: UserProgress[] = [
  {
    id: 'prog-1',
    user_id: 'user-standard',
    question_id: 'q-1',
    status: 'solved',
    notes: 'Assuming 8.3 million NYC population & 15% in Manhattan during work hours. Assume 1 coffee shop per 3000 people. Yields around 400-500 formal cafes. Plus food stalls & delis, maybe 1500 total.',
    updated_at: new Date('2026-05-15T10:00:00Z').toISOString()
  },
  {
    id: 'prog-2',
    user_id: 'user-standard',
    question_id: 'q-2',
    status: 'retry',
    notes: 'Initial estimate of 150 tuners felt too high. Need to recalculate based on piano ownership rates (estimate 1% households).',
    updated_at: new Date('2026-05-16T11:00:00Z').toISOString()
  },
  {
    id: 'prog-3',
    user_id: 'user-standard',
    question_id: 'q-5',
    status: 'solved',
    notes: 'Easy direct calculation: 39,000 population divided by 2 square kilometers limit. Approx 19,500 people/km².',
    updated_at: new Date('2026-05-17T09:30:00Z').toISOString()
  },
  {
    id: 'prog-4',
    user_id: 'user-soham',
    question_id: 'q-1',
    status: 'solved',
    notes: 'Working out coffee demand. 2 million residents in Manhattan + 1 million commuters = 3 million coffee drinkers. Coffee shops can serve 300 coffee cups per day.',
    updated_at: new Date('2026-05-18T14:45:00Z').toISOString()
  }
];

const INITIAL_VOTES: UserVote[] = [
  {
    id: 'vote-1',
    user_id: 'user-standard',
    question_id: 'q-1',
    vote: 'up',
    created_at: new Date().toISOString()
  },
  {
    id: 'vote-2',
    user_id: 'user-standard',
    question_id: 'q-2',
    vote: 'up',
    created_at: new Date().toISOString()
  }
];

// ==========================================
// MOCK STATE INITIALIZATION
// ==========================================

const initLocalStorage = () => {
  if (!localStorage.getItem('g_categories')) {
    localStorage.setItem('g_categories', JSON.stringify(INITIAL_CATEGORIES));
  }
  if (!localStorage.getItem('g_questions')) {
    localStorage.setItem('g_questions', JSON.stringify(INITIAL_QUESTIONS));
  }
  if (!localStorage.getItem('g_profiles')) {
    localStorage.setItem('g_profiles', JSON.stringify(INITIAL_PROFILES));
  }
  if (!localStorage.getItem('g_progress')) {
    localStorage.setItem('g_progress', JSON.stringify(INITIAL_PROGRESS));
  }
  if (!localStorage.getItem('g_votes')) {
    localStorage.setItem('g_votes', JSON.stringify(INITIAL_VOTES));
  }
  // Initialize current session as null initially
  if (!localStorage.getItem('g_session')) {
    localStorage.setItem('g_session', JSON.stringify(null));
  }
};

initLocalStorage();

// Simple UUID generator for mock
const generateUuid = () => 'uid-' + Math.random().toString(36).substring(2, 11);

// ==========================================
// UNIFIED ENGINE ROUTER
// ==========================================

const mockAuth = {
  signIn: async (email: string, password?: string): Promise<{ data: { session: AuthSession | null }; error: Error | null }> => {
    const profiles: Profile[] = JSON.parse(localStorage.getItem('g_profiles') || '[]');
    const userRole = email.includes('admin') ? 'admin' : 'user';

    const found = profiles.find(p => p.email.toLowerCase() === email.toLowerCase());
    if (found) {
      // For mock simplicity, verify role-based prefix of password or default matches
      const expectedPass = found.plain_password || 'user123';
      if (password && password !== expectedPass) {
        return { data: { session: null }, error: new Error('Invalid email or password.') };
      }

      const session: AuthSession = {
        user: { id: found.id, email: found.email },
        profile: found
      };
      localStorage.setItem('g_session', JSON.stringify(session));
      return { data: { session }, error: null };
    }

    // Auto-create standard users if they logging in with valid user@... format to make testing frictionless!
    if (email.toLowerCase() === 'user@guesstimate.com' || email.toLowerCase() === 'admin@guesstimate.com') {
      const is_admin = email.includes('admin');
      const mockProfile: Profile = {
        id: is_admin ? 'user-admin' : 'user-standard',
        first_name: is_admin ? 'Soham' : 'Standard',
        last_name: is_admin ? 'Admin' : 'Practitioner',
        email: email,
        role: is_admin ? 'admin' : 'user',
        created_at: new Date().toISOString()
      };

      // Save it
      profiles.push(mockProfile);
      localStorage.setItem('g_profiles', JSON.stringify(profiles));

      const session: AuthSession = {
        user: { id: mockProfile.id, email: mockProfile.email },
        profile: mockProfile
      };
      localStorage.setItem('g_session', JSON.stringify(session));
      return { data: { session }, error: null };
    }

    return { data: { session: null }, error: new Error('User account not found. Please contact the administrator to create your account.') };
  },

  signOut: async () => {
    localStorage.setItem('g_session', JSON.stringify(null));
    return { error: null };
  },

  getSession: async (): Promise<AuthSession | null> => {
    const sessionStr = localStorage.getItem('g_session');
    if (sessionStr) {
      try {
        return JSON.parse(sessionStr);
      } catch {
        return null;
      }
    }
    return null;
  }
};

// ==========================================
// WRITE-AHEAD SYNC QUEUE TYPES & DRIVER
// ==========================================

export interface SyncQueueItem {
  id: string;
  type: 'toggle_progress' | 'save_notes' | 'toggle_vote';
  userId: string;
  questionId: string;
  payload: any;
  createdAt: string;
  attempts: number;
}

let isSyncing = false;

export const processSyncQueue = async (): Promise<void> => {
  if (isSyncing) return;
  if (!hasSupabaseConfig() || !supabase) return;

  isSyncing = true;
  try {
    const queue: SyncQueueItem[] = JSON.parse(localStorage.getItem('g_sync_queue') || '[]');
    if (queue.length === 0) {
      isSyncing = false;
      return;
    }

    const activeQueue = [...queue];
    while (activeQueue.length > 0) {
      const item = activeQueue[0];

      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        break; // Stop processing if we are explicitly offline
      }

      try {
        if (item.type === 'toggle_progress') {
          const { error } = await supabase
            .from('user_progress')
            .upsert({
              user_id: item.userId,
              question_id: item.questionId,
              status: item.payload.status,
              updated_at: item.createdAt
            }, { onConflict: 'user_id,question_id' });
          if (error) throw error;

        } else if (item.type === 'save_notes') {
          const { data: existingProgress } = await supabase
            .from('user_progress')
            .select('status')
            .eq('user_id', item.userId)
            .eq('question_id', item.questionId)
            .maybeSingle();

          const targetStatus = existingProgress?.status || 'none';

          const { error } = await supabase
            .from('user_progress')
            .upsert({
              user_id: item.userId,
              question_id: item.questionId,
              notes: item.payload.notes,
              status: targetStatus,
              updated_at: item.createdAt
            }, { onConflict: 'user_id,question_id' });
          if (error) throw error;

        } else if (item.type === 'toggle_vote') {
          const direction = item.payload.direction;
          if (direction === null) {
            const { error } = await supabase.from('user_votes').delete().eq('user_id', item.userId).eq('question_id', item.questionId);
            if (error) throw error;
          } else {
            const { error } = await supabase
              .from('user_votes')
              .upsert({
                user_id: item.userId,
                question_id: item.questionId,
                vote: direction,
                created_at: item.createdAt
              }, { onConflict: 'user_id,question_id' });
            if (error) throw error;
          }

          // Recalculate upvote & downvote counts
          const { data: qVotes } = await supabase
            .from('user_votes')
            .select('vote')
            .eq('question_id', item.questionId);

          const upCount = (qVotes || []).filter(v => v.vote === 'up').length;
          const downCount = (qVotes || []).filter(v => v.vote === 'down').length;

          await supabase
            .from('questions')
            .update({ upvotes: upCount, downvotes: downCount })
            .eq('id', item.questionId);
        }

        // Successfully processed. Shift out from queue
        activeQueue.shift();
        localStorage.setItem('g_sync_queue', JSON.stringify(activeQueue));

      } catch (err: any) {
        console.error('Error syncing queue item:', item, err);
        const isNetworkErr = !err.status || err.status >= 500 || err.message?.includes('fetch') || err.message?.includes('network');

        if (isNetworkErr) {
          break; // Pause and retry on next trigger/timer
        } else {
          item.attempts = (item.attempts || 0) + 1;
          if (item.attempts >= 5) {
            console.warn(`Item failed 5 times, discarding:`, item);
            activeQueue.shift();
          } else {
            activeQueue[0] = item;
          }
          localStorage.setItem('g_sync_queue', JSON.stringify(activeQueue));
          break;
        }
      }
    }
  } catch (globalErr) {
    console.error('Error in write-ahead queue runner:', globalErr);
  } finally {
    isSyncing = false;
  }
};

// Bind standard Browser listeners to automatically drain the sync backlog when network returns
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('App is online. Processing Write-Ahead Log sync queue...');
    processSyncQueue().catch(console.error);
  });
  // Auto-sync heartbeat every 20 seconds
  setInterval(() => {
    processSyncQueue().catch(console.error);
  }, 20000);
}

export const db = {
  // Check if we are operational with live Supabase
  isLive: (): boolean => {
    return hasSupabaseConfig();
  },

  // ==========================================
  // AUTH OPERATIONS
  // ==========================================

  login: async (email: string, password?: string): Promise<{ session: AuthSession | null; error: Error | null }> => {
    if (db.isLive()) {
      try {
        const { data, error } = await supabase!.auth.signInWithPassword({ email, password: password || '' });
        if (error) throw error;

        if (data?.user) {
          // Fetch associated profile safely without crashing on single()
          let profile: Profile | null = null;
          try {
            const { data: profilesList, error: pError } = await supabase!
              .from('profiles')
              .select('*')
              .eq('id', data.user.id);

            if (!pError && profilesList && profilesList.length > 0) {
              profile = profilesList[0] as Profile;
            } else {
              // Attempt to recover by upserting/creating the profile row
              // When Supabase is connected, we disable the dynamic "includes('admin') email check" auto-promotion rule.
              // All live user roles must default strictly to 'user', unless they match the primary owner coordinates.
              const targetRole = email.toLowerCase() === 'sohamlive@gmail.com' ? 'admin' : 'user';
              const { data: upserted, error: uErr } = await supabase!
                .from('profiles')
                .upsert({
                  id: data.user.id,
                  first_name: data.user.user_metadata?.first_name || 'User',
                  last_name: data.user.user_metadata?.last_name || 'Practitioner',
                  email: data.user.email || email,
                  role: targetRole
                })
                .select();

              if (!uErr && upserted && upserted.length > 0) {
                profile = upserted[0] as Profile;
              }
            }
          } catch (pErr) {
            console.warn('Handling profiles table query error:', pErr);
          }

          if (!profile) {
            // Memory fallback to ensure login succeeds even if DB table is unprovisioned or RLS blocked
            profile = {
              id: data.user.id,
              first_name: data.user.user_metadata?.first_name || 'User',
              last_name: data.user.user_metadata?.last_name || 'Practitioner',
              email: data.user.email || email,
              role: (email.toLowerCase() === 'sohamlive@gmail.com' ? 'admin' : 'user') as UserRole,
              created_at: data.user.created_at || new Date().toISOString()
            };
          }

          const session: AuthSession = {
            user: { id: data.user.id, email: data.user.email || '' },
            profile: profile
          };
          return { session, error: null };
        }
        return { session: null, error: new Error('Login failed. Please verify credentials.') };
      } catch (err: any) {
        console.error('Supabase login error:', err);
        return { session: null, error: err };
      }
    } else {
      const { data, error } = await mockAuth.signIn(email, password);
      return { session: data.session, error };
    }
  },

  signUp: async (email: string, password?: string, firstName?: string, lastName?: string): Promise<{ session: AuthSession | null; error: Error | null }> => {
    const cleanMail = email.trim().toLowerCase();
    const pass = password || '';
    if (db.isLive()) {
      try {
        const { data, error } = await supabase!.auth.signUp({
          email: cleanMail,
          password: pass,
          options: {
            data: {
              first_name: firstName || '',
              last_name: lastName || ''
            }
          }
        });
        if (error) throw error;
        if (data?.user) {
          // Attempt profile upsert safely (which also keeps metadata up to date) without crashing on single()
          let profile: Profile | null = null;
          try {
            const { data: upserted, error: pError } = await supabase!
              .from('profiles')
              .upsert({
                id: data.user.id,
                first_name: firstName || 'User',
                last_name: lastName || 'Practitioner',
                email: cleanMail,
                role: 'user'
              })
              .select();
            if (!pError && upserted && upserted.length > 0) {
              profile = upserted[0] as Profile;
            }
          } catch (e) {
            console.warn('Could not register profile in DB, using fallback memory state', e);
          }

          const session: AuthSession = {
            user: { id: data.user.id, email: data.user.email || '' },
            profile: (profile || {
              id: data.user.id,
              first_name: firstName || 'User',
              last_name: lastName || 'Practitioner',
              email: cleanMail,
              role: 'user',
              created_at: new Date().toISOString()
            }) as Profile
          };
          return { session, error: null };
        }
        return { session: null, error: new Error('Registration failed.') };
      } catch (err: any) {
        console.error('Supabase signup error:', err);
        return { session: null, error: err };
      }
    } else {

      const profiles: Profile[] = JSON.parse(localStorage.getItem('g_profiles') || '[]');
      if (profiles.some(p => p.email.toLowerCase() === cleanMail)) {
        return { session: null, error: new Error('A user with this email address already exists.') };
      }
      const newProfile: Profile = {
        id: generateUuid(),
        first_name: firstName || 'User',
        last_name: lastName || 'Practitioner',
        email: cleanMail,
        role: 'user',
        created_at: new Date().toISOString(),
        plain_password: pass
      };
      profiles.unshift(newProfile);
      localStorage.setItem('g_profiles', JSON.stringify(profiles));

      const session: AuthSession = {
        user: { id: newProfile.id, email: newProfile.email },
        profile: newProfile
      };
      localStorage.setItem('g_session', JSON.stringify(session));
      return { session, error: null };
    }
  },

  resetPassword: async (email: string): Promise<{ success: boolean; error: Error | null }> => {
    const cleanMail = email.trim().toLowerCase();
    if (db.isLive()) {
      try {
        const { error } = await supabase!.auth.resetPasswordForEmail(cleanMail, {
          redirectTo: `${window.location.origin}/user/login?mode=update-password`,
        });
        if (error) throw error;
        return { success: true, error: null };
      } catch (err: any) {
        console.error('Supabase password reset error:', err);
        return { success: false, error: err };
      }
    } else {
      const profiles: Profile[] = JSON.parse(localStorage.getItem('g_profiles') || '[]');
      const found = profiles.find(p => p.email.toLowerCase() === cleanMail);
      if (!found) {
        return { success: false, error: new Error('No user account found with this email coordinates.') };
      }
      return { success: true, error: null };
    }
  },

  logout: async (): Promise<{ error: Error | null }> => {
    if (db.isLive()) {
      const { error } = await supabase!.auth.signOut();
      return { error };
    } else {
      return mockAuth.signOut();
    }
  },

  getSession: async (): Promise<AuthSession | null> => {
    if (db.isLive()) {
      try {
        const { data: { session } } = await supabase!.auth.getSession();
        if (session?.user) {
          let profile: Profile | null = null;
          try {
            const { data: profilesList, error: pError } = await supabase!
              .from('profiles')
              .select('*')
              .eq('id', session.user.id);

            if (!pError && profilesList && profilesList.length > 0) {
              profile = profilesList[0] as Profile;
            } else {
              // Attempt to recover by upserting/creating the profile row
              // When Supabase is connected, we disable the dynamic "includes('admin') email check" auto-promotion rule.
              // All live user roles must default strictly to 'user', unless they match the primary owner coordinates.
              const targetRole = (session.user.email || '').toLowerCase() === 'sohamlive@gmail.com' ? 'admin' : 'user';
              const { data: upserted, error: uErr } = await supabase!
                .from('profiles')
                .upsert({
                  id: session.user.id,
                  first_name: session.user.user_metadata?.first_name || 'User',
                  last_name: session.user.user_metadata?.last_name || 'Practitioner',
                  email: session.user.email || '',
                  role: targetRole
                })
                .select();

              if (!uErr && upserted && upserted.length > 0) {
                profile = upserted[0] as Profile;
              }
            }
          } catch (pErr) {
            console.warn('Session profiles table query error:', pErr);
          }

          if (!profile) {
            profile = {
              id: session.user.id,
              first_name: session.user.user_metadata?.first_name || 'User',
              last_name: session.user.user_metadata?.last_name || 'Practitioner',
              email: session.user.email || '',
              role: ((session.user.email || '').toLowerCase() === 'sohamlive@gmail.com' ? 'admin' : 'user') as UserRole,
              created_at: session.user.created_at || new Date().toISOString()
            };
          }

          return {
            user: { id: session.user.id, email: session.user.email || '' },
            profile: profile
          };
        }
        return null;
      } catch (e) {
        console.error('Supabase getSession failed', e);
        return null;
      }
    } else {
      return mockAuth.getSession();
    }
  },

  // ==========================================
  // CATEGORIES OPERATIONS
  // ==========================================

  getCategories: async (): Promise<Category[]> => {
    if (db.isLive()) {
      const { data, error } = await supabase!.from('categories').select('*').order('name');
      if (error) throw error;
      return data || [];
    } else {
      return JSON.parse(localStorage.getItem('g_categories') || '[]') as Category[];
    }
  },

  addCategory: async (name: string): Promise<Category> => {
    const cleanName = name.trim();
    if (db.isLive()) {
      const { data, error } = await supabase!.from('categories').insert([{ name: cleanName }]).select().single();
      if (error) throw error;
      return data;
    } else {
      const categories = await db.getCategories();
      if (categories.some(c => c.name.toLowerCase() === cleanName.toLowerCase())) {
        throw new Error('Category already exists');
      }
      const newCat: Category = {
        id: generateUuid(),
        name: cleanName,
        created_at: new Date().toISOString()
      };
      categories.push(newCat);
      localStorage.setItem('g_categories', JSON.stringify(categories));
      return newCat;
    }
  },

  // ==========================================
  // QUESTIONS OPERATIONS
  // ==========================================

  getQuestions: async (includeDrafts = false): Promise<Question[]> => {
    if (db.isLive()) {
      let query = supabase!.from('questions').select('*, categories(name)');
      if (!includeDrafts) {
        query = query.eq('status', 'Published');
      }
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(q => ({
        ...q,
        category_name: q.categories?.name || 'Uncategorized'
      }));
    } else {
      const questions: Question[] = JSON.parse(localStorage.getItem('g_questions') || '[]');
      const categories: Category[] = JSON.parse(localStorage.getItem('g_categories') || '[]');

      const resolved = questions.map(q => ({
        ...q,
        category_name: categories.find(c => c.id === q.category_id)?.name || 'Uncategorized'
      }));

      if (!includeDrafts) {
        return resolved.filter(q => q.status === 'Published');
      }
      return resolved;
    }
  },

  addQuestion: async (payload: Omit<Question, 'id' | 'upvotes' | 'downvotes' | 'created_at' | 'updated_at'>): Promise<Question> => {
    if (db.isLive()) {
      const { data, error } = await supabase!
        .from('questions')
        .insert([{
          question: payload.question,
          category_id: payload.category_id,
          difficulty: payload.difficulty,
          tags: payload.tags,
          url_1: payload.url_1,
          url_2: payload.url_2,
          status: payload.status,
          upvotes: 0,
          downvotes: 0
        }])
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const questions = JSON.parse(localStorage.getItem('g_questions') || '[]');
      const newQ: Question = {
        ...payload,
        id: generateUuid(),
        upvotes: 0,
        downvotes: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      questions.unshift(newQ);
      localStorage.setItem('g_questions', JSON.stringify(questions));
      return newQ;
    }
  },

  updateQuestion: async (id: string, payload: Partial<Question>): Promise<Question> => {
    if (db.isLive()) {
      const { data, error } = await supabase!
        .from('questions')
        .update({
          ...payload,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const questions: Question[] = JSON.parse(localStorage.getItem('g_questions') || '[]');
      const idx = questions.findIndex(q => q.id === id);
      if (idx === -1) throw new Error('Question not found');

      const updated: Question = {
        ...questions[idx],
        ...payload,
        updated_at: new Date().toISOString()
      };
      questions[idx] = updated;
      localStorage.setItem('g_questions', JSON.stringify(questions));
      return updated;
    }
  },

  deleteQuestion: async (id: string): Promise<boolean> => {
    if (db.isLive()) {
      const { error } = await supabase!.from('questions').delete().eq('id', id);
      if (error) throw error;
      return true;
    } else {
      // Delete question
      const questions: Question[] = JSON.parse(localStorage.getItem('g_questions') || '[]');
      const filteredQ = questions.filter(q => q.id !== id);
      localStorage.setItem('g_questions', JSON.stringify(filteredQ));

      // Cascade progress deletion
      const progress: UserProgress[] = JSON.parse(localStorage.getItem('g_progress') || '[]');
      const filteredP = progress.filter(p => p.question_id !== id);
      localStorage.setItem('g_progress', JSON.stringify(filteredP));

      // Cascade votes deletion
      const votes: UserVote[] = JSON.parse(localStorage.getItem('g_votes') || '[]');
      const filteredV = votes.filter(v => v.question_id !== id);
      localStorage.setItem('g_votes', JSON.stringify(filteredV));

      return true;
    }
  },

  resetQuestionStats: async (id: string): Promise<boolean> => {
    if (db.isLive()) {
      const { error } = await supabase!.from('questions').update({ upvotes: 0, downvotes: 0 }).eq('id', id);
      if (error) throw error;

      // Also clean up votes and progress associated
      await supabase!.from('user_votes').delete().eq('question_id', id);
      await supabase!.from('user_progress').delete().eq('question_id', id);
      return true;
    } else {
      // Reset votes on question
      await db.updateQuestion(id, { upvotes: 0, downvotes: 0 });

      // Remove votes and progress mapping
      const progress: UserProgress[] = JSON.parse(localStorage.getItem('g_progress') || '[]');
      localStorage.setItem('g_progress', JSON.stringify(progress.filter(p => p.question_id !== id)));

      const votes: UserVote[] = JSON.parse(localStorage.getItem('g_votes') || '[]');
      localStorage.setItem('g_votes', JSON.stringify(votes.filter(v => v.question_id !== id)));

      return true;
    }
  },

  // ==========================================
  // PROGRESS OPERATIONS
  // ==========================================

  getUserProgress: async (userId: string): Promise<UserProgress[]> => {
    // Proactively trigger background sync of any pending queue changes
    processSyncQueue().catch(console.error);

    let baseData: UserProgress[] = [];
    if (db.isLive()) {
      const { data, error } = await supabase!.from('user_progress').select('*').eq('user_id', userId);
      if (error) throw error;
      baseData = data || [];
    } else {
      const progress: UserProgress[] = JSON.parse(localStorage.getItem('g_progress') || '[]');
      baseData = progress.filter(p => p.user_id === userId);
    }

    // Overlay pending local write-ahead sync queue operations
    const queue: SyncQueueItem[] = JSON.parse(localStorage.getItem('g_sync_queue') || '[]');
    const pendingProgress = queue.filter(item => item.userId === userId && (item.type === 'toggle_progress' || item.type === 'save_notes'));
    pendingProgress.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    pendingProgress.forEach(item => {
      let existing = baseData.find(p => p.question_id === item.questionId);
      if (existing) {
        if (item.type === 'toggle_progress') {
          existing.status = item.payload.status;
          existing.updated_at = item.createdAt;
        } else if (item.type === 'save_notes') {
          existing.notes = item.payload.notes;
          existing.updated_at = item.createdAt;
        }
      } else {
        const newProg: UserProgress = {
          id: item.id,
          user_id: item.userId,
          question_id: item.questionId,
          status: item.type === 'toggle_progress' ? item.payload.status : 'none',
          notes: item.type === 'save_notes' ? item.payload.notes : '',
          updated_at: item.createdAt
        };
        baseData.push(newProg);
      }
    });

    return baseData;
  },

  getAllProgress: async (): Promise<UserProgress[]> => {
    processSyncQueue().catch(console.error);

    let baseData: UserProgress[] = [];
    if (db.isLive()) {
      const { data, error } = await supabase!.from('user_progress').select('*');
      if (error) throw error;
      baseData = data || [];
    } else {
      baseData = JSON.parse(localStorage.getItem('g_progress') || '[]') as UserProgress[];
    }

    // Overlay pending items
    const queue: SyncQueueItem[] = JSON.parse(localStorage.getItem('g_sync_queue') || '[]');
    const pendingProgress = queue.filter(item => item.type === 'toggle_progress' || item.type === 'save_notes');
    pendingProgress.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    pendingProgress.forEach(item => {
      let existing = baseData.find(p => p.user_id === item.userId && p.question_id === item.questionId);
      if (existing) {
        if (item.type === 'toggle_progress') {
          existing.status = item.payload.status;
          existing.updated_at = item.createdAt;
        } else if (item.type === 'save_notes') {
          existing.notes = item.payload.notes;
          existing.updated_at = item.createdAt;
        }
      } else {
        const newProg: UserProgress = {
          id: item.id,
          user_id: item.userId,
          question_id: item.questionId,
          status: item.type === 'toggle_progress' ? item.payload.status : 'none',
          notes: item.type === 'save_notes' ? item.payload.notes : '',
          updated_at: item.createdAt
        };
        baseData.push(newProg);
      }
    });

    return baseData;
  },

  toggleProgressStatus: async (userId: string, questionId: string, status: ProgressStatus): Promise<UserProgress> => {
    const timestamp = new Date().toISOString();

    // 1. Immediately write to Local Storage first to enable instant UI response
    const progress: UserProgress[] = JSON.parse(localStorage.getItem('g_progress') || '[]');
    const idx = progress.findIndex(p => p.user_id === userId && p.question_id === questionId);
    let resultProgress: UserProgress;

    if (idx !== -1) {
      progress[idx] = {
        ...progress[idx],
        status: status,
        updated_at: timestamp
      };
      localStorage.setItem('g_progress', JSON.stringify(progress));
      resultProgress = progress[idx];
    } else {
      resultProgress = {
        id: generateUuid(),
        user_id: userId,
        question_id: questionId,
        status: status,
        notes: '',
        updated_at: timestamp
      };
      progress.push(resultProgress);
      localStorage.setItem('g_progress', JSON.stringify(progress));
    }

    if (db.isLive()) {
      // 2. Wrap within write-ahead sync log entry
      const queue: SyncQueueItem[] = JSON.parse(localStorage.getItem('g_sync_queue') || '[]');
      queue.push({
        id: generateUuid(),
        type: 'toggle_progress',
        userId,
        questionId,
        payload: { status },
        createdAt: timestamp,
        attempts: 0
      });
      localStorage.setItem('g_sync_queue', JSON.stringify(queue));

      // 3. Initiate async sync handling (unblocking)
      processSyncQueue().catch(console.error);
    }

    return resultProgress;
  },

  saveNotes: async (userId: string, questionId: string, notes: string): Promise<UserProgress> => {
    const timestamp = new Date().toISOString();

    // 1. Immediately write to Local Storage for offline fallback support
    const progress: UserProgress[] = JSON.parse(localStorage.getItem('g_progress') || '[]');
    const idx = progress.findIndex(p => p.user_id === userId && p.question_id === questionId);
    let resultProgress: UserProgress;

    if (idx !== -1) {
      progress[idx] = {
        ...progress[idx],
        notes: notes,
        updated_at: timestamp
      };
      localStorage.setItem('g_progress', JSON.stringify(progress));
      resultProgress = progress[idx];
    } else {
      resultProgress = {
        id: generateUuid(),
        user_id: userId,
        question_id: questionId,
        status: 'none',
        notes: notes,
        updated_at: timestamp
      };
      progress.push(resultProgress);
      localStorage.setItem('g_progress', JSON.stringify(progress));
    }

    if (db.isLive()) {
      // 2. Wrap within write-ahead sync log entry
      const queue: SyncQueueItem[] = JSON.parse(localStorage.getItem('g_sync_queue') || '[]');
      queue.push({
        id: generateUuid(),
        type: 'save_notes',
        userId,
        questionId,
        payload: { notes },
        createdAt: timestamp,
        attempts: 0
      });
      localStorage.setItem('g_sync_queue', JSON.stringify(queue));

      // 3. Trigger async backlog worker
      processSyncQueue().catch(console.error);
    }

    return resultProgress;
  },

  resetUserStats: async (userId: string): Promise<boolean> => {
    if (db.isLive()) {
      const { error } = await supabase!.from('user_progress').delete().eq('user_id', userId);
      if (error) throw error;
      await supabase!.from('user_votes').delete().eq('user_id', userId);
      return true;
    } else {
      const progress: UserProgress[] = JSON.parse(localStorage.getItem('g_progress') || '[]');
      const filteredP = progress.filter(p => p.user_id !== userId);
      localStorage.setItem('g_progress', JSON.stringify(filteredP));

      const votes: UserVote[] = JSON.parse(localStorage.getItem('g_votes') || '[]');
      const filteredV = votes.filter(v => v.user_id !== userId);
      localStorage.setItem('g_votes', JSON.stringify(filteredV));

      return true;
    }
  },

  // ==========================================
  // VOTING OPERATIONS
  // ==========================================

  getUserVotes: async (userId: string): Promise<UserVote[]> => {
    processSyncQueue().catch(console.error);

    let baseData: UserVote[] = [];
    if (db.isLive()) {
      const { data, error } = await supabase!.from('user_votes').select('*').eq('user_id', userId);
      if (error) throw error;
      baseData = data || [];
    } else {
      const votes: UserVote[] = JSON.parse(localStorage.getItem('g_votes') || '[]');
      baseData = votes.filter(v => v.user_id === userId);
    }

    const queue: SyncQueueItem[] = JSON.parse(localStorage.getItem('g_sync_queue') || '[]');
    const pendingVotes = queue.filter(item => item.userId === userId && item.type === 'toggle_vote');
    pendingVotes.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    pendingVotes.forEach(item => {
      const idx = baseData.findIndex(v => v.question_id === item.questionId);
      const direction = item.payload.direction;
      if (direction === null) {
        if (idx !== -1) baseData.splice(idx, 1);
      } else {
        if (idx !== -1) {
          baseData[idx].vote = direction;
        } else {
          baseData.push({
            id: item.id,
            user_id: item.userId,
            question_id: item.questionId,
            vote: direction,
            created_at: item.createdAt
          });
        }
      }
    });

    return baseData;
  },

  getAllVotes: async (): Promise<UserVote[]> => {
    processSyncQueue().catch(console.error);

    let baseData: UserVote[] = [];
    if (db.isLive()) {
      const { data, error } = await supabase!.from('user_votes').select('*');
      if (error) throw error;
      baseData = data || [];
    } else {
      baseData = JSON.parse(localStorage.getItem('g_votes') || '[]') as UserVote[];
    }

    const queue: SyncQueueItem[] = JSON.parse(localStorage.getItem('g_sync_queue') || '[]');
    const pendingVotes = queue.filter(item => item.type === 'toggle_vote');
    pendingVotes.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    pendingVotes.forEach(item => {
      const idx = baseData.findIndex(v => v.user_id === item.userId && v.question_id === item.questionId);
      const direction = item.payload.direction;
      if (direction === null) {
        if (idx !== -1) baseData.splice(idx, 1);
      } else {
        if (idx !== -1) {
          baseData[idx].vote = direction;
        } else {
          baseData.push({
            id: item.id,
            user_id: item.userId,
            question_id: item.questionId,
            vote: direction,
            created_at: item.createdAt
          });
        }
      }
    });

    return baseData;
  },

  toggleVote: async (userId: string, questionId: string, direction: VoteType | null): Promise<void> => {
    const timestamp = new Date().toISOString();

    // 1. Immediately write to Local Storage first for offline fallback support
    const votes: UserVote[] = JSON.parse(localStorage.getItem('g_votes') || '[]');
    const idx = votes.findIndex(v => v.user_id === userId && v.question_id === questionId);

    if (direction === null) {
      if (idx !== -1) {
        votes.splice(idx, 1);
      }
    } else {
      if (idx !== -1) {
        votes[idx] = {
          ...votes[idx],
          vote: direction
        };
      } else {
        votes.push({
          id: generateUuid(),
          user_id: userId,
          question_id: questionId,
          vote: direction,
          created_at: timestamp
        });
      }
    }
    localStorage.setItem('g_votes', JSON.stringify(votes));

    // Recalculate local question counts
    const questions: Question[] = JSON.parse(localStorage.getItem('g_questions') || '[]');
    const qIdx = questions.findIndex(q => q.id === questionId);
    if (qIdx !== -1) {
      const qVotes = votes.filter(v => v.question_id === questionId);
      questions[qIdx].upvotes = qVotes.filter(v => v.vote === 'up').length;
      questions[qIdx].downvotes = qVotes.filter(v => v.vote === 'down').length;
      localStorage.setItem('g_questions', JSON.stringify(questions));
    }

    if (db.isLive()) {
      // 2. Wrap within write-ahead sync log entry
      const queue: SyncQueueItem[] = JSON.parse(localStorage.getItem('g_sync_queue') || '[]');
      queue.push({
        id: generateUuid(),
        type: 'toggle_vote',
        userId,
        questionId,
        payload: { direction },
        createdAt: timestamp,
        attempts: 0
      });
      localStorage.setItem('g_sync_queue', JSON.stringify(queue));

      // 3. Trigger async sync processing (unblocking)
      processSyncQueue().catch(console.error);
    }
  },

  // ==========================================
  // USERS / PROFILES OPERATIONS
  // ==========================================

  getProfiles: async (): Promise<Profile[]> => {
    if (db.isLive()) {
      const { data, error } = await supabase!.from('profiles').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } else {
      return JSON.parse(localStorage.getItem('g_profiles') || '[]') as Profile[];
    }
  },

  addProfile: async (payload: Omit<Profile, 'id' | 'created_at'>): Promise<Profile> => {
    if (db.isLive()) {
      // Create user auth requires service role key which we must not expose.
      // However, we can simulate profile insertion or explain the edge function as documented in PRD.
      // For standard client behavior, we insert the profile row. (Assumes they might have administrative trigger)
      const mockId = generateUuid();
      const { data, error } = await supabase!
        .from('profiles')
        .insert([{
          id: mockId,
          first_name: payload.first_name,
          last_name: payload.last_name,
          email: payload.email,
          role: payload.role || 'user'
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      const profiles: Profile[] = JSON.parse(localStorage.getItem('g_profiles') || '[]');
      if (profiles.some(p => p.email.toLowerCase() === payload.email.toLowerCase())) {
        throw new Error('A user with this email address already exists.');
      }

      const newProfile: Profile = {
        ...payload,
        id: generateUuid(),
        created_at: new Date().toISOString()
      };
      profiles.unshift(newProfile);
      localStorage.setItem('g_profiles', JSON.stringify(profiles));
      return newProfile;
    }
  },

  updateProfile: async (id: string, payload: Partial<Profile>): Promise<Profile> => {
    if (db.isLive()) {
      const { data, error } = await supabase!
        .from('profiles')
        .update(payload)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const profiles: Profile[] = JSON.parse(localStorage.getItem('g_profiles') || '[]');
      const idx = profiles.findIndex(p => p.id === id);
      if (idx === -1) throw new Error('User does not exist.');

      profiles[idx] = {
        ...profiles[idx],
        ...payload
      };
      localStorage.setItem('g_profiles', JSON.stringify(profiles));
      return profiles[idx];
    }
  },

  deleteProfile: async (id: string): Promise<boolean> => {
    if (db.isLive()) {
      const { error } = await supabase!.from('profiles').delete().eq('id', id);
      if (error) throw error;
      return true;
    } else {
      const profiles: Profile[] = JSON.parse(localStorage.getItem('g_profiles') || '[]');
      localStorage.setItem('g_profiles', JSON.stringify(profiles.filter(p => p.id !== id)));

      // Cascade progress
      const progress: UserProgress[] = JSON.parse(localStorage.getItem('g_progress') || '[]');
      localStorage.setItem('g_progress', JSON.stringify(progress.filter(p => p.user_id !== id)));

      // Cascade votes
      const votes: UserVote[] = JSON.parse(localStorage.getItem('g_votes') || '[]');
      localStorage.setItem('g_votes', JSON.stringify(votes.filter(v => v.user_id !== id)));

      return true;
    }
  }
};
