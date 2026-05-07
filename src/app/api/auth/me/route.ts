import { NextResponse } from 'next/server';
import axios from 'axios';

/**
 * Auth Me Proxy Route
 * Forwards GET requests to the backend to fetch current user profile.
 */
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const backendUrl = process.env.BACKEND_API_URL || 'https://whatsapp-platform-api-backend.onrender.com/api';
    
    console.log(`Proxying auth/me request to: ${backendUrl}/auth/me`);

    if (!authHeader) {
      return NextResponse.json({ message: 'Authorization header missing' }, { status: 401 });
    }

    const response = await axios.get(`${backendUrl}/auth/me`, {
      timeout: 60000,
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      }
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Proxy Auth Me Error:', error.response?.data || error.message);
    const status = error.response?.status || 500;
    
    // Return the actual error from backend if available
    return NextResponse.json(
      error.response?.data || { message: 'Internal Server Error fetching user profile' }, 
      { status }
    );
  }
}
