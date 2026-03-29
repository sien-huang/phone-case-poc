'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useLocale } from '@/contexts/LocaleContext';
import productsData from '@/data/products.json';
import ProductFilters from '@/components/ProductFilters';

// 分页组件
function Pagination({ current, total, onChange }: { current: number; total: number; onChange: (page: number) => void }) {
  const pages = Array.from({ length: Math.ceil(total / 20) }, (_, i) => i + 1);

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      {pages.map(page => (
        <button
          key={page}
          onClick={() => onChange(page)}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            current === page
              ? 'bg-blue-600 text-white'
              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          {page}
        </button>
      ))}
    </div>
  );
}

export default function ProductsClient() {
  const { t } =useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL-derived filters (read-only from URL)
  const categoryFilter = searchParams.get('category') || '';
  const searchQuery = searchParams.get('search') || '';

  // Local state for filters (controlled inputs)
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [minMOQ, setMinMOQ] = useState(searchParams.get('minMOQ') || '');
  const [materials, setMaterials] = useState<string[]>(searchParams.get('materials')?.split(',').filter(Boolean) || []);
  const [certifications, setCertifications] = useState<string[]>(searchParams.get('certifications')?.split(',').filter(Boolean) || []);

  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const pageSize = 20;

  // Sync local state when URL params change (e.g., navigation)
  useEffect(() => {
    setMinPrice(searchParams.get('minPrice') || '');
    setMaxPrice(searchParams.get('maxPrice') || '');
    setMinMOQ(searchParams.get('minMOQ') || '');
    setMaterials(searchParams.get('materials')?.split(',').filter(Boolean) || []);
    setCertifications(searchParams.get('certifications')?.split(',').filter(Boolean) || []);
    setCurrentPage(1); // reset to page 1 when filters change
  }, [searchParams]);

  // 计算产品价格范围（从 price_tiers 提取）
  const getPriceRange = (product: any) => {
    if (product.price_tiers && product.price_tiers.length > 0) {
      const prices = product.price_tiers.map((t: any) => t.price);
      return {
        min: Math.min(...prices),
        max: Math.max(...prices)
      };
    }
    // fallback：从 priceRange 字符串解析
    const match = product.priceRange?.match(/\$?([\d.]+)/g);
    if (match && match.length >= 2) {
      return { min: parseFloat(match[0].replace('$', '')), max: parseFloat(match[1].replace('$', '')) };
    }
    return { min: 0, max: 0 };
  };

  // 筛选逻辑
  const filteredProducts = useMemo(() => {
    return productsData.filter(p => {
      const matchCategory = !categoryFilter || p.category === categoryFilter;
      const matchSearch = !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.slug.toLowerCase().includes(searchQuery.toLowerCase());
      const priceRange = getPriceRange(p);
      const matchMinPrice = !minPrice || priceRange.min >= parseFloat(minPrice);
      const matchMaxPrice = !maxPrice || priceRange.max <= parseFloat(maxPrice);
      const matchMOQ = !minMOQ || p.moq >= parseInt(minMOQ);
      const matchMaterials = materials.length === 0 || materials.includes(p.material);
      const matchCerts = certifications.length === 0 || ((p as any).certifications && certifications.every(c => (p as any).certifications.includes(c)));
      return matchCategory && matchSearch && matchMinPrice && matchMaxPrice && matchMOQ && matchMaterials && matchCerts;
    });
  }, [categoryFilter, searchQuery, minPrice, maxPrice, minMOQ, materials, certifications]);

  // 分页逻辑
  const totalPages = Math.ceil(filteredProducts.length / pageSize);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const applyFilters = () => {
    const params = new URLSearchParams();
    params.set('search', searchQuery);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (minMOQ) params.set('minMOQ', minMOQ);
    if (materials.length > 0) params.set('materials', materials.join(','));
    if (certifications.length > 0) params.set('certifications', certifications.join(','));
    params.set('page', '1');
    router.push(`/products?${params.toString()}`);
  };

  const resetFilters = () => {
    setMinPrice('');
    setMaxPrice('');
    setMinMOQ('');
    setMaterials([]);
    setCertifications([]);
    const params = new URLSearchParams();
    params.set('search', searchQuery);
    params.set('page', '1');
    router.push(`/products?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <section className="bg-gray-50 py-12 border-b">
        <div className="container">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {categoryFilter ? categoryFilter : t('product.list')}
              </h1>
              <p className="text-gray-600 mt-1">
                {filteredProducts.length} {t('common.noData').toLowerCase() === '暂无数据' ? 'products found' : `products found`}
                {categoryFilter && ` in ${categoryFilter}`}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-300 p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1 rounded text-sm font-medium ${
                    viewMode === 'grid' ? 'bg-blue-100 text-blue-700' : 'text-gray-600'
                  }`}
                >
                  {t('common.grid') || 'Grid'}
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1 rounded text-sm font-medium ${
                    viewMode === 'list' ? 'bg-blue-100 text-blue-700' : 'text-gray-600'
                  }`}
                >
                  {t('common.list') || 'List'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 筛选 + 产品列表 */}
      <div className="container grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1">
          <ProductFilters
            t={t}
            minPrice={minPrice}
            maxPrice={maxPrice}
            minMOQ={minMOQ}
            materials={materials}
            certifications={certifications}
            onMinPriceChange={setMinPrice}
            onMaxPriceChange={setMaxPrice}
            onMinMOQChange={setMinMOQ}
            onMaterialsChange={setMaterials}
            onCertificationsChange={setCertifications}
            onApply={applyFilters}
            onReset={resetFilters}
          />
        </aside>
        <main className="lg:col-span-3">
          <section className="section">
            <div className="container">
              {paginatedProducts.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-gray-500 text-lg">No products found.</p>
                  <Link href="/products" className="text-blue-600 hover:underline mt-2 inline-block">
                    Clear filters
                  </Link>
                </div>
              ) : (
                <>
                  {viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {paginatedProducts.map(product => (
                        <Link
                          href={`/product/${product.id}`}
                          key={product.id}
                          className="group bg-white rounded-xl overflow-hidden border border-gray-200 hover:shadow-lg hover:border-blue-300 transition-all duration-200"
                        >
                          <div className="aspect-square bg-gray-100 relative overflow-hidden">
                            <img
                              src={`https://picsum.photos/seed/${product.id}/400/400`}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="p-4">
                            <span className="text-xs font-semibold text-blue-600 uppercase">
                              {product.category}
                            </span>
                            <h3 className="font-bold text-lg mt-1 mb-2 text-gray-900 group-hover:text-blue-600 line-clamp-2">
                              {product.name}
                            </h3>
                            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                              {product.description}
                            </p>
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-base font-bold text-gray-900">
                                {product.priceRange}
                              </span>
                              <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-600">
                                MOQ: {product.moq}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>📦 {product.leadTime}</span>
                              <span className="text-blue-600 font-medium group-hover:underline">
                                View Details →
                              </span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {paginatedProducts.map(product => (
                        <Link
                          href={`/product/${product.id}`}
                          key={product.id}
                          className="group flex items-start gap-6 p-6 bg-white rounded-xl border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all"
                        >
                          <div className="w-32 h-32 flex-shrink-0 rounded-lg bg-gray-100 overflow-hidden">
                            <img
                              src={`https://picsum.photos/seed/${product.id}/200/200`}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <span className="text-xs font-semibold text-blue-600 uppercase">
                                  {product.category}
                                </span>
                                <h3 className="font-bold text-xl mt-1 text-gray-900 group-hover:text-blue-600">
                                  {product.name}
                                </h3>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="text-xl font-bold text-gray-900">{product.priceRange}</p>
                                <p className="text-sm text-gray-500">MOQ: {product.moq} pcs</p>
                              </div>
                            </div>
                            <p className="text-gray-600 mt-3 line-clamp-2">
                              {product.description}
                            </p>
                            <div className="flex items-center gap-6 mt-4 text-sm text-gray-500">
                              <span>📦 {product.leadTime}</span>
                              <span>Material: {product.material}</span>
                              <span className="text-blue-600 font-medium">View Details →</span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </section>

          {/* Pagination */}
          {totalPages > 1 && (
            <section className="section bg-gray-50">
              <div className="container">
                <Pagination
                  current={currentPage}
                  total={filteredProducts.length}
                  onChange={handlePageChange}
                />
              </div>
            </section>
          )}

          {/* Back to Home */}
          <section className="section">
            <div className="container text-center">
              <Link
                href="/"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                ← Back to Home
              </Link>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}