import { Metadata } from 'next';
import HomeClient from './HomeClient';

export const metadata: Metadata = {
  title: 'CloudWing Cases | Premium Phone Case Manufacturer for US & EU Markets',
  description: 'CloudWing (云翼智造) is a premium phone case OEM manufacturer serving US and EU brands. Original designs, flexible MOQs from 300 pcs, ISO 9001 certified. Get a quote today.',
  keywords: 'phone case manufacturer, iPhone case wholesale, OEM phone case, custom phone case, wholesale phone cases, private label, CloudWing, 云翼智造',
  openGraph: {
    title: 'CloudWing Cases | Premium Phone Case Manufacturer',
    description: 'Original phone case designs for global brands. OEM/ODM services for US & EU markets. Fast samples, flexible MOQs.',
    url: 'https://cloudwing-cases.com',
    siteName: 'CloudWing Cases',
    locale: 'en_US',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function HomePage() {
  return <HomeClient />;
}