import { NextResponse } from 'next/server';
import axios from 'axios';

/**
 * Generic Auth Proxy Route
 * Created as requested to handle potential refactors or direct auth calls.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const backendUrl = process.env.BACKEND_API_URL || 'https://whatsapp-platform-api-backend.onrender.com/api';
    
    // Default to resellers/login if not specified, or handle based on body
    const endpoint = body.type === 'business' ? 'busi_users/login' : 'resellers/login';
    
    console.log(`Proxying auth login request to: ${backendUrl}/${endpoint}`);

    const response = await axios.post(`${backendUrl}/${endpoint}`, body, {
      timeout: 60000,
      headers: {
        'Content-Type': 'application/json',
      }
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Proxy Auth Error:', error.response?.data || error.message);
    const status = error.response?.status || 500;
    return NextResponse.json(error.response?.data || { message: 'Internal Server Error' }, { status });
  }
}
