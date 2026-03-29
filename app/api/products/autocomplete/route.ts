import { NextRequest, NextResponse } from 'next/server';
import productsData from '@/data/products.json';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get('q')?.trim().toLowerCase();

  if (!q || q.length < 1) {
    return NextResponse.json([]);
  }

  // 限制返回数量
  const limit = 10;

  // 匹配产品名称、分类、描述
  const suggestions = productsData
    .filter(p => 
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.slug.toLowerCase().includes(q)
    )
    .map(p => ({
      id: p.id,
      name: p.name,
      category: p.category,
      priceRange: p.priceRange,
      slug: p.slug,
    }))
    .slice(0, limit);

  return NextResponse.json(suggestions);
}