import { getProducts, getCategories } from '@/lib/data';

describe('Data utilities', () => {
  it('getProducts returns an array with items', () => {
    const products = getProducts();
    expect(Array.isArray(products)).toBe(true);
    expect(products.length).toBeGreaterThan(0);
  });

  it('getCategories returns an array', () => {
    const categories = getCategories();
    expect(Array.isArray(categories)).toBe(true);
    expect(categories.length).toBeGreaterThan(0);
  });
});
