import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { saveUserPreference, getUserPreferences, deleteUserPreference } from '@/lib/preference-manager';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { preference_key, preference_value } = await request.json();
    const token = cookies().get('token')?.value;

    await saveUserPreference(preference_key, preference_value, token);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving preference:', error);
    return NextResponse.json(
      { error: 'Failed to save preference' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const token = cookies().get('token')?.value;
    const preferences = await getUserPreferences(token);
    return NextResponse.json({ preferences });
  } catch (error) {
    console.error('Error getting preferences:', error);
    return NextResponse.json(
      { error: 'Failed to get preferences' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { preference } = await request.json();
    const token = cookies().get('token')?.value;

    await deleteUserPreference(preference, token);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting preference:', error);
    return NextResponse.json(
      { error: 'Failed to delete preference' },
      { status: 500 }
    );
  }
}