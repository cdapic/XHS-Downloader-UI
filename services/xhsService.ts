import { XHSApiResponse } from '../types';
import { getDefaultApiUrl } from '../constants';

export const parseXHSLink = async (
  input: string,
): Promise<XHSApiResponse> => {
  // 同源 ${window.location.origin}/xhs/detail,由 nginx 反代到后端 5556。
  // Strip any trailing slash defensively: appending an extra `/` here used
  // to trigger FastAPI's 307 redirect, which CORS preflight explicitly
  // forbids and breaks cross-origin POST.
  const endpoint = getDefaultApiUrl().replace(/\/$/, '');

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