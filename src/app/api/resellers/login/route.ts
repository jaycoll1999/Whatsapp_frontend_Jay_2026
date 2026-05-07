import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Use the backend URL from environment variables
    const backendUrl = process.env.BACKEND_API_URL || 'https://whatsapp-platform-api-backend.onrender.com/api';
    
    console.log(`Proxying login request to: ${backendUrl}/resellers/login`);

    const response = await axios.post(`${backendUrl}/resellers/login`, body, {
      timeout: 60000, // 60 seconds to handle Render cold starts
      headers: {
        'Content-Type': 'application/json',
      }
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Proxy Login Error:', error.response?.data || error.message);
    
    const status = error.response?.status || 500;
    const data = error.response?.data || { 
      message: error.code === 'ECONNABORTED' ? 'Backend request timed out (Cold Start)' : 'Internal Server Error' 
    };

    return NextResponse.json(data, { status });
  }
}
