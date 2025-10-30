import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get('authorization');
    const body = await request.json();
    const { id } = await context.params;
    
    const response = await fetch(`${BACKEND_URL}/api/admin/expenses/${id}/status`, {
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
    console.error('Error updating expense status:', error);
    return NextResponse.json(
      { message: 'Failed to update expense status' },
      { status: 500 }
    );
  }
}
