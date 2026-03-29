import Link from 'next/link'

export default function PrivacyPolicyPage() {
  return (
    <div className="section">
      <div className="container max-w-4xl">
        <h1 className="heading-lg mb-8">Privacy Policy</h1>
        
        <div className="prose max-w-none space-y-6">
          <section>
            <h2 className="heading-md">1. Introduction</h2>
            <p className="text-gray-700">
              CloudWing (云翼智造) respects your privacy and is committed to protecting your personal data. 
              This privacy policy explains how we collect, use, and safeguard your information when you visit our website or submit a quote request.
            </p>
          </section>

          <section>
            <h2 className="heading-md">2. Information We Collect</h2>
            <p className="text-gray-700">We collect the following information when you submit a quote request:</p>
            <ul className="list-disc list-inside ml-4 text-gray-700">
              <li>Company name</li>
              <li>Business type</li>
              <li>Target market</li>
              <li>Products of interest</li>
              <li>Estimated order quantity</li>
              <li>Contact information (email, phone if provided)</li>
              <li>Additional message</li>
              <li>Uploaded files (if any)</li>
            </ul>
          </section>

          <section>
            <h2 className="heading-md">3. How We Use Your Information</h2>
            <p className="text-gray-700">We use the collected information solely for:</p>
            <ul className="list-disc list-inside ml-4 text-gray-700">
              <li>Processing your quote request</li>
              <li>Providing information about our products and services</li>
              <li>Improving our website and customer service</li>
              <li>Compliance with legal obligations</li>
            </ul>
            <p className="text-gray-700 mt-2">
              We do <strong>not</strong> sell, trade, or transfer your personal information to third parties without your consent, 
              except as necessary to fulfill the quote process (e.g., shipping partners if an order is placed).
            </p>
          </section>

          <section>
            <h2 className="heading-md">4. Data Retention</h2>
            <p className="text-gray-700">
              Quote inquiries are stored in our database for a maximum of <strong>3 years</strong>. After this period, 
              the data is automatically deleted unless an order has been placed, in which case records are retained 
              for business accounting purposes (as required by law).
            </p>
          </section>

          <section>
            <h2 className="heading-md">5. Cookies and Tracking</h2>
            <p className="text-gray-700">
              We use essential cookies to ensure the website functions properly. We also use analytics cookies 
              (Google Analytics) to understand how visitors interact with our site. You can manage your cookie 
              preferences using the cookie banner on our website.
            </p>
          </section>

          <section>
            <h2 className="heading-md">6. Data Security</h2>
            <p className="text-gray-700">
              We implement appropriate security measures to protect your personal data against unauthorized access, 
              alteration, or destruction. Our admin panel is password-protected, and all data transmissions use 
              secure protocols.
            </p>
          </section>

          <section>
            <h2 className="heading-md">7. Your Rights</h2>
            <p className="text-gray-700">You have the right to:</p>
            <ul className="list-disc list-inside ml-4 text-gray-700">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Opt-out of marketing communications</li>
            </ul>
            <p className="text-gray-700 mt-2">
              To exercise these rights, please contact us at: <strong>272536022@qq.com</strong>
            </p>
          </section>

          <section>
            <h2 className="heading-md">8. Changes to This Policy</h2>
            <p className="text-gray-700">
              We may update this privacy policy from time to time. Any changes will be posted on this page with an 
              updated revision date. Continued use of the website after changes constitutes acceptance of the new policy.
            </p>
          </section>

          <section>
            <h2 className="heading-md">9. Contact Us</h2>
            <p className="text-gray-700">
              If you have questions about this privacy policy or our data practices, please contact us:
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
