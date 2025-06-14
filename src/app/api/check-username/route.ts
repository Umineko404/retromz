// src/app/api/check-username/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../firebase/server'; // Use your existing client config
import { collection, query, where, getDocs } from 'firebase/firestore';

interface RequestBody {
  username: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    const { username } = body;

    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    const trimmedUsername = username.trim();
    
    if (trimmedUsername.length < 3 || trimmedUsername.length > 20) {
      return NextResponse.json(
        { error: 'Username must be 3-20 characters' },
        { status: 400 }
      );
    }

    if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
      return NextResponse.json(
        { error: 'Username can only contain letters, numbers, and underscores' },
        { status: 400 }
      );
    }

    const q = query(
      collection(db, 'users'),
      where('username', '==', trimmedUsername)
    );
    
    const querySnapshot = await getDocs(q);
    const isAvailable = querySnapshot.empty;

    return NextResponse.json({ available: isAvailable });
    
  } catch (error) {
    console.error('Username check error:', error);
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      stack: error?.stack
    });
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}