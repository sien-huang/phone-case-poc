import { Metadata } from 'next';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'About Us - CloudWing',
  description: 'CloudWing (云翼智造) is a leading phone case OEM manufacturer based in Shenzhen, China. ISO 9001 certified, serving global brands with premium quality and fast samples.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gray-50 py-16 md:py-24 border-b">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              About CloudWing
            </h1>
            <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
              We are a professional phone case OEM manufacturer with over 10 years of experience in the industry.
              Based in Shenzhen, China, we specialize in providing high-quality, customizable phone cases for brands worldwide.
            </p>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="section">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
              <div className="space-y-4 text-gray-600 text-lg">
                <p>
                  CloudWing was founded in 2014 by a team of engineers who wanted to bring better quality control to the phone case manufacturing industry. Starting from a small workshop, we have grown into a 5000+ square meter facility with over 200 skilled workers.
                </p>
                <p>
                  Today, we serve clients in the US, EU, and Asia, providing OEM/ODM services with flexible MOQs starting at 300 pieces. Our mission is to help brands bring their unique designs to life with precision craftsmanship and fast turnaround.
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gray-100 rounded-2xl overflow-hidden shadow-lg">
                <Image
                  src="/images/factory.jpg"
                  alt="CloudWing Factory"
                  width={600}
                  height={400}
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Advantages */}
      <section className="section bg-gray-50">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose CloudWing?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We combine modern technology with traditional craftsmanship to deliver exceptional value to our clients.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-md">
              <div className="text-4xl mb-4">🏭</div>
              <h3 className="text-xl font-bold mb-3">Factory Direct</h3>
              <p className="text-gray-600">
                Our own manufacturing facility in Shenzhen ensures quality control and competitive pricing without middlemen.
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-md">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-bold mb-3">Fast Turnaround</h3>
              <p className="text-gray-600">
                Sample production in 3-5 business days. Mass production typically 15-25 days depending on quantity and complexity.
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-md">
              <div className="text-4xl mb-4">✅</div>
              <h3 className="text-xl font-bold mb-3">Certified Quality</h3>
              <p className="text-gray-600">
                ISO 9001, BSCI, and RoHS compliant. All products undergo multi-stage inspection before shipment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Certifications Preview */}
      <section className="section">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">Our Certifications</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: 'ISO 9001', icon: '🏅' },
              { name: 'BSCI', icon: '📜' },
              { name: 'RoHS', icon: '🌱' },
              { name: 'CE', icon: '✅' },
            ].map((cert) => (
              <div key={cert.name} className="bg-white border rounded-xl p-6 text-center hover:shadow-lg transition-shadow">
                <div className="text-4xl mb-3">{cert.icon}</div>
                <h3 className="font-bold text-lg">{cert.name}</h3>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <a href="/certifications" className="text-blue-600 hover:underline font-medium">
              View all certificates →
            </a>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="section bg-blue-600 text-white">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">10+</div>
              <div className="text-blue-100">Years Experience</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">5000+</div>
              <div className="text-blue-100">Square Meters</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">200+</div>
              <div className="text-blue-100">Team Members</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">1000+</div>
              <div className="text-blue-100">Happy Clients</div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="section bg-gray-900 text-white">
        <div className="container text-center py-16">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Your Project?</h2>
          <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
            Let's discuss how we can help bring your phone case designs to life. Get a free quote or sample today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/inquiry"
              className="bg-blue-600 text-white px-8 py-4 rounded-full font-semibold hover:bg-blue-700 transition-colors"
            >
              Request a Quote
            </a>
            <a
              href="mailto:sales@cloudwing-cases.com"
              className="border-2 border-gray-600 text-gray-300 px-8 py-4 rounded-full font-semibold hover:border-white hover:text-white transition-colors"
            >
              Contact Us
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}