'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User {
  id: string;
  email: string;
  name: string;
  company?: string;
  phone?: string;
  country?: string;
  role: 'customer' | 'admin';
  created_at: string;
}

interface Inquiry {
  id: string;
  user_id?: string;
  status: string;
  created_at: string;
  summary: { totalQuantity: number; estimatedTotal?: number };
}

export default function AdminCustomersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [inquiriesMap, setInquiriesMap] = useState<Record<string, Inquiry[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ total: 0, active: 0 });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // 获取所有用户
      const usersRes = await fetch('/api/admin/users');
      if (!usersRes.ok) throw new Error('Failed to fetch users');
      const usersData = await usersRes.json();
      setUsers(usersData.users);

      // 获取所有询盘（用于统计）
      const inquiriesRes = await fetch('/api/inquiries?limit=1000');
      let inquiriesMapLocal: Record<string, Inquiry[]> = {};
      if (inquiriesRes.ok) {
        const data = await inquiriesRes.json();
        const map: Record<string, Inquiry[]> = {};
        data.inquiries.forEach((i: Inquiry) => {
          if (i.user_id) {
            if (!map[i.user_id]) map[i.user_id] = [];
            map[i.user_id].push(i);
          }
        });
        inquiriesMapLocal = map;
        setInquiriesMap(map);
      }

      setStats({
        total: usersData.users.length,
        active: Object.keys(inquiriesMapLocal).length,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getLastInquiry = (userId: string) => {
    const list = inquiriesMap[userId] || [];
    if (list.length === 0) return null;
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
            <p className="text-gray-600 mt-1">
              {stats.total} total · {stats.active} with inquiries
            </p>
          </div>
          <Link href="/admin" className="text-blue-600 hover:underline">
            ← Back to Admin
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {users.length === 0 ? (
          <div className="bg-white rounded-xl border p-12 text-center">
            <p className="text-gray-500">No customers yet.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Customer</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Company</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Inquiries</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Last Activity</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map((user) => {
                  const userInquiries = inquiriesMap[user.id] || [];
                  const lastInquiry = getLastInquiry(user.id);
                  return (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                          {user.phone && <p className="text-sm text-gray-500">{user.phone}</p>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-900">{user.company || '-'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                          {userInquiries.length}
                        </span>
                        {lastInquiry && (
                          <p className="text-xs text-gray-500 mt-1">
                            ${lastInquiry.summary.estimatedTotal?.toFixed(0) || '0'} est.
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {lastInquiry ? (
                          <div>
                            <p className="text-sm text-gray-900">
                              {new Date(lastInquiry.created_at).toLocaleDateString()}
                            </p>
                            <span className={`text-xs px-2 py-1 rounded ${
                              lastInquiry.status === 'quoted'
                                ? 'bg-green-100 text-green-800'
                                : lastInquiry.status === 'contacted'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {lastInquiry.status}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">No inquiries</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/admin/inquiries?user=${user.id}`}
                            className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
                          >
                            View Inquiries
                          </Link>
                          <a
                            href={`mailto:${user.email}`}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
                          >
                            Email
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}