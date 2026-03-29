'use client';

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

interface Inquiry {
  id: string;
  created_at: string;
  updated_at: string;
  status: 'pending' | 'contacted' | 'quoted' | 'closed';
  customer: {
    name: string;
    company: string;
    email: string;
    phone: string;
    country: string;
    website?: string;
  };
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice?: number | null;
    notes?: string;
  }>;
  summary: {
    totalQuantity: number;
    estimatedTotal?: number | null;
    leadTime: string;
    notes: string;
  };
  communications: Array<{
    type: string;
    content: string;
    created_by: string;
    created_at: string;
  }>;
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 12,
    lineHeight: 1.5,
  },
  header: {
    marginBottom: 30,
    borderBottom: '2 solid #2563eb',
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1e293b',
  },
  logo: {
    width: 120,
    height: 40,
    marginBottom: 10,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#475569',
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  col: {
    width: '48%',
  },
  table: {
    width: '100%',
    marginTop: 10,
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tableHeader: {
    backgroundColor: '#f1f5f9',
    fontWeight: 'bold',
  },
  tableCol: {
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
  },
  totalRow: {
    marginTop: 10,
    alignItems: 'flex-end',
  },
  totalText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTop: '1 solid #e2e8f0',
    paddingTop: 10,
    textAlign: 'center',
    fontSize: 10,
    color: '#64748b',
  },
});

interface InquiryPDFProps {
  inquiry: Inquiry;
}

export default function InquiryPDF({ inquiry }: InquiryPDFProps) {
  const companyInfo = {
    name: 'CloudWing (云翼智造)',
    address: 'Shenzhen, China',
    email: 'sales@cloudwing-cases.com',
    phone: '+86 755 1234 5678',
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Quotation</Text>
          <View style={styles.grid}>
            <View>
              <Text style={styles.sectionTitle}>From</Text>
              <Text>{companyInfo.name}</Text>
              <Text>{companyInfo.address}</Text>
              <Text>{companyInfo.email}</Text>
              <Text>{companyInfo.phone}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.sectionTitle}>To</Text>
              <Text style={{ fontWeight: 'bold' }}>{inquiry.customer.company}</Text>
              <Text>{inquiry.customer.name}</Text>
              <Text>{inquiry.customer.email}</Text>
              <Text>{inquiry.customer.phone}</Text>
              {inquiry.customer.country && <Text>{inquiry.customer.country}</Text>}
            </View>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Products</Text>
          <View style={styles.table}>
            {/* Header */}
            <View style={[styles.tableRow, styles.tableHeader]}>
              <View style={[styles.tableCol, { width: '50%' }]}>
                <Text>Product</Text>
              </View>
              <View style={[styles.tableCol, { width: '15%', textAlign: 'center' }]}>
                <Text>Qty</Text>
              </View>
              <View style={[styles.tableCol, { width: '15%', textAlign: 'right' }]}>
                <Text>Unit Price</Text>
              </View>
              <View style={[styles.tableCol, { width: '20%', textAlign: 'right' }]}>
                <Text>Total</Text>
              </View>
            </View>

            {/* Rows */}
            {inquiry.items.map((item: any, i: number) => (
              <View key={i} style={styles.tableRow}>
                <View style={[styles.tableCol, { width: '50%' }]}>
                  <Text>{item.productName}</Text>
                  {item.notes && (
                    <Text style={{ fontSize: 9, color: '#64748b' }}>{item.notes}</Text>
                  )}
                </View>
                <View style={[styles.tableCol, { width: '15%', textAlign: 'center' }]}>
                  <Text>{item.quantity}</Text>
                </View>
                <View style={[styles.tableCol, { width: '15%', textAlign: 'right' }]}>
                  <Text>{item.unitPrice ? `$${item.unitPrice.toFixed(2)}` : '-'}</Text>
                </View>
                <View style={[styles.tableCol, { width: '20%', textAlign: 'right' }]}>
                  <Text>{item.unitPrice ? `$${(item.quantity * item.unitPrice).toFixed(2)}` : '-'}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Totals */}
          <View style={styles.totalRow}>
            <Text style={{ marginRight: 10 }}>Total Quantity:</Text>
            <Text style={{ fontWeight: 'bold' }}>{inquiry.summary.totalQuantity} pcs</Text>
          </View>
          {inquiry.summary.estimatedTotal && (
            <View style={styles.totalRow}>
              <Text style={{ marginRight: 10 }}>Grand Total:</Text>
              <Text style={styles.totalText}>${inquiry.summary.estimatedTotal.toFixed(2)}</Text>
            </View>
          )}
        </View>

        {/* Terms */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Terms & Conditions</Text>
          <Text>- Payment: 30% deposit, 70% before shipment</Text>
          <Text>- Lead time: 15-25 business days after deposit</Text>
          <Text>- Price valid for 30 days</Text>
          <Text>- Quotation subject to final confirmation</Text>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Thank you for your inquiry! Feel free to contact us for any questions.
        </Text>
      </Page>
    </Document>
  );
}