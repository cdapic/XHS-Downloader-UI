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

  // Ensure trailing slash for cleanness, though we construct url carefully
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');
  
  // Based on standard implementation of similar tools, usually it's a POST to root or /api
  // We will assume POST to /download or / based on common patterns, 
  // but looking at the PRD "python main.py api" typically runs a server.
  // We'll try a generic endpoint structure. 
  // Given the PRD doesn't specify the exact path, we will use the root if not specified.
  
  const endpoint = `${cleanBaseUrl}/`;

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