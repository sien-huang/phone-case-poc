'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useLocale } from '@/contexts/LocaleContext';
import productsData from '@/data/products.json';

export default function HomeClient() {
  const { t } = useLocale();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 获取显示价格范围
  const getDisplayPrice = (product: any) => {
    return product.priceRange || (product.price_tiers && product.price_tiers.length > 0)
      ? `$${product.price_tiers[0].price} - $${product.price_tiers[product.price_tiers.length - 1].price}`
      : 'Contact for price';
  };

  const latestProducts = [...productsData]
    .sort((a, b) => {
      const timeA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
      const timeB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
      if (timeB !== timeA) return timeB - timeA;
      return a.id.localeCompare(b.id);
    })
    .slice(0, 8);

  const hotProducts = [...productsData]
    .map(p => ({
      ...p,
      score: (p.viewCount || 0) * 0.4 + (p.salesCount || 0) * 0.6,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  const categories = [...new Set(productsData.map(p => p.category))]
    .map(name => ({
      name,
      count: productsData.filter(p => p.category === name).length,
    }))
    .sort((a, b) => b.count - a.count);

  // 自动补全请求（防抖）
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length >= 1) {
        const res = await fetch(`/api/products/autocomplete?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setSuggestions(data);
      } else {
        setSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // 点击外部关闭建议
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-white py-16 md:py-24 border-b">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
              {t('common.home')}
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              CloudWing (云翼智造) — OEM manufacturer with original designs for global brands.
            </p>

            {/* 核心搜索框 */}
            <div className="max-w-2xl mx-auto relative" ref={containerRef}>
              <form action="/products" method="get" className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  name="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder={t('common.search') + ', e.g., iPhone 15, leather...'}
                  className="w-full px-6 py-4 text-lg border-2 border-gray-200 rounded-full focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                />
                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition-colors">
                  {t('common.search')}
                </button>
              </form>

              {/* 自动补全下拉列表 */}
              {showSuggestions && suggestions.length > 0 && (
                <ul className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                  {suggestions.map((s) => (
                    <li key={s.id}>
                      <a
                        href={`/products?search=${encodeURIComponent(query)}`}
                        className="block px-6 py-3 hover:bg-blue-50 transition-colors"
                        onClick={() => {
                          setQuery('');
                          setShowSuggestions(false);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900">{s.name}</span>
                          <span className="text-xs text-gray-500">{s.category}</span>
                        </div>
                      </a>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm text-gray-500">
                <span>Popular:</span>
                {['iPhone 15', 'Samsung S25', 'leather', 'custom'].map(tag => (
                  <a key={tag} href={`/products?search=${tag}`} className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200">
                    {tag}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Arrivals */}
      <section className="section bg-gray-50">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">{t('home.latest')}</h2>
            <span className="text-sm text-gray-500">Just in this week</span>
          </div>

          <div className="relative">
            {/* Scroll hint (fade edges) */}
            <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-gray-50 to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-gray-50 to-transparent z-10 pointer-events-none" />

            <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide snap-x">
              {latestProducts.map((product) => (
                <Link href={`/product/${product.id}`} key={product.id} className="flex-shrink-0 w-64 group snap-center">
                  <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
                    <div className="h-48 bg-gray-100 relative overflow-hidden">
                      <img
                        src={`https://picsum.photos/seed/${product.id}/400/300`}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-5">
                      <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                        {product.category}
                      </span>
                      <h3 className="font-bold text-lg mt-1 mb-2 text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {product.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {product.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-900">
                          {product.priceRange || getDisplayPrice(product)}
                        </span>
                        <span className="text-xs text-gray-500">
                          MOQ: {product.moq}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Hot Picks */}
      <section className="section">
        <div className="container">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{t('home.hot')}</h2>
            <p className="text-gray-500 hidden md:block">Best sellers & trending designs</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {hotProducts.map((product) => (
              <Link href={`/product/${product.id}`} key={product.id} className="group block">
                <article className="bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300">
                  <div className="aspect-[16/10] bg-gray-100 relative overflow-hidden">
                    <img
                      src={`https://picsum.photos/seed/${product.id}/800/500`}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-8">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-semibold text-blue-600 uppercase tracking-wide">
                        {product.category}
                      </span>
                      <span className="bg-red-50 text-red-600 text-xs font-semibold px-3 py-1 rounded-full">
                        🔥 Popular
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold mb-4 text-gray-900 group-hover:text-blue-600 transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-gray-600 mb-6 leading-relaxed max-w-xl">
                      {product.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xl font-bold text-gray-900">{product.priceRange || getDisplayPrice(product)}</p>
                        <p className="text-sm text-gray-500">Starting from</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">MOQ: {product.moq} pcs</p>
                        <p className="text-sm text-gray-500">Lead time: {product.leadTime}</p>
                      </div>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="section bg-gray-50">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">{t('common.categories')}</h2>
            <p className="text-gray-600">20+ product categories to explore</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {categories.map((cat) => (
              <Link href={`/products?category=${encodeURIComponent(cat.name)}`} key={cat.name} className="bg-white p-5 rounded-xl hover:bg-blue-50 hover:shadow-md transition-all group text-center">
                <h3 className="font-medium text-gray-900 mb-1 group-hover:text-blue-600 transition-colors text-sm md:text-base">
                  {cat.name}
                </h3>
                <p className="text-xs text-gray-500">
                  {cat.count} products
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="section bg-white">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Why CloudWing?</h2>
            <p className="text-gray-600">Trusted by brands worldwide for quality and reliability</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center p-6 bg-gray-50 rounded-xl hover:shadow-md transition-shadow">
              <div className="text-4xl mb-4">🏭</div>
              <h3 className="font-bold text-lg mb-2">Direct Manufacturer</h3>
              <p className="text-gray-600 text-sm">Own factory in Shenzhen with competitive pricing and full quality control.</p>
            </div>
            <div className="text-center p-6 bg-gray-50 rounded-xl hover:shadow-md transition-shadow">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="font-bold text-lg mb-2">Fast Sampling</h3>
              <p className="text-gray-600 text-sm">3-5 business days for prototype samples before mass production.</p>
            </div>
            <div className="text-center p-6 bg-gray-50 rounded-xl hover:shadow-md transition-shadow">
              <Link href="/certifications" className="block hover:no-underline">
                <div className="text-4xl mb-4">✅</div>
                <h3 className="font-bold text-lg mb-2 text-blue-600">Certified Quality</h3>
                <p className="text-gray-600 text-sm">ISO 9001, BSCI, RoHS compliant. <span className="text-blue-600">View certificates →</span></p>
              </Link>
            </div>
          </div>

          {/* About Preview */}
          <div className="mt-16 text-center">
            <h3 className="text-xl font-bold mb-4">Learn More About Us</h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Discover our story, manufacturing capabilities, and commitment to quality.
            </p>
            <Link href="/about" className="inline-block bg-blue-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-blue-700 transition-colors">
              About CloudWing
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section bg-gray-900 text-white">
        <div className="container text-center py-16">
          <h2 className="text-3xl font-bold mb-4">Start Your Wholesale Order</h2>
          <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
            Download catalog or request a custom quote. We respond within 24 hours.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/quote" className="bg-blue-600 text-white px-8 py-4 rounded-full font-semibold hover:bg-blue-700 transition-colors">
              Get Free Quote
            </Link>
            <a href="/catalog" className="border-2 border-gray-600 text-gray-300 px-8 py-4 rounded-full font-semibold hover:border-white hover:text-white transition-colors">
              Download Catalog
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}