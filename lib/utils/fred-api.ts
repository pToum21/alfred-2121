// lib/utils/fred-api.ts

import axios from 'axios'

export async function fetchFREDData(series: string, startDate?: string, endDate?: string) {
  const apiKey = process.env.FRED_API_KEY
  const baseUrl = 'https://api.stlouisfed.org/fred/series/observations'
  
  const params = new URLSearchParams({
    series_id: series,
    api_key: apiKey!,
    file_type: 'json',
    observation_start: startDate || '1776-07-04',
    observation_end: endDate || new Date().toISOString().split('T')[0],
  })

  try {
    const response = await axios.get(`${baseUrl}?${params.toString()}`)
    return response.data.observations
  } catch (error) {
    throw new Error('Failed to fetch FRED data')
  }
}

export async function fetchBLSData(seriesId: string, startYear?: string, endYear?: string, latest?: boolean) {
  const apiKey = process.env.BLS_API_KEY
  const baseUrl = 'https://api.bls.gov/publicAPI/v2/timeseries/data/'

  const payload: any = {
    seriesid: [seriesId],
    registrationkey: apiKey,
    catalog: true
  }

  if (latest) {
    payload.latest = true;
  } else {
    payload.startyear = startYear;
    payload.endyear = endYear;
  }

  try {
    const response = await axios.post(baseUrl, payload, {
      headers: { 'Content-Type': 'application/json' }
    })

    if (response.data.status !== 'REQUEST_SUCCEEDED') {
      throw new Error(`BLS API request failed: ${response.data.message}`);
    }

    const seriesData = response.data.Results.series[0];
    if (!seriesData || !seriesData.data) {
      throw new Error('No data found in BLS API response');
    }

    return {
      data: seriesData.data.map((item: any) => ({
        date: `${item.year}-${item.period.replace('M', '')}`,
        value: item.value
      })),
      seriesExplanation: seriesData.catalog?.series_title || 'No explanation available from BLS API'
    };
  } catch (error) {
    throw new Error('Failed to fetch BLS data')
  }
}

function constructBLSExplanation(seriesId: string): string {
  const parts = seriesId.match(/^(\w{2})(\w)(\d{2})(\d{6})(\d{2})$/);
  if (!parts) return seriesId;

  const [, survey, seasonal, supersector, industry, dataType] = parts;
  
  let explanation = `${survey} Survey, `;
  explanation += seasonal === 'U' ? 'Not Seasonally Adjusted, ' : 'Seasonally Adjusted, ';
  explanation += `Supersector ${supersector}, Industry ${industry}, `;
  explanation += `Data Type ${dataType}`;

  return explanation;
}