import Link from 'next/link'

export default function TermsOfServicePage() {
  return (
    <div className="section">
      <div className="container max-w-4xl">
        <h1 className="heading-lg mb-8">Terms of Service</h1>
        
        <div className="prose max-w-none space-y-6">
          <section>
            <h2 className="heading-md">1. Acceptance of Terms</h2>
            <p className="text-gray-700">
              By accessing and using the CloudWing (云翼智造) website, you accept and agree to be bound by the terms 
              and provision of this agreement. If you do not agree to these Terms of Service, please do not use our website.
            </p>
          </section>

          <section>
            <h2 className="heading-md">2. Website Purpose</h2>
            <p className="text-gray-700">
              This website is intended for business-to-business (B2B) wholesale inquiries. We showcase our phone case 
              designs and provide a mechanism for potential buyers to request quotes. All prices, minimum order quantities, 
              and terms are subject to confirmation.
            </p>
          </section>

          <section>
            <h2 className="heading-md">3. Intellectual Property</h2>
            <p className="text-gray-700">
              All content on this website, including but not limited to product designs, images, descriptions, logos, and 
              software, is the property of CloudWing or its licensors and is protected by intellectual property laws. 
              You may not reproduce, distribute, or create derivative works without our express written permission.
            </p>
          </section>

          <section>
            <h2 className="heading-md">4. Quote Requests</h2>
            <p className="text-gray-700">
              Submitting a quote request does not constitute a binding agreement. All quotes are subject to:
            </p>
            <ul className="list-disc list-inside ml-4 text-gray-700">
              <li>Product availability</li>
              <li>Price confirmation at time of order</li>
              <li>Changes in material or component costs</li>
              <li>Minimum order quantity (MOQ) requirements</li>
            </ul>
            <p className="text-gray-700 mt-2">
              We reserve the right to accept or decline any quote request at our sole discretion.
            </p>
          </section>

          <section>
            <h2 className="heading-md">5. User Responsibilities</h2>
            <p className="text-gray-700">When using our website, you agree to:</p>
            <ul className="list-disc list-inside ml-4 text-gray-700">
              <li>Provide accurate and complete information in quote requests</li>
              <li>Not use the website for any unlawful purpose</li>
              <li>Not attempt to access restricted areas or admin functions</li>
              <li>Not upload malicious code or files</li>
              <li>Respect the rights of other users</li>
            </ul>
          </section>

          <section>
            <h2 className="heading-md">6. Limitations of Liability</h2>
            <p className="text-gray-700">
              CloudWing shall not be liable for any indirect, incidental, special, or consequential damages arising 
              from the use of this website or the information contained herein. We do not guarantee the accuracy, 
              completeness, or reliability of any content on the website.
            </p>
            <p className="text-gray-700 mt-2">
              Product images are for illustrative purposes. Actual products may vary slightly in color or texture due 
              to manufacturing processes and screen calibration.
            </p>
          </section>

          <section>
            <h2 className="heading-md">7. Privacy</h2>
            <p className="text-gray-700">
              Your privacy is important to us. Please review our <Link href="/privacy-policy" className="text-blue-600 hover:underline">Privacy Policy</Link> 
              to understand how we collect, use, and protect your personal information.
            </p>
          </section>

          <section>
            <h2 className="heading-md">8. Changes to Terms</h2>
            <p className="text-gray-700">
              We reserve the right to modify these Terms of Service at any time. Continued use of the website after 
              changes constitutes acceptance of the updated terms. The date of the most recent revision will be indicated at the bottom of this page.
            </p>
          </section>

          <section>
            <h2 className="heading-md">9. Governing Law</h2>
            <p className="text-gray-700">
              These terms shall be governed by and construed in accordance with the laws of the People's Republic of China. 
              Any disputes shall be resolved through arbitration in Shenzhen, China.
            </p>
          </section>

          <section>
            <h2 className="heading-md">10. Contact Information</h2>
            <p className="text-gray-700">
              If you have any questions about these Terms of Service, please contact us:
            </p>
            <div className="bg-gray-50 p-4 rounded mt-2">
              <p><strong>CloudWing (云翼智造)</strong></p>
              <p>Email: 272536022@qq.com</p>
              <p>Time Zone: GMT+8 (Beijing)</p>
            </div>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t">
          <p className="text-sm text-gray-500">
            Last updated: March 25, 2025
          </p>
          <Link href="/" className="text-blue-600 hover:underline text-sm">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
