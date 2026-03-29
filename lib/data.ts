import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

const DATA_DIR = join(process.cwd(), 'data')
const PRODUCTS_FILE = join(DATA_DIR, 'products.json')
const INQUIRIES_FILE = join(DATA_DIR, 'inquiries.json')
const CATEGORIES_FILE = join(DATA_DIR, 'categories.json')
const USERS_FILE = join(DATA_DIR, 'users.json')
const SESSIONS_FILE = join(DATA_DIR, 'sessions.json')
const ORDERS_FILE = join(DATA_DIR, 'orders.json')

// Ensure data directory exists
if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true })
}

// Helper: Read products
export function getProducts(): any[] {
  try {
    if (!existsSync(PRODUCTS_FILE)) return []
    const content = readFileSync(PRODUCTS_FILE, 'utf-8')
    return JSON.parse(content)
  } catch (error) {
    console.error('Failed to read products:', error)
    return []
  }
}

// Helper: Get product by ID
export function getProductById(id: string): any | undefined {
  const products = getProducts()
  return products.find(p => p.id === id)
}

// Helper: Create product
export function createProduct(product: any): void {
  const products = getProducts()
  products.push(product)
  writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2))
}

// Helper: Update product
export function updateProduct(id: string, updates: any): boolean {
  const products = getProducts()
  const index = products.findIndex(p => p.id === id)
  if (index === -1) return false
  
  products[index] = { ...products[index], ...updates }
  writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2))
  return true
}

// Helper: Delete product (soft delete by setting is_active = 0)
export function deleteProduct(id: string): boolean {
  const products = getProducts()
  const index = products.findIndex(p => p.id === id)
  if (index === -1) return false
  
  products[index].is_active = 0
  writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2))
  return true
}

// Helper: Get inquiries
export function getInquiries(): any[] {
  try {
    if (!existsSync(INQUIRIES_FILE)) return []
    const content = readFileSync(INQUIRIES_FILE, 'utf-8')
    const inquiries = JSON.parse(content)
    // Sort by date descending
    return inquiries.sort((a: any, b: any) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
  } catch (error) {
    console.error('Failed to read inquiries:', error)
    return []
  }
}

// Alias for API compatibility
export const readInquiries = getInquiries;

// Helper: Create inquiry
export function createInquiry(inquiry: any): void {
  const inquiries = getInquiries()
  inquiries.push(inquiry)
  writeFileSync(INQUIRIES_FILE, JSON.stringify(inquiries, null, 2))
}

// ==================== Categories ====================

// Helper: Get categories (with optional include_products flag)
export function getCategories(includeProducts: boolean = false): any[] {
  try {
    // First, try to read from categories.json
    if (existsSync(CATEGORIES_FILE)) {
      const content = readFileSync(CATEGORIES_FILE, 'utf-8')
      return JSON.parse(content)
    }

    // Fallback: extract unique categories from products
    const products = getProducts()
    const categorySet = new Set(products.map(p => p.category).filter(Boolean))
    const categories = Array.from(categorySet).map(name => ({
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name,
      description: '',
      order: 0,
      is_active: 1,
      product_count: products.filter(p => p.category === name).length,
      ...(includeProducts && { products: products.filter(p => p.category === name) })
    }))

    // Auto-save for future use
    writeFileSync(CATEGORIES_FILE, JSON.stringify(categories, null, 2))
    return categories
  } catch (error) {
    console.error('Failed to read categories:', error)
    return []
  }
}

// Helper: Get category by ID
export function getCategoryById(id: string): any | undefined {
  const categories = getCategories()
  return categories.find(c => c.id === id)
}

// Helper: Get category by name
export function getCategoryByName(name: string): any | undefined {
  const categories = getCategories()
  return categories.find(c => c.name === name)
}

// Helper: Create category
export function createCategory(category: any): void {
  const categories = getCategories()
  category.id = category.id || category.name.toLowerCase().replace(/\s+/g, '-')
  category.order = category.order || 0
  category.is_active = category.is_active !== undefined ? category.is_active : 1
  category.product_count = 0
  categories.push(category)
  writeFileSync(CATEGORIES_FILE, JSON.stringify(categories, null, 2))
}

// Helper: Update category
export function updateCategory(id: string, updates: any): boolean {
  const categories = getCategories()
  const index = categories.findIndex(c => c.id === id)
  if (index === -1) return false
  
  categories[index] = { ...categories[index], ...updates }
  writeFileSync(CATEGORIES_FILE, JSON.stringify(categories, null, 2))
  
  // Update product counts if name changed
  if (updates.name && updates.name !== categories[index].name) {
    const products = getProducts()
    for (const product of products) {
      if (product.category === categories[index].name) {
        product.category = updates.name
      }
    }
    writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2))
    // Update category count
    categories[index].product_count = products.filter(p => p.category === updates.name).length
    writeFileSync(CATEGORIES_FILE, JSON.stringify(categories, null, 2))
  }
  
  return true
}

