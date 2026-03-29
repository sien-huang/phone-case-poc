import Link from 'next/link'

export default function FactoryPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gray-900 text-white py-20">
        <div className="container">
          <div className="max-w-3xl">
            <h1 className="heading-xl mb-6">Our Manufacturing Capabilities</h1>
            <p className="text-xl text-gray-300 mb-8">
              ISO 9001 certified facility with 5M+ annual capacity. Specializing in US & EU markets with CE, BSCI, RoHS compliance.
            </p>
            <div className="flex gap-4">
              <Link href="/quote" className="btn btn-primary">Request Factory Tour</Link>
              <a href="#certifications" className="btn btn-outline border-white text-white hover:bg-white hover:text-gray-900">View Certifications</a>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="section bg-white">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-5xl font-bold text-blue-600 mb-2">5M+</div>
              <div className="text-gray-600">Annual Capacity (pcs)</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-blue-600 mb-2">50+</div>
              <div className="text-gray-600">Production Lines</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-blue-600 mb-2">100+</div>
              <div className="text-gray-600">Skilled Workers</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-blue-600 mb-2">&lt;0.3%</div>
              <div className="text-gray-600">Defect Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Facility Photos */}
      <section className="section bg-gray-50">
        <div className="container">
          <h2 className="heading-lg mb-12">Inside Our Factory</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1,2,3,4,5,6,7,8].map(i => (
              <div key={i} className="bg-gradient-to-br from-gray-200 to-gray-300 h-48 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <span className="text-4xl mb-2 block">🏭</span>
                  <span className="text-sm text-gray-600">Production Line</span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-gray-500 text-sm mt-4">
            High-quality photos of our Shenzhen facility available upon request
          </p>
        </div>
      </section>

      {/* Equipment */}
      <section className="section">
        <div className="container">
          <h2 className="heading-lg mb-8">Our Equipment</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded shadow">
              <h3 className="font-bold text-lg mb-4">Injection Molding</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• 10 CNC injection machines (50-300 tons)</li>
                <li>• Auto material mixing system</li>
                <li>• Temperature control ±1°C</li>
                <li>• 24/7 production capability</li>
              </ul>
            </div>
            <div className="bg-white p-6 rounded shadow">
              <h3 className="font-bold text-lg mb-4">Printing & Finishing</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• 5 UV printing lines</li>
                <li>• Silk screen printing</li>
                <li>• Heat transfer printing</li>
                <li>• Pantone color matching</li>
              </ul>
            </div>
            <div className="bg-white p-6 rounded shadow">
              <h3 className="font-bold text-lg mb-4">Quality Control</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Salt spray test chamber</li>
                <li>• Drop test machine (1.2m / 4ft)</li>
                <li>• Color matching spectrometer</li>
                <li>• 100% functional testing</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section id="certifications" className="section bg-gray-50">
        <div className="container">
          <h2 className="heading-lg mb-8">Certifications & Compliance</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: 'ISO 9001', desc: 'Quality Management System' },
              { name: 'BSCI', desc: 'Business Social Compliance' },
              { name: 'RoHS', desc: 'Hazardous Substances Free' },
              { name: 'CE', desc: 'EU Conformity (for eligible products)' },
            ].map(cert => (
              <div key={cert.name} className="bg-white p-6 rounded shadow text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">✓</span>
                </div>
                <h3 className="font-bold">{cert.name}</h3>
                <p className="text-sm text-gray-600">{cert.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quality Process */}
      <section className="section">
        <div className="container">
          <h2 className="heading-lg mb-8">Quality Control Process</h2>
          <div className="space-y-6">
            {[
              { step: '1', title: 'Incoming Material Inspection', desc: 'All raw materials tested for quality and compliance before entering production.' },
              { step: '2', title: 'In-Process QC', desc: 'Quality checks at each stage: molding, printing, assembly.' },
              { step: '3', title: 'Pre-Shipment Inspection', desc: '100% functional testing, visual inspection, and random drop testing.' },
              { step: '4', title: 'Final Audit', desc: 'Random sampling according to AQL 1.0 standard before shipment.' },
            ].map(item => (
              <div key={item.step} className="flex gap-6 items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                  <p className="text-gray-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Shipping Info */}
      <section className="section bg-gray-50">
        <div className="container">
          <h2 className="heading-lg mb-8">Shipping & Logistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded shadow">
              <h3 className="font-bold text-lg mb-4">For USA & Canada</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• FOB Shenzhen (standard)</li>
                <li>• DDP available on request</li>
                <li>• Air freight: 5-7 days</li>
                <li>• Sea freight: 25-35 days</li>
              </ul>
            </div>
            <div className="bg-white p-6 rounded shadow">
              <h3 className="font-bold text-lg mb-4">For European Union</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• CE certification available</li>
                <li>• RoHS compliant guaranteed</li>
                <li>• DAP or DDP terms</li>
                <li>• VAT handling support</li>
              </ul>
            </div>
            <div className="bg-white p-6 rounded shadow">
              <h3 className="font-bold text-lg mb-4">Global Shipping</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• FedEx/DHL/UPS for samples</li>
                <li>• Freight forwarder for bulk</li>
                <li>• Insurance available</li>
                <li>• Tracking provided</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section bg-blue-600 text-white">
        <div className="container text-center">
          <h2 className="heading-lg mb-4">Want to See Our Factory in Person?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            We welcome potential clients to visit our Shenzhen facility. Contact us to schedule a factory tour.
          </p>
          <Link href="/quote" className="btn bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-4">
            Schedule a Visit
          </Link>
        </div>
      </section>
    </div>
  )
}
