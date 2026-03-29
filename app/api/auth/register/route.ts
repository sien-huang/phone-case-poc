import { NextRequest, NextResponse } from 'next/server';
import { createUser, getUserByEmail } from '@/lib/data';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, company, phone, country } = body;

    // 验证必填字段
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      );
    }

    // 邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // 密码强度：至少6位
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // 检查邮箱是否已注册
    const existing = getUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    // 创建用户
    const user = createUser({
      email,
      password,
      name,
      company,
      phone,
      country,
      role: 'customer',
    });

    // 返回安全信息（不包含密码哈希）
    const { password_hash, ...safeUser } = user;
    return NextResponse.json(
      { success: true, user: safeUser },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration failed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}