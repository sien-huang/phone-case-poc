'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function UploadPage() {
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      const validFiles = selectedFiles.filter(file => {
        if (!file.type.startsWith('image/')) {
          setError(`File "${file.name}" is not an image`)
          return false
        }
        if (file.size > 5 * 1024 * 1024) {
          setError(`File "${file.name}" exceeds 5MB limit`)
          return false
        }
        return true
      })
      if (validFiles.length > 0) {
        setFiles(prev => [...prev, ...validFiles])
        setError(null)
      }
    }
  }

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (files.length === 0) return
    
    setUploading(true)
    setError(null)
    const urls: string[] = []
    
    try {
      for (const file of files) {
        const formData = new FormData()
        formData.append('file', file)
        
        const res = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData,
        })
        
        if (res.ok) {
          const data = await res.json()
          // 确保返回相对路径
          const relativeUrl = data.url.startsWith('http') 
            ? new URL(data.url, process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000').pathname 
            : data.url
          urls.push(relativeUrl)
        } else {
          const errorData = await res.json()
          throw new Error(errorData.error || `Failed to upload ${file.name}`)
        }
      }
      setUploadedUrls(urls)
      setFiles([]) // 清空已上传文件
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Batch Image Upload</h1>
            
            <div className="space-y-6">
              {uploadedUrls.length === 0 ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Image Files (Multiple allowed)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
                    />
                    {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
                    <p className="mt-2 text-sm text-gray-500">
                      Selected: {files.length} file(s) • Max 5MB per file
                    </p>
                  </div>
                  
                  {files.length > 0 && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {files.map((file, idx) => (
                          <div key={idx} className="border border-gray-200 rounded-lg p-2 relative group">
                            <button
                              onClick={() => removeFile(idx)}
                              className="absolute top-1 right-1 z-10 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity"
                              aria-label="Remove file"
                            >
                              ×
                            </button>
                            <img 
                              src={URL.createObjectURL(file)} 
                              alt={file.name}
                              className="w-full aspect-square object-cover rounded mb-2"
                            />
                            <p className="text-xs text-gray-600 truncate" title={file.name}>
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <button
                    onClick={handleUpload}
                    disabled={files.length === 0 || uploading}
                    className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? `Uploading ${files.length} file(s)...` : `Upload ${files.length} File(s)`}
                  </button>
                </>
              ) : (
                <div className="text-center">
                  <h2 className="text-xl font-semibold text-green-600 mb-4">✅ Upload Complete!</h2>
                  <p className="text-sm text-gray-600 mb-4">
                    {uploadedUrls.length} image(s) uploaded successfully.
                  </p>
                  <div className="space-y-4 text-left">
                    <p className="text-sm font-medium text-gray-700">Relative URLs (copy these):</p>
                    {uploadedUrls.map((url, idx) => (
                      <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                        <code className="block w-full text-sm px-2 py-1 bg-gray-100 border rounded break-all">
                          {url}
                        </code>
                      </div>
                    ))}
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm text-blue-800">
                        Use these relative paths in your product images. Example: <code>"/uploads/abc.jpg"</code>
                      </p>
                    </div>
                  </div>
                  <div className="mt-6 flex gap-3">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(uploadedUrls.join('\n'))
                        alert('All URLs copied to clipboard!')
                      }}
                      className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    >
                      Copy All URLs
                    </button>
                    <button
                      onClick={() => {
                        setFiles([])
                        setUploadedUrls([])
                      }}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Upload More
                    </button>
                    <Link
                      href="/admin/products"
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Go to Products
                    </Link>
                  </div>
                </div>
              )}
              
              <div className="pt-4 border-t">
                <Link
                  href="/admin/products"
                  className="text-blue-600 hover:underline flex items-center gap-2"
                >
                  ← Back to Product Management
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
