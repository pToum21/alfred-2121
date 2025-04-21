// /lib/utils/api-calls.ts

import axios from 'axios';

export async function callGovAPI(endpoint: string, parameters: Record<string, any>) {
  const baseUrl = 'https://api.data.gov';
  const apiKey = process.env.GOV_API_KEY;

  try {
    const response = await axios.get(`${baseUrl}${endpoint}`, {
      params: { ...parameters, api_key: apiKey }
    });
    return response.data;
  } catch (error) {
    console.error('Error calling .gov API:', error);
    throw error;
  }
}

export async function callFREDAPI(endpoint: string, parameters: Record<string, any>) {
  const baseUrl = 'https://api.stlouisfed.org/fred';
  const apiKey = process.env.FRED_API_KEY;

  try {
    const response = await axios.get(`${baseUrl}${endpoint}`, {
      params: { ...parameters, api_key: apiKey }
    });
    return response.data;
  } catch (error) {
    console.error('Error calling FRED API:', error);
    throw error;
  }
}