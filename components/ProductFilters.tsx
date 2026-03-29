'use client';

import { useLocale } from '@/contexts/LocaleContext';
import productsData from '@/data/products.json';

interface ProductFiltersProps {
  t: (key: string) => string;
  minPrice: string;
  maxPrice: string;
  minMOQ: string;
  materials: string[];
  certifications: string[];
  onMinPriceChange: (value: string) => void;
  onMaxPriceChange: (value: string) => void;
  onMinMOQChange: (value: string) => void;
  onMaterialsChange: (values: string[]) => void;
  onCertificationsChange: (values: string[]) => void;
  onApply: () => void;
  onReset: () => void;
}

export default function ProductFilters({
  t,
  minPrice,
  maxPrice,
  minMOQ,
  materials,
  certifications,
  onMinPriceChange,
  onMaxPriceChange,
  onMinMOQChange,
  onMaterialsChange,
  onCertificationsChange,
  onApply,
  onReset,
}: ProductFiltersProps) {
  const allMaterials = [...new Set(productsData.map(p => p.material))].filter(Boolean).sort();
  const allCertifications = ['ISO 9001', 'BSCI', 'RoHS', 'CE', 'FDA'];

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg">{t('common.filter')}</h3>
        <button onClick={onReset} className="text-sm text-blue-600 hover:underline">
          {t('common.reset')}
        </button>
      </div>

      {/* 价格区间 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Price Range (USD)</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => onMinPriceChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <span>-</span>
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => onMaxPriceChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* MOQ */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Min MOQ (pcs)</label>
        <input
          type="number"
          placeholder="e.g. 500"
          value={minMOQ}
          onChange={(e) => onMinMOQChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* 材质 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Material</label>
        <div className="flex flex-wrap gap-2">
          {allMaterials.map(mat => (
            <button
              key={mat}
              onClick={() => {
                onMaterialsChange(
                  materials.includes(mat) ? materials.filter(m => m !== mat) : [...materials, mat]
                );
              }}
              className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                materials.includes(mat)
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
              }`}
            >
              {mat}
            </button>
          ))}
        </div>
      </div>

      {/* 认证 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Certifications</label>
        <div className="flex flex-wrap gap-2">
          {allCertifications.map(cert => (
            <button
              key={cert}
              onClick={() => {
                onCertificationsChange(
                  certifications.includes(cert) ? certifications.filter(c => c !== cert) : [...certifications, cert]
                );
              }}
              className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                certifications.includes(cert)
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
              }`}
            >
              {cert}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={onApply}
        className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
      >
        {t('common.filter')}
      </button>
    </div>
  );
}