// /lib/preference-manager.ts

import { executeQuery } from '@/lib/db';
import { getCurrentUserFromToken } from '@/lib/auth/auth';

export async function saveUserPreference(
  key: string, 
  value: string, 
  token?: string
): Promise<void> {
  if (!value) {
    console.log('Attempted to save undefined preference');
    return;
  }

  const userId = await getCurrentUserFromToken(token);
  if (!userId) {
    console.error('User not authenticated');
    throw new Error('User not authenticated');
  }

  try {
    await executeQuery(
      `INSERT INTO user_preferences (user_id, preference_key, preference_value)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, preference_key) 
       DO UPDATE SET preference_value = $3`,
      [userId, key, value]
    );
    console.log('Preference saved successfully for user:', userId);
  } catch (error) {
    console.error('Error saving preference:', error);
    throw error;
  }
}

export async function getUserPreferences(token?: string): Promise<string[]> {
  console.log('Fetching user preferences');
  
  if (!token) {
    console.log('No token provided, returning empty preferences');
    return [];
  }

  const userId = await getCurrentUserFromToken(token);
  if (!userId) {
    console.log('No valid user ID found, returning empty preferences');
    return [];
  }

  try {
    const result = await executeQuery<{ preference_value: string }>(
      'SELECT preference_value FROM user_preferences WHERE user_id = $1',
      [userId]
    );
    const preferences = result.map(row => row.preference_value);
    console.log('Retrieved preferences for user:', userId, preferences);
    return preferences;
  } catch (error) {
    console.error('Error fetching preferences:', error);
    return []; // Return empty array instead of throwing
  }
}

export async function deleteUserPreference(preference: string, token?: string): Promise<void> {
  console.log('Attempting to delete user preference:', preference);
  const userId = await getCurrentUserFromToken(token);
  if (!userId) {
    console.error('User not authenticated');
    throw new Error('User not authenticated');
  }

  try {
    await executeQuery(
      `DELETE FROM user_preferences 
       WHERE user_id = $1 
       AND preference_value = $2`,
      [userId, preference]
    );
    console.log('Preference deleted successfully for user:', userId);
  } catch (error) {
    console.error('Error deleting preference:', error);
    throw error;
  }
}