// app/api/healthz/route.ts


import { NextResponse } from 'next/server';


export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';


export function GET() {
  try {
    // Here, you might check essential services or simply return an OK status
    return NextResponse.json({ status: 'healthy' });
  } catch (error) {
    console.error('Error during health check:', error);
    return NextResponse.json({ error: 'Health check failed' }, { status: 500 });
  }
}