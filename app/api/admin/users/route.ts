import { NextRequest, NextResponse } from 'next/server';
import { getUsers } from '@/lib/data';

export async function GET(request: NextRequest) {
  // 简单权限检查：实际应验证 admin token
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const users = getUsers();

    // 过滤敏感信息
    const safeUsers = users.map((user: any) => {
      const { password_hash, ...rest } = user;
      return rest;
    });

    // 按注册时间倒序
    safeUsers.sort((a: any, b: any) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return NextResponse.json({ users: safeUsers });
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}