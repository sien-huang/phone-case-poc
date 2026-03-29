'use client'

import { useEffect } from 'react'

const GA4_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID

export default function Analytics() {
  useEffect(() => {
    // 如果未配置 GA4 ID，跳过
    if (!GA4_MEASUREMENT_ID) {
      console.log('⚠️  GA4 not configured (NEXT_PUBLIC_GA4_MEASUREMENT_ID missing)')
      return
    }

    // 1. 加载 gtag.js 脚本
    const script1 = document.createElement('script')
    script1.async = true
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`
    document.head.appendChild(script1)

    // 2. 初始化 gtag 函数
    const script2 = document.createElement('script')
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || []
      function gtag(){dataLayer.push(arguments)}
      gtag('js', new Date())
      gtag('config', '${GA4_MEASUREMENT_ID}', {
        page_title: document.title,
        page_location: window.location.href,
        anonymize_ip: true, // GDPR 友好
      })
    `
    document.head.appendChild(script2)

    // 3. 清理函数（移除脚本）
    return () => {
      document.head.removeChild(script1)
      document.head.removeChild(script2)
    }
  }, [])

  return null // 此组件不渲染任何内容
}
