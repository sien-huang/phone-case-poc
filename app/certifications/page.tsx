import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Certifications - CloudWing',
  description: 'CloudWing is certified with ISO 9001, BSCI, RoHS, CE and more. View our quality and compliance certificates.',
};

const certifications = [
  {
    id: 'iso9001',
    name: 'ISO 9001',
    fullName: 'ISO 9001:2015 Quality Management System',
    category: 'Quality',
    icon: '🏅',
    description: 'Demonstrates our commitment to consistent quality control and continuous improvement in manufacturing processes.',
    validUntil: '2027-12-31',
  },
  {
    id: 'bosci',
    name: 'BSCI',
    fullName: 'Business Social Compliance Initiative',
    category: 'Social Responsibility',
    icon: '🤝',
    description: 'Ensures we meet international standards for workers\' rights, health & safety, and ethical business practices.',
    validUntil: '2026-06-30',
  },
  {
    id: 'rohs',
    name: 'RoHS',
    fullName: 'Restriction of Hazardous Substances',
    category: 'Environment',
    icon: '🌱',
    description: 'Confirms our products comply with EU regulations restricting hazardous substances in electrical and electronic equipment.',
    validUntil: 'Permanent',
  },
  {
    id: 'ce',
    name: 'CE',
    fullName: 'Conformité Européenne',
    category: 'Safety',
    icon: '✅',
    description: 'Marks our products as meeting EU safety, health, and environmental protection requirements.',
    validUntil: 'Ongoing',
  },
  {
    id: 'msds',
    name: 'MSDS',
    fullName: 'Material Safety Data Sheet',
    category: 'Safety',
    icon: '📋',
    description: 'Detailed information about material composition, handling, and safety precautions for our products.',
    validUntil: 'On Request',
  },
];

export default function CertificationsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <section className="bg-gray-50 py-16 border-b">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Certifications</h1>
            <p className="text-xl text-gray-600">
              CloudWing operates under internationally recognized quality and compliance standards.
            </p>
          </div>
        </div>
      </section>

      {/* Cert Grid */}
      <section className="section">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {certifications.map((cert) => (
              <div
                key={cert.id}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="p-6">
                  <div className="text-5xl mb-4">{cert.icon}</div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold text-blue-600 uppercase tracking-wide">
                      {cert.category}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{cert.name}</h3>
                  <p className="text-sm text-gray-500 mb-4">{cert.fullName}</p>
                  <p className="text-gray-600 text-sm leading-relaxed mb-4">{cert.description}</p>
                  <div className="border-t pt-4 mt-4">
                    <p className="text-xs text-gray-500">
                      <span className="font-medium">Valid Until:</span> {cert.validUntil}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Request Section */}
      <section className="section bg-gray-50">
        <div className="container">
          <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl border">
            <h2 className="text-2xl font-bold mb-4">Need Original Certificates?</h2>
            <p className="text-gray-600 mb-6">
              For verification purposes, we can provide original certificate copies, audit reports, and additional documentation upon request.
            </p>
            <a
              href="mailto:sales@cloudwing-cases.com?subject=Certificate%20Request"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Request Certificates
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}