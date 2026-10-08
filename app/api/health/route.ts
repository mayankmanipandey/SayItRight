import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    { status: 'ok', service: 'say-it-right' },
    { status: 200 }
  );
}