// Helper: Delete category (soft delete)
export function deleteCategory(id: string): boolean {
  const categories = getCategories()
  const index = categories.findIndex(c => c.id === id)
  if (index === -1) return false

  categories[index].is_active = 0
  writeFileSync(CATEGORIES_FILE, JSON.stringify(categories, null, 2))
  return true
}

// Helper: Write inquiries (used for updates)
export function writeInquiries(inquiries: any[]): void {
  writeFileSync(INQUIRIES_FILE, JSON.stringify(inquiries, null, 2))
}

// ==================== Users ====================

export interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  company?: string;
  phone?: string;
  country?: string;
  role: 'customer' | 'admin';
  created_at: string;
  updated_at: string;
}

export function getUsers(): User[] {
  try {
    if (!existsSync(USERS_FILE)) return [];
    const content = readFileSync(USERS_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Failed to read users:', error);
    return [];
  }
}

export function getUserByEmail(email: string): User | undefined {
  const users = getUsers();
  return users.find(u => u.email.toLowerCase() === email.toLowerCase());
}

export function getUserById(id: string): User | undefined {
  const users = getUsers();
  return users.find(u => u.id === id);
}

export function createUser(userData: Partial<User> & { email: string; password: string }): User {
  const users = getUsers();
  const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();

  // 密码哈希（简化版：生产环境请使用 bcrypt/scrypt）
  const crypto = require('crypto');
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(userData.password, salt, 1000, 64, 'sha512').toString('hex');
  const password_hash = `${salt}:${hash}`;

  const newUser: User = {
    id,
    email: userData.email,
    password_hash,
    name: userData.name || '',
    company: userData.company,
    phone: userData.phone,
    country: userData.country,
    role: userData.role || 'customer',
    created_at: now,
    updated_at: now,
  };

  users.push(newUser);
  writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  return newUser;
}

export function updateUser(id: string, updates: Partial<User>): boolean {
  const users = getUsers();
  const index = users.findIndex(u => u.id === id);
  if (index === -1) return false;

  users[index] = { ...users[index], ...updates, updated_at: new Date().toISOString() };
  writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  return true;
}

export function verifyPassword(plain: string, stored: string): boolean {
  const crypto = require('crypto');
  const [salt, hash] = stored.split(':');
  const calculated = crypto.pbkdf2Sync(plain, salt, 1000, 64, 'sha512').toString('hex');
  // 时间常数比较，防止时序攻击
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(calculated));
}

// ==================== Sessions ====================

export interface Session {
  id: string;
  user_id: string;
  token: string; // JWT 或随机 token
  created_at: string;
  expires_at: string;
  last_activity_at: string;
}

export function getSessions(): Session[] {
  try {
    if (!existsSync(SESSIONS_FILE)) return [];
    const content = readFileSync(SESSIONS_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Failed to read sessions:', error);
    return [];
  }
}

export function getSessionByToken(token: string): Session | undefined {
  const sessions = getSessions();
  const session = sessions.find(s => s.token === token && new Date(s.expires_at) > new Date());
  if (!session) return undefined;

  // 更新最后活动时间
  session.last_activity_at = new Date().toISOString();
  writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2));
  return session;
}

