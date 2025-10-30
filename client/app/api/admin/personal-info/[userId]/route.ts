import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const token = request.headers.get('authorization');
    const body = await request.json();
    const { userId } = await params;
    
    const response = await fetch(`${BACKEND_URL}/api/admin/personal-info/${userId}`, {
      method: 'PUT',
      headers: {
        'Authorization': token || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error updating personal info:', error);
    return NextResponse.json(
      { message: 'Failed to update personal info' },
      { status: 500 }
    );
  }
}
