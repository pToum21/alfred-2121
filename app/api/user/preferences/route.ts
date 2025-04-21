import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromRequestToken } from '@/lib/auth/auth';
import { executeQuery } from '@/lib/db';
import Logger from '@/lib/utils/logging';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  Logger.debug('[UserPreferences] Getting preferences');
  try {
    const user = await getCurrentUserFromRequestToken(request);
    if (!user) {
      Logger.debug('[UserPreferences] No authenticated user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const preferences = await executeQuery<{ preference_key: string; preference_value: string }>(
      'SELECT preference_key, preference_value FROM user_preferences WHERE user_id = $1',
      [user.id]
    );

    Logger.debug('[UserPreferences] Retrieved preferences', { 
      userId: user.id, 
      count: preferences.length 
    });

    return NextResponse.json({ preferences });

  } catch (error) {
    Logger.debug('[UserPreferences] Error getting preferences:', error);
    return NextResponse.json(
      { error: 'Failed to get preferences' }, 
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  Logger.debug('[UserPreferences] Starting to save preference');
  try {
    const user = await getCurrentUserFromRequestToken(request);
    if (!user) {
      Logger.debug('[UserPreferences] No authenticated user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { preference_key, preference_value } = await request.json();
    Logger.debug('[UserPreferences] Saving preference', { userId: user.id, preference_key, preference_value });

    await executeQuery(
      `INSERT INTO user_preferences (user_id, preference_key, preference_value)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, preference_key) 
       DO UPDATE SET preference_value = $3`,
      [user.id, preference_key, preference_value]
    );

    Logger.debug('[UserPreferences] Preference saved successfully');
    return NextResponse.json({ success: true });

  } catch (error) {
    Logger.debug('[UserPreferences] Error saving preference:', error);
    return NextResponse.json(
      { error: 'Failed to save preference' }, 
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  Logger.debug('[UserPreferences] Starting to delete preference');
  try {
    const user = await getCurrentUserFromRequestToken(request);
    if (!user) {
      Logger.debug('[UserPreferences] No authenticated user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { preference } = await request.json();
    Logger.debug('[UserPreferences] Deleting preference', { userId: user.id, preference });

    await executeQuery(
      `DELETE FROM user_preferences 
       WHERE user_id = $1 
       AND preference_value = $2`,
      [user.id, preference]
    );

    Logger.debug('[UserPreferences] Preference deleted successfully');
    return NextResponse.json({ success: true });

  } catch (error) {
    Logger.debug('[UserPreferences] Error deleting preference:', error);
    return NextResponse.json(
      { error: 'Failed to delete preference' }, 
      { status: 500 }
    );
  }
} 