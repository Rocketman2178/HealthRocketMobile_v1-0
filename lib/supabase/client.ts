import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ConfigurationError } from '../errors';
import { retryWithBackoff } from '../utils';
import Constants from 'expo-constants';
interface ExtraConfig {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
}
const { SUPABASE_URL, SUPABASE_ANON_KEY } = Constants?.expoConfig?.extra as ExtraConfig;
let supabase:any;

try {
  if (!SUPABASE_URL?.startsWith('https://') || !SUPABASE_ANON_KEY) {
    throw new ConfigurationError(
      'Invalid Supabase configuration. Please check your environment variables:\n' +
      '- SUPABASE_URL should start with https://\n' +
      '- SUPABASE_ANON_KEY should not be empty'
    );
  }

  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storage: AsyncStorage, 
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        'x-client-info': 'health-rocket',
      },
      fetch: async (url, options) => {
        try {
          return await retryWithBackoff(() => fetch(url, options), {
            maxRetries: 3,
            initialDelay: 1000,
            maxDelay: 5000,
            shouldRetry: (error) => {
              return (
                error instanceof TypeError ||
                (error.status >= 500 && error.status < 600) ||
                error.name === 'TypeError' ||
                error.message === 'Failed to fetch'
              );
            },
          });
        } catch (error) {
          console.error('Global fetch error:', error);
          throw error; // Rethrow the error so that a Promise rejection occurs.
        }
      }
      ,
    },
  });
} catch (error) {
  console.error('Error initializing Supabase client:', error);
  // throw error;
}

export { supabase };
