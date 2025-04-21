import { initializeDatabase } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST() {
  try {
    await initializeDatabase();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to initialize database:', error);
    return NextResponse.json({ error: 'Failed to initialize database' }, { status: 500 });
  }
} 