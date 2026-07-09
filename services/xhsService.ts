import { XHSApiResponse } from '../types';
import { MOCK_RESPONSE, DEMO_API_KEY } from '../constants';

export const parseXHSLink = async (
  input: string, 
  baseUrl: string
): Promise<XHSApiResponse> => {
  
  // Demo Mode check
  if (baseUrl === DEMO_API_KEY || input.includes('demo')) {
    return new Promise((resolve) => {
      setTimeout(() => resolve(MOCK_RESPONSE), 800);
    });
  }

  // Strip any trailing slash the user may have typed so we always send
  // the exact path they configured (e.g. `http://host:5556/xhs/detail`).
  // Appending an extra `/` here used to trigger FastAPI's 307 redirect,
  // which CORS preflight explicitly forbids, breaking cross-origin POST.
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');
  const endpoint = cleanBaseUrl;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: input, // Send the raw share text
        download: false // We only want metadata first
      }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data: XHSApiResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Service Error:', error);
    throw error;
  }
};