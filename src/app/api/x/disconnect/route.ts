import { clearXSession } from '@/lib/x';
import { NextResponse, type NextRequest } from 'next/server';

async function disconnect(request: NextRequest) {
  await clearXSession();
  return NextResponse.redirect(new URL('/app/analytics?disconnected=1', request.url));
}

export async function GET(request: NextRequest) {
  return disconnect(request);
}

export async function POST(request: NextRequest) {
  return disconnect(request);
}