export function createSession(userId: string, token: string, ttlHours: number = 24): Session {
  const sessions = getSessions();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlHours * 60 * 60 * 1000).toISOString();

  const session: Session = {
    id: `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    user_id: userId,
    token,
    created_at: now.toISOString(),
    expires_at: expiresAt,
    last_activity_at: now.toISOString(),
  };

  sessions.push(session);
  writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2));
  return session;
}

export function deleteSession(token: string): boolean {
  const sessions = getSessions();
  const index = sessions.findIndex(s => s.token === token);
  if (index === -1) return false;
  sessions.splice(index, 1);
  writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2));
  return true;
}

export function deleteSessionsByUserId(userId: string): boolean {
  const sessions = getSessions();
  const originalCount = sessions.length;
  for (let i = sessions.length - 1; i >= 0; i--) {
    if (sessions[i].user_id === userId) {
      sessions.splice(i, 1);
    }
  }
  writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2));
  return sessions.length < originalCount;
}

// ==================== Orders ====================

export interface Order {
  id: string;
  inquiry_id: string;
  user_id: string;
  order_number: string; // 订单号，如 CW-20240327-001
  status: 'pending' | 'confirmed' | 'producing' | 'shipped' | 'delivered' | 'cancelled';
  customer: {
    name: string;
    company: string;
    email: string;
    phone: string;
    country: string;
    website?: string;
  };
  items: any[];
  summary: {
    totalQuantity: number;
    estimatedTotal: number;
    leadTime: string;
    shippingMethod?: string;
    trackingNumber?: string;
  };
  notes: string;
  payment_terms: string;
  shipping_address?: string;
  created_at: string;
  updated_at: string;
}

export function getOrders(): Order[] {
  try {
    if (!existsSync(ORDERS_FILE)) return [];
    const content = readFileSync(ORDERS_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Failed to read orders:', error);
    return [];
  }
}

export function getOrderById(id: string): Order | undefined {
  const orders = getOrders();
  return orders.find(o => o.id === id);
}

export function getOrderByNumber(orderNumber: string): Order | undefined {
  const orders = getOrders();
  return orders.find(o => o.order_number === orderNumber);
}

export function createOrder(data: Partial<Order> & { inquiry_id: string }): Order {
  const orders = getOrders();
  const now = new Date();
  const id = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // 生成订单号：CW-YYYYMMDD-XXX (每日自增)
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const todayOrders = orders.filter(o => o.order_number.includes(dateStr));
  const seq = String(todayOrders.length + 1).padStart(3, '0');
  const order_number = `CW-${dateStr}-${seq}`;

  const newOrder: Order = {
    id,
    order_number,
    inquiry_id: data.inquiry_id,
    user_id: data.user_id || '',
    status: 'pending',
    customer: data.customer || { name: '', company: '', email: '', phone: '', country: '' },
    items: data.items || [],
    summary: {
      totalQuantity: data.summary?.totalQuantity || 0,
      estimatedTotal: data.summary?.estimatedTotal || 0,
      leadTime: data.summary?.leadTime || '15-25 business days',
      shippingMethod: data.summary?.shippingMethod,
      trackingNumber: data.summary?.trackingNumber,
    },
    notes: data.notes || '',
    payment_terms: data.payment_terms || '30% deposit, 70% before shipment',
    shipping_address: data.shipping_address,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  };

  orders.push(newOrder);
  writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
  return newOrder;
}

export function updateOrderStatus(id: string, status: Order['status']): boolean {
  const orders = getOrders();
  const index = orders.findIndex(o => o.id === id);
  if (index === -1) return false;

  orders[index].status = status;
  orders[index].updated_at = new Date().toISOString();
  writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
  return true;
}

export function updateOrder(id: string, updates: Partial<Order>): boolean {
  const orders = getOrders();
  const index = orders.findIndex(o => o.id === id);
  if (index === -1) return false;

  orders[index] = { ...orders[index], ...updates, updated_at: new Date().toISOString() };
  writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
  return true;
}

export function deleteOrder(id: string): boolean {
  const orders = getOrders();
  const index = orders.findIndex(o => o.id === id);
  if (index === -1) return false;

  orders.splice(index, 1);
  writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
  return true;
}

