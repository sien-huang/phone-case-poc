'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Category {
  id?: string
  name: string
  description?: string
  order?: number
  is_active?: number
  product_count?: number
  created_at?: string
  updated_at?: string
}

export default function CategoriesAdminPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    checkAuthAndLoad()
  }, [])

  const checkAuthAndLoad = async () => {
    try {
      const res = await fetch('/api/admin/check')
      if (!res.ok) {
        router.push('/admin/login')
        return
      }
      loadCategories()
    } catch (err) {
      router.push('/admin/login')
    }
  }

  const loadCategories = async () => {
    try {
      const res = await fetch('/api/admin/categories')
      if (res.ok) {
        const data = await res.json()
        setCategories(data)
      } else {
        setError('Failed to load categories')
      }
    } catch (error) {
      console.error('Failed to load categories:', error)
      setError('Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCategory) return

    try {
      const method = editingCategory.id ? 'PUT' : 'POST'
      const res = await fetch('/api/admin/categories', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingCategory),
      })

      if (res.ok) {
        alert(editingCategory.id ? 'Category updated!' : 'Category created!')
        setEditingCategory(null)
        setIsCreating(false)
        loadCategories()
      } else {
        const err = await res.json()
        alert(`Failed: ${err.error}`)
      }
    } catch (error) {
      alert('Error saving category')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category? Products in this category will remain but may need reassignment.')) return
    
    try {
      const res = await fetch(`/api/admin/categories?id=${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        alert('Category deleted')
        loadCategories()
      } else {
        const err = await res.json()
        alert(`Failed: ${err.error}`)
      }
    } catch (error) {
      alert('Failed to delete category')
    }
  }

  const openEditor = (category?: Category) => {
    if (category) {
      setEditingCategory({ ...category })
    } else {
      setEditingCategory({
        name: '',
        description: '',
        order: 0,
        is_active: 1,
      })
    }
    setIsCreating(!category)
    setError('')
  }

  const updateField = (field: keyof Category, value: any) => {
    if (editingCategory) {
      setEditingCategory({ ...editingCategory, [field]: value })
    }
  }

  if (loading) return (
    <div className="section">
      <div className="container">Loading categories...</div>
    </div>
  )

  return (
    <div className="section">
      <div className="container">
        <div className="flex justify-between items-center mb-8">
          <h1 className="heading-lg">Categories Management</h1>
          <div className="flex gap-4">
            <button 
              onClick={() => { setIsCreating(true); openEditor(); }}
              className="btn btn-primary"
            >
              + Add Category
            </button>
            <button 
              onClick={loadCategories}
              className="btn btn-outline"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Category Editor Modal */}
        {(isCreating || editingCategory) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-lg w-full p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="heading-md">
                  {isCreating ? 'Create New Category' : 'Edit Category'}
                </h2>
                <button 
                  onClick={() => { setEditingCategory(null); setIsCreating(false); }}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Category Name *</label>
                  <input 
                    type="text" 
                    required
                    value={editingCategory?.name || ''}
                    onChange={(e) => updateField('name', e.target.value)}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-600"
                    placeholder="iPhone 15 Series"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea 
                    rows={3}
                    value={editingCategory?.description || ''}
                    onChange={(e) => updateField('description', e.target.value)}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-600"
                    placeholder="Brief description of this category..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Order</label>
                    <input 
                      type="number" 
                      value={editingCategory?.order || 0}
                      onChange={(e) => updateField('order', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-600"
                      placeholder="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">Sort order (lower first)</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Status</label>
                    <select 
                      value={editingCategory?.is_active !== undefined ? editingCategory.is_active : 1}
                      onChange={(e) => updateField('is_active', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-600"
                    >
                      <option value={1}>Active</option>
                      <option value={0}>Inactive</option>
                    </select>
                  </div>
                </div>

                {editingCategory?.product_count !== undefined && (
                  <p className="text-sm text-gray-500">
                    Products in this category: {editingCategory.product_count}
                  </p>
                )}

                <div className="flex gap-4 pt-4 border-t">
                  <button 
                    type="submit"
                    className="btn btn-primary px-6 py-2"
                  >
                    {isCreating ? 'Create Category' : 'Update Category'}
                  </button>
                  <button 
                    type="button"
                    onClick={() => { setEditingCategory(null); setIsCreating(false); }}
                    className="btn btn-outline px-6 py-2"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        {/* Categories Table */}
        <div className="bg-white rounded shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Description</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Order</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Products</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {categories.map((category) => (
                <tr key={category.id}>
                  <td className="px-4 py-4">
                    <div className="font-medium">{category.name}</div>
                    <div className="text-sm text-gray-500">{category.id}</div>
                  </td>
                  <td className="px-4 py-4 text-sm">
                    {category.description || '-'}
                  </td>
                  <td className="px-4 py-4 text-sm">
                    {category.order}
                  </td>
                  <td className="px-4 py-4 text-sm">
                    {category.product_count || 0}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-1 rounded text-xs ${
                      category.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {category.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <button 
                      onClick={() => openEditor(category)}
                      className="text-blue-600 hover:text-blue-800 mr-3"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(category.id!)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {categories.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No categories yet. Create your first category!
          </div>
        )}

        <div className="mt-8 bg-yellow-50 border-l-4 border-yellow-400 p-6">
          <h3 className="font-bold mb-2">💡 About Categories</h3>
          <div className="prose max-w-none text-sm">
            <ul className="list-disc list-inside space-y-2">
              <li>Categories help organize products and make them easier to find</li>
              <li>You can create categories like "iPhone 15 Series", "Samsung Cases", etc.</li>
              <li>When you create a category, it will automatically appear in the product edit form</li>
              <li>Products assigned to a category will be counted in the "Products" column</li>
              <li>Deleting a category won't delete products, but they will lose their category assignment</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
