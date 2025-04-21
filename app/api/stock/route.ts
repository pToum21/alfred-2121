import { NextResponse } from 'next/server';

const API_BASE_URL = 'http://localhost:3007'; // Your API service URL

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  
  if (!symbol) {
    return NextResponse.json({ error: 'Missing symbol parameter' }, { status: 400 });
  }
  
  try {
    // Call your API service instead of Google CSE directly
    const response = await fetch(`${API_BASE_URL}/api/stocks?symbol=${symbol}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API responded with status ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching stock data:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch stock data',
      symbol,
      change: 0,
      formattedChange: '0.00'
    }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';