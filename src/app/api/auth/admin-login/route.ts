import { NextResponse } from 'next/server';
import axios from 'axios';

/**
 * Admin Login Proxy Route
 * Forwards POST requests to the backend for super admin authentication.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const backendUrl = process.env.BACKEND_API_URL || 'https://whatsapp-platform-api-backend.onrender.com/api';
    
    console.log(`Proxying admin-login request to: ${backendUrl}/auth/admin-login`);

    const response = await axios.post(`${backendUrl}/auth/admin-login`, body, {
      timeout: 60000, // 60 seconds to accommodate potential Render cold starts
      headers: {
        'Content-Type': 'application/json',
      }
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Proxy Admin Login Error:', error.response?.data || error.message);
    
    const status = error.response?.status || 500;
    const data = error.response?.data || { 
      message: error.code === 'ECONNABORTED' ? 'Backend request timed out (Cold Start)' : 'Internal Server Error' 
    };

    return NextResponse.json(data, { status });
  }
}
