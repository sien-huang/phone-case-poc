import { NextRequest, NextResponse } from 'next/server';
import { getUserById, getSessionByToken } from '@/lib/data';

const JWT_SECRET = process.env.JWT_SECRET || 'cloudwing-dev-secret-change-in-production';

function verifyToken(token: string): { sub: string } | null {
  try {
    const [encodedHeader, encodedPayload, signature] = token.split('.');
    const check = require('crypto')
      .createHmac('sha256', JWT_SECRET)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url');
    if (check !== signature) return null;

    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString());
    return payload;
  } catch (e) {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const token = authHeader.substring(7);
  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const userId = payload.sub;
  const user = getUserById(userId);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // 检查会话是否有效（可选）
  const session = getSessionByToken(token);
  if (!session) {
    return NextResponse.json({ error: 'Session expired' }, { status: 401 });
  }

  const { password_hash, ...safeUser } = user;
  return NextResponse.json({ user: safeUser });
}