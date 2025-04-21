import { NextRequest, NextResponse } from 'next/server';

/**
 * Fetches economic data from FRED API with retry logic
 */
async function fetchWithRetry(url: string, options = {}, maxRetries = 3): Promise<any> {
  console.log(`[Server] Attempting fetch to ${url} (max retries: ${maxRetries})`);
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[Server] Fetch attempt ${attempt}/${maxRetries}`);
      const response = await fetch(url, options);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API responded with status ${response.status}: ${errorText}`);
      }
      const data = await response.json();
      console.log(`[Server] Fetch successful on attempt ${attempt}`);
      return data;
    } catch (error) {
      console.error(`[Server] Attempt ${attempt} failed:`, error);
      lastError = error;
      
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 8000);
        console.log(`[Server] Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

/**
 * Generate demo observations for a series
 */
function generateDemoObservations(title: string, startDate: Date, endDate: Date) {
  const observations = [];
  const currentDate = new Date(startDate.getTime());
  
  // Generate value based on indicator type
  const generateValue = (date: Date, index: number) => {
    switch (title) {
      case "GDP Growth":
        return 2.0 + Math.sin(index / 10) * 1.5;
      case "Unemployment Rate":
        return 4.0 + Math.sin(index / 12) * 1.0;
      case "Inflation Rate":
        return 2.5 + Math.cos(index / 8) * 1.2;
      case "Personal Income":
        return 20000 + Math.sin(index / 6) * 1000;
      case "Consumer Spending":
        return 15000 + Math.cos(index / 5) * 800;
      case "Job Openings":
        return 9000 + Math.sin(index / 4) * 1500;
      case "Housing Starts":
        return 1500 + Math.sin(index / 9) * 300;
      case "Building Permits":
        return 1700 + Math.cos(index / 7) * 350;
      case "New Home Sales":
        return 700 + Math.sin(index / 8) * 150;
      case "Existing Home Sales":
        return 5000 + Math.cos(index / 6) * 500;
      case "House Price Index":
        return 380 + Math.sin(index / 10) * 20;
      case "Mortgage Rate":
        return 4.5 + Math.sin(index / 12) * 0.8;
      case "Federal Funds Rate":
        return 2.0 + Math.cos(index / 15) * 1.0;
      case "10-Year Treasury":
        return 3.5 + Math.sin(index / 14) * 0.7;
      case "S&P 500":
        return 4000 + Math.sin(index / 5) * 200;
      case "VIX":
        return 18 + Math.cos(index / 3) * 8;
      default:
        return 100 + Math.sin(index / 10) * 20;
    }
  };
  
  let index = 0;
  while (currentDate <= endDate) {
    observations.push({
      date: currentDate.toISOString().split('T')[0],
      value: generateValue(currentDate, index)
    });
    
    // Move to next date (typically monthly for economic data)
    currentDate.setDate(currentDate.getDate() + 15);
    index++;
  }
  
  // Make sure we have at least 2 observations
  if (observations.length < 2) {
    observations.push({
      date: endDate.toISOString().split('T')[0],
      value: generateValue(endDate, 1)
    });
  }
  
  // Sort by date descending (newest first)
  return observations.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Generate a full set of demo data
 */
function generateDemoSeriesData(seriesList: Array<{id: string, title: string}>, startDate: Date, endDate: Date) {
  console.log(`[Server] Generating demo data for ${seriesList.length} series`);
  return seriesList.map(({id, title}) => {
    const observations = generateDemoObservations(title, startDate, endDate);
    const change = observations[0] && observations[1] ? 
      ((observations[0].value - observations[1].value) / observations[1].value) * 100 : 0;
    return {
      id,
      title,
      value: observations[0]?.value || 0,
      previousValue: observations[1]?.value || 0,
      change,
      monthOverMonthChange: change,
      yearOverYearChange: change * 2,
      observations,
      frequency: "Monthly",
      units: "Level",
      observation_start: startDate.toISOString().split('T')[0],
      observation_end: endDate.toISOString().split('T')[0],
      last_updated: endDate.toISOString().split('T')[0]
    };
  });
}

/**
 * GET handler for /api/fred 
 * Returns economic data from FRED API or falls back to generated demo data
 */
export async function GET(request: NextRequest) {
  console.log('[Server] GET /api/fred triggered');
  
  // Get timeframe from query parameters
  const searchParams = request.nextUrl.searchParams;
  const timeframe = searchParams.get('timeframe') || '6M';
  
  console.log(`[Server] Fetching FRED data for timeframe: ${timeframe}`);
  
  // Define the series IDs for economic data
  const seriesIds = [
    { id: "A191RL1Q225SBEA", title: "GDP Growth" },
    { id: "UNRATE", title: "Unemployment Rate" },
    { id: "CPIAUCSL", title: "Inflation Rate" },
    { id: "PI", title: "Personal Income" },
    { id: "PCE", title: "Consumer Spending" },
    { id: "JTSJOL", title: "Job Openings" },
    { id: "HOUST", title: "Housing Starts" },
    { id: "PERMIT", title: "Building Permits" },
    { id: "HSN1F", title: "New Home Sales" },
    { id: "EXHOSLUSM495S", title: "Existing Home Sales" },
    { id: "CSUSHPISA", title: "House Price Index" },
    { id: "MORTGAGE30US", title: "Mortgage Rate" },
    { id: "FEDFUNDS", title: "Federal Funds Rate" },
    { id: "DGS10", title: "10-Year Treasury" },
    { id: "SP500", title: "S&P 500" },
    { id: "VIXCLS", title: "VIX" }
  ];
  
  try {
    // Try to get data from external API service
    console.log('[Server] Attempting to fetch from external API');
    const apiUrl = `http://localhost:3007/api/fred/all?timeframe=${timeframe}`;
    
    try {
      const rawData = await fetchWithRetry(apiUrl, {}, 3);
      
      // Log exactly what we got
      console.log('[Server] Raw response type:', typeof rawData);
      console.log('[Server] Raw response keys:', rawData ? Object.keys(rawData) : 'no keys (null/undefined)');
      
      // Handle different potential formats
      let processedData;
      
      if (!rawData) {
        console.log('[Server] API returned null or undefined data, falling back to demo data');
        throw new Error('API returned null or undefined data');
      }
      
      if (Array.isArray(rawData)) {
        console.log('[Server] API returned array format directly');
        processedData = rawData;
      } else if (typeof rawData === 'object') {
        // The API is probably returning an object with data inside it
        console.log('[Server] API returned object format, attempting to extract data array');
        
        // Try to find an array in the response
        const possibleArrays = Object.entries(rawData)
          .filter(([_, value]) => Array.isArray(value))
          .map(([key, value]) => ({ key, length: (value as any[]).length }));
        
        console.log('[Server] Possible arrays in response:', possibleArrays);
        
        if (possibleArrays.length > 0) {
          // Use the largest array
          const largestArray = possibleArrays.sort((a, b) => b.length - a.length)[0];
          console.log(`[Server] Using array found at key "${largestArray.key}" with ${largestArray.length} items`);
          processedData = rawData[largestArray.key];
        } else if (rawData.data && typeof rawData.data === 'object') {
          // Maybe data is nested under a 'data' key but not as an array
          console.log('[Server] Found data object, converting to array format');
          processedData = Object.values(rawData.data);
        } else {
          // If the API is returning a single object when we expect an array,
          // we can wrap it in an array
          console.log('[Server] Converting single object to array');
          
          // If data has a 'series' property and it looks like our expected format
          if (rawData.series && Array.isArray(rawData.series)) {
            processedData = rawData.series;
          } else {
            // Last resort: wrap the entire object in an array
            processedData = [rawData];
          }
        }
      } else {
        console.log(`[Server] API returned unexpected format (${typeof rawData}), falling back to demo data`);
        throw new Error(`API returned unexpected format: ${typeof rawData}`);
      }
      
      // Final validation on our processed data
      if (!processedData || !Array.isArray(processedData)) {
        console.log('[Server] Failed to convert API response to array format');
        throw new Error('Could not convert API response to required array format');
      }
      
      if (processedData.length === 0) {
        console.log('[Server] Processed data is an empty array, falling back to demo data');
        throw new Error('Processed data is an empty array');
      }
      
      console.log(`[Server] Successfully processed data into array with ${processedData.length} items`);
      
      // Additional logging to debug the data structure
      console.log('[Server] First item sample:', processedData[0] ? JSON.stringify(processedData[0]).substring(0, 100) + '...' : 'No first item');
      
      return NextResponse.json(processedData, { status: 200 });
    } catch (fetchError) {
      console.error('[Server] Error processing API response:', fetchError);
      throw fetchError;
    }
  } catch (error) {
    console.log('[Server] Will generate demo data instead:', error instanceof Error ? error.message : 'Unknown error');
    
    // If external API fails, generate demo data as fallback
    const demoStartDate = new Date();
    demoStartDate.setFullYear(demoStartDate.getFullYear() - 1);
    const demoData = generateDemoSeriesData(seriesIds, demoStartDate, new Date());
    
    console.log(`[Server] Generated demo data with ${demoData.length} items`);
    console.log('[Server] First demo item sample:', demoData[0] ? JSON.stringify(demoData[0]).substring(0, 100) + '...' : 'No demo data generated');
    
    // Return demo data with a warning header
    return NextResponse.json(demoData, { 
      status: 200,
      headers: {
        'X-Data-Source': 'demo',
        'X-Error-Message': error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
}
