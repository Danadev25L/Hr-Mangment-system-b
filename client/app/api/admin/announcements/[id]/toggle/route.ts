import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization');
    const body = await request.json();
    const { id } = params;
    
    const response = await fetch(`${BACKEND_URL}/api/admin/announcements/${id}/toggle`, {
      method: 'PATCH',
      headers: {
        'Authorization': token || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error toggling announcement:', error);
    return NextResponse.json(
      { message: 'Failed to toggle announcement status' },
      { status: 500 }
    );
  }
}
