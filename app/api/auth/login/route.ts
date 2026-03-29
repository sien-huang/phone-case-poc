import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, verifyPassword, createSession, getSessions } from '@/lib/data';

// JWT 签名密钥（生产环境应使用环境变量）
const JWT_SECRET = process.env.JWT_SECRET || 'cloudwing-dev-secret-change-in-production';

// 生成 JWT（简化版，生产环境建议使用 jsonwebtoken 库）
function generateToken(userId: string): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = { sub: userId, iat: Math.floor(Date.now() / 1000) };
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = require('crypto')
    .createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

// 验证 JWT
function verifyToken(token: string): { sub: string } | null {
  try {
    const [encodedHeader, encodedPayload, signature] = token.split('.');
    const check = require('crypto')
      .createHmac('sha256', JWT_SECRET)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url');
    if (check !== signature) return null;

    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString());
    // 检查过期时间（payload 中有 exp 时可加）
    return payload;
  } catch (e) {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // 查找用户
    const user = getUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // 验证密码
    if (!verifyPassword(password, user.password_hash)) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // 生成 token
    const token = generateToken(user.id);

    // 创建会话记录
    const session = createSession(user.id, token, 24); // 24小时有效

    // 返回用户信息和 token
    const { password_hash, ...safeUser } = user;
    return NextResponse.json({
      success: true,
      user: safeUser,
      token,
      sessionId: session.id,
    });
  } catch (error) {
    console.error('Login failed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 可选：验证 token 中间件（用于保护路由）
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing token' }, { status: 401 });
  }

  const token = authHeader.substring(7);
  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  // 检查会话是否存在且未过期（可选，这里仅验证JWT）
  return NextResponse.json({ valid: true, userId: payload.sub });
}