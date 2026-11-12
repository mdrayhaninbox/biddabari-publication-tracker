import { 
  Document, 
  Paragraph, 
  TextRun, 
  Table, 
  TableRow, 
  TableCell, 
  WidthType, 
  AlignmentType, 
  HeadingLevel, 
  BorderStyle, 
  PageOrientation, 
  Header, 
  Footer, 
  PageNumber, 
  Packer 
} from 'docx';
import { 
  BookRecord, 
  ChannelConfig, 
  PressPaymentRecord, 
  PressOrderRecord, 
  PressDeliveryRecord, 
  ChannelCollectionRecord 
} from '../types/book';
import { 
  calculateBookMetrics, 
  calculatePressAccounts, 
  calculateChannelDueAccounts, 
  formatBDT, 
  formatNumber, 
  sumDaily 
} from './calculations';
import { Language, tr } from './i18n';

export interface WordExportOptions {
  books: BookRecord[];
  allBooksCount: number;
  reportTitle: string;
  periodTitle: string;
  currentDate: string;
  language: Language;
  channels: ChannelConfig[];
  pressPayments: PressPaymentRecord[];
  pressOrders: PressOrderRecord[];
  pressDeliveries: PressDeliveryRecord[];
  channelCollections: ChannelCollectionRecord[];
  salesMode?: 'all' | 'online' | 'offline' | 'none';
  includePressAccounts?: boolean;
  includePressPayments?: boolean;
  includeOnlineDue?: boolean;
  includeOfflineDue?: boolean;
  includeSignatures?: boolean;
}

const NAVY_COLOR = '1E3A8A';
const NAVY_DARK = '0F172A';
const BORDER_COLOR = 'CBD5E1';
const ZEBRA_BG = 'F8FAFC';
const TOTAL_BG = 'F1F5F9';
const WHITE = 'FFFFFF';
const TEXT_MUTED = '64748B';

// Border style helper for neat clean tables
const tableBorder = {
  style: BorderStyle.SINGLE,
  size: 4,
  color: BORDER_COLOR,
};

const cellBorders = {
  top: tableBorder,
  bottom: tableBorder,
  left: tableBorder,
  right: tableBorder,
};

const defaultCellMargins = {
  top: 100,
  bottom: 100,
  left: 120,
  right: 120,
};

export async function exportReportToWord(options: WordExportOptions): Promise<void> {
  const {
    books,
    allBooksCount,
    reportTitle,
    periodTitle,
    currentDate,
    language,
    channels,
    pressPayments,
    pressOrders,
    pressDeliveries,
    channelCollections,
    salesMode = 'all',
    includePressAccounts = true,
    includePressPayments = true,
    includeOnlineDue = true,
    includeOfflineDue = true,
    includeSignatures = true,
  } = options;

  const pressAccounts = calculatePressAccounts(books, pressPayments, pressOrders);
  const channelAccounts = calculateChannelDueAccounts(books, channelCollections, channels);

  // Overall totals across books
  let totalHOStock = 0;
  let totalPressStock = 0;
  let totalSold = 0;
  let totalOnlineSold = 0;
  let totalOfflineSold = 0;
  let totalRevenue = 0;
  let totalProfit = 0;
  let totalReturns = 0;

  const bookMetricsList = books.map((b, idx) => {
    const m = calculateBookMetrics(b, pressOrders, channels);
    totalHOStock += m.totalPresentStockHO;
    totalPressStock += m.stockToFaridBhai;
    totalSold += m.totalSold;
    totalOnlineSold += m.totalOnlineSell;
    totalOfflineSold += m.totalOfflineSell;
    totalRevenue += m.totalRevenue;
    totalProfit += m.totalNetProfit;
    totalReturns += m.totalReturns;
    return { book: b, metrics: m, sl: idx + 1 };
  });

  const children: (Paragraph | Table)[] = [];

  // ==============================================================
  // 1. HEADER / TITLE BLOCK
  // ==============================================================
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [
        new TextRun({
          text: 'BIDDABARI PUBLICATION',
          bold: true,
          size: 32, // 16pt
          color: NAVY_COLOR,
          font: 'Segoe UI',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: tr('বিদ্যাবাড়ি পাবলিকেশন • অফিসিয়াল খতিয়ান ও এক্সিকিউটিভ রিপোর্ট', 'Official Executive Report & Publication Ledger', language),
          size: 20,
          color: TEXT_MUTED,
          font: 'Segoe UI',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: reportTitle,
          bold: true,
          size: 24,
          color: NAVY_DARK,
          font: 'Segoe UI',
        }),
      ],
    })
  );

  // Meta Info Table (Period, Date, Books count)
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              borders: cellBorders,
              margins: defaultCellMargins,
              shading: { fill: ZEBRA_BG },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: tr('রিপোর্টের সময়কাল: ', 'Report Period: ', language), bold: true, size: 18 }),
                    new TextRun({ text: periodTitle, size: 18, bold: true, color: NAVY_COLOR }),
                  ],
                }),
              ],
            }),
            new TableCell({
              borders: cellBorders,
              margins: defaultCellMargins,
              shading: { fill: ZEBRA_BG },
              children: [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  children: [
                    new TextRun({ text: tr('প্রিন্টের তারিখ: ', 'Printed Date: ', language), bold: true, size: 18 }),
                    new TextRun({ text: currentDate, size: 18 }),
                    new TextRun({ text: ` | ${tr(`বই সংখ্যা: ${books.length} টি`, `Books: ${books.length}`, language)}`, size: 18 }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }),
    new Paragraph({ spacing: { after: 200 } })
  );

  // ==============================================================
  // 2. EXECUTIVE HIGHLIGHTS / KPI SUMMARY TABLE
  // ==============================================================
  children.push(
    new Paragraph({
      spacing: { after: 100 },
      children: [
        new TextRun({
          text: tr('সার্বিক এক্সিকিউটিভ সূচক (Key Performance Indicators)', 'Key Executive Performance Indicators', language),
          bold: true,
          size: 20,
          color: NAVY_COLOR,
          font: 'Segoe UI',
        }),
      ],
    }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              borders: cellBorders,
              margins: defaultCellMargins,
              shading: { fill: NAVY_COLOR },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: tr('হেড অফিস বর্তমান স্টক', 'HO Current Stock', language), bold: true, color: WHITE, size: 16 })],
                }),
              ],
            }),
            new TableCell({
              borders: cellBorders,
              margins: defaultCellMargins,
              shading: { fill: NAVY_COLOR },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: tr('ফরিদ ভাই প্রেসে অবশিষ্ট স্টক', 'Farid Bhai Press Stock', language), bold: true, color: WHITE, size: 16 })],
                }),
              ],
            }),
            new TableCell({
              borders: cellBorders,
              margins: defaultCellMargins,
              shading: { fill: NAVY_COLOR },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: tr('মোট বিক্রিত কপি', 'Total Sold Copies', language), bold: true, color: WHITE, size: 16 })],
                }),
              ],
            }),
            new TableCell({
              borders: cellBorders,
              margins: defaultCellMargins,
              shading: { fill: NAVY_COLOR },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: tr('মোট বিক্রয় মূল্য (রাজস্ব)', 'Total Sales Revenue', language), bold: true, color: WHITE, size: 16 })],
                }),
              ],
            }),
            new TableCell({
              borders: cellBorders,
              margins: defaultCellMargins,
              shading: { fill: NAVY_COLOR },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: tr('মোট নিট লাভ (প্রফিট)', 'Total Net Profit', language), bold: true, color: WHITE, size: 16 })],
                }),
              ],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              borders: cellBorders,
              margins: defaultCellMargins,
              shading: { fill: WHITE },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: `${formatNumber(totalHOStock, language)} ${tr('কপি', 'copies', language)}`, bold: true, size: 20 })],
                }),
              ],
            }),
            new TableCell({
              borders: cellBorders,
              margins: defaultCellMargins,
              shading: { fill: WHITE },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: `${formatNumber(totalPressStock, language)} ${tr('কপি', 'copies', language)}`, bold: true, size: 20 })],
                }),
              ],
            }),
            new TableCell({
              borders: cellBorders,
              margins: defaultCellMargins,
              shading: { fill: WHITE },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: `${formatNumber(totalSold, language)} ${tr('কপি', 'copies', language)}`, bold: true, size: 20 })],
                }),
              ],
            }),
            new TableCell({
              borders: cellBorders,
              margins: defaultCellMargins,
              shading: { fill: WHITE },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: formatBDT(totalRevenue, language), bold: true, size: 20, color: NAVY_DARK })],
                }),
              ],
            }),
            new TableCell({
              borders: cellBorders,
              margins: defaultCellMargins,
              shading: { fill: WHITE },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: formatBDT(totalProfit, language), bold: true, size: 20, color: '059669' })],
                }),
              ],
            }),
          ],
        }),
      ],
    }),
    new Paragraph({ spacing: { after: 240 } })
  );

  // ==============================================================
  // 3. BOOK-WISE PERFORMANCE TABLE
  // ==============================================================
  if (salesMode !== 'none') {
    children.push(
      new Paragraph({
        spacing: { after: 100 },
        children: [
          new TextRun({
            text: tr('১. বই ভিত্তিক স্টক ও বিক্রয় কর্মক্ষমতা তালিকা', '1. Book-wise Stock & Sales Performance', language),
            bold: true,
            size: 20,
            color: NAVY_COLOR,
            font: 'Segoe UI',
          }),
        ],
      })
    );

    const tableRows: TableRow[] = [];

    // Header Row
    const headerTitles = [
      tr('নং', 'SL', language),
      tr('বইয়ের নাম', 'Book Title', language),
      tr('বিক্রয় মূল্য', 'Price', language),
      tr('প্রেস স্টক', 'Press Stock', language),
      tr('হেড অফিস স্টক', 'HO Stock', language),
      tr('অনলাইন বিক্রি', 'Online Sold', language),
      tr('অফলাইন বিক্রি', 'Offline Sold', language),
      tr('সর্বমোট বিক্রি', 'Total Sold', language),
      tr('মোট রাজস্ব (টাকা)', 'Revenue (BDT)', language),
      tr('নিট লাভ (টাকা)', 'Net Profit (BDT)', language),
    ];

    tableRows.push(
      new TableRow({
        children: headerTitles.map((title, i) =>
          new TableCell({
            borders: cellBorders,
            margins: defaultCellMargins,
            shading: { fill: NAVY_COLOR },
            children: [
              new Paragraph({
                alignment: i === 1 ? AlignmentType.LEFT : AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: title,
                    bold: true,
                    color: WHITE,
                    size: 15,
                  }),
                ],
              }),
            ],
          })
        ),
      })
    );

    // Book Rows
    bookMetricsList.forEach(({ book, metrics, sl }) => {
      const isEven = sl % 2 === 0;
      tableRows.push(
        new TableRow({
          children: [
            // SL
            new TableCell({
              borders: cellBorders,
              margins: defaultCellMargins,
              shading: { fill: isEven ? ZEBRA_BG : WHITE },
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: formatNumber(sl, language), size: 16 })] })],
            }),
            // Title
            new TableCell({
              borders: cellBorders,
              margins: defaultCellMargins,
              shading: { fill: isEven ? ZEBRA_BG : WHITE },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: book.bookName, bold: true, size: 16 }),
                    ...(book.edition ? [new TextRun({ text: ` [${book.edition}]`, size: 14, color: '1E3A8A', bold: true })] : []),
                    ...(book.publishMonth ? [new TextRun({ text: ` (${book.publishMonth})`, size: 13, color: '64748B' })] : []),
                  ],
                }),
              ],
            }),
            // Price
            new TableCell({
              borders: cellBorders,
              margins: defaultCellMargins,
              shading: { fill: isEven ? ZEBRA_BG : WHITE },
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `৳${formatNumber(book.perBookAmount, language)}`, size: 16 })] })],
            }),
            // Press Stock
            new TableCell({
              borders: cellBorders,
              margins: defaultCellMargins,
              shading: { fill: isEven ? ZEBRA_BG : WHITE },
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: formatNumber(metrics.stockToFaridBhai, language), size: 16 })] })],
            }),
            // HO Stock
            new TableCell({
              borders: cellBorders,
              margins: defaultCellMargins,
              shading: { fill: isEven ? ZEBRA_BG : WHITE },
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: formatNumber(metrics.totalPresentStockHO, language), size: 16, bold: true })] })],
            }),
            // Online Sold
            new TableCell({
              borders: cellBorders,
              margins: defaultCellMargins,
              shading: { fill: isEven ? ZEBRA_BG : WHITE },
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: formatNumber(metrics.totalOnlineSell, language), size: 16 })] })],
            }),
            // Offline Sold
            new TableCell({
              borders: cellBorders,
              margins: defaultCellMargins,
              shading: { fill: isEven ? ZEBRA_BG : WHITE },
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: formatNumber(metrics.totalOfflineSell, language), size: 16 })] })],
            }),
            // Total Sold
            new TableCell({
              borders: cellBorders,
              margins: defaultCellMargins,
              shading: { fill: isEven ? ZEBRA_BG : WHITE },
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: formatNumber(metrics.totalSold, language), size: 16, bold: true })] })],
            }),
            // Revenue
            new TableCell({
              borders: cellBorders,
              margins: defaultCellMargins,
              shading: { fill: isEven ? ZEBRA_BG : WHITE },
              children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: formatBDT(metrics.totalRevenue, language), size: 16 })] })],
            }),
            // Profit
            new TableCell({
              borders: cellBorders,
              margins: defaultCellMargins,
              shading: { fill: isEven ? ZEBRA_BG : WHITE },
              children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: formatBDT(metrics.totalNetProfit, language), size: 16, bold: true, color: metrics.totalNetProfit >= 0 ? '059669' : 'DC2626' })] })],
            }),
          ],
        })
      );
    });

    // Total Row
    tableRows.push(
      new TableRow({
        children: [
          new TableCell({
            borders: cellBorders,
            margins: defaultCellMargins,
            shading: { fill: TOTAL_BG },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '•', bold: true, size: 16 })] })],
          }),
          new TableCell({
            borders: cellBorders,
            margins: defaultCellMargins,
            shading: { fill: TOTAL_BG },
            children: [new Paragraph({ children: [new TextRun({ text: tr('সর্বমোট যোগফল:', 'Grand Total:', language), bold: true, size: 16 })] })],
          }),
          new TableCell({
            borders: cellBorders,
            margins: defaultCellMargins,
            shading: { fill: TOTAL_BG },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '-', bold: true, size: 16 })] })],
          }),
          new TableCell({
            borders: cellBorders,
            margins: defaultCellMargins,
            shading: { fill: TOTAL_BG },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: formatNumber(totalPressStock, language), bold: true, size: 16 })] })],
          }),
          new TableCell({
            borders: cellBorders,
            margins: defaultCellMargins,
            shading: { fill: TOTAL_BG },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: formatNumber(totalHOStock, language), bold: true, size: 16 })] })],
          }),
          new TableCell({
            borders: cellBorders,
            margins: defaultCellMargins,
            shading: { fill: TOTAL_BG },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: formatNumber(totalOnlineSold, language), bold: true, size: 16 })] })],
          }),
          new TableCell({
            borders: cellBorders,
            margins: defaultCellMargins,
            shading: { fill: TOTAL_BG },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: formatNumber(totalOfflineSold, language), bold: true, size: 16 })] })],
          }),
          new TableCell({
            borders: cellBorders,
            margins: defaultCellMargins,
            shading: { fill: TOTAL_BG },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: formatNumber(totalSold, language), bold: true, size: 16 })] })],
          }),
          new TableCell({
            borders: cellBorders,
            margins: defaultCellMargins,
            shading: { fill: TOTAL_BG },
            children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: formatBDT(totalRevenue, language), bold: true, size: 16 })] })],
          }),
          new TableCell({
            borders: cellBorders,
            margins: defaultCellMargins,
            shading: { fill: TOTAL_BG },
            children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: formatBDT(totalProfit, language), bold: true, size: 16, color: totalProfit >= 0 ? '059669' : 'DC2626' })] })],
          }),
        ],
      })
    );

    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: tableRows,
      }),
      new Paragraph({ spacing: { after: 240 } })
    );
  }

  // ==============================================================
  // 4. PRESS ACCOUNTS & DUE SUMMARY
  // ==============================================================
  if (includePressAccounts) {
    children.push(
      new Paragraph({
        spacing: { after: 100 },
        children: [
          new TextRun({
            text: tr('২. ফরিদ ভাই প্রেস হিসাব ও আর্থিক ব্যালেন্স খতিয়ান', '2. Farid Bhai Press Financial Ledger & Balance', language),
            bold: true,
            size: 20,
            color: NAVY_COLOR,
            font: 'Segoe UI',
          }),
        ],
      }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                borders: cellBorders,
                margins: defaultCellMargins,
                shading: { fill: NAVY_COLOR },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: tr('মোট প্রেস অর্ডার বিল', 'Total Press Order Bill', language), bold: true, color: WHITE, size: 16 })],
                  }),
                ],
              }),
              new TableCell({
                borders: cellBorders,
                margins: defaultCellMargins,
                shading: { fill: NAVY_COLOR },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: tr('প্রেসে মোট পরিশোধিত টাকা', 'Total Paid to Press', language), bold: true, color: WHITE, size: 16 })],
                  }),
                ],
              }),
              new TableCell({
                borders: cellBorders,
                margins: defaultCellMargins,
                shading: { fill: NAVY_COLOR },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: tr('প্রেসের নিট বকেয়া / ব্যালেন্স', 'Press Net Due / Balance', language), bold: true, color: WHITE, size: 16 })],
                  }),
                ],
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                borders: cellBorders,
                margins: defaultCellMargins,
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: formatBDT(pressAccounts.totalOrderBill, language), bold: true, size: 18 })],
                  }),
                ],
              }),
              new TableCell({
                borders: cellBorders,
                margins: defaultCellMargins,
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: formatBDT(pressAccounts.totalPaidToPress, language), bold: true, size: 18 })],
                  }),
                ],
              }),
              new TableCell({
                borders: cellBorders,
                margins: defaultCellMargins,
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: pressAccounts.netDueOnOrder > 0
                          ? `${formatBDT(pressAccounts.netDueOnOrder, language)} (${tr('বকেয়া', 'Due', language)})`
                          : pressAccounts.netDueOnOrder < 0
                          ? `+${formatBDT(Math.abs(pressAccounts.netDueOnOrder), language)} (${tr('অগ্রিম জমা', 'Advance', language)})`
                          : tr('পরিশোধিত (৳০)', 'Settled (৳0)', language),
                        bold: true,
                        size: 18,
                        color: pressAccounts.netDueOnOrder > 0 ? 'DC2626' : '059669',
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      new Paragraph({ spacing: { after: 240 } })
    );
  }

  // ==============================================================
  // 5. PRESS PAYMENT VOUCHER TRANSACTIONS
  // ==============================================================
  if (includePressPayments && pressPayments.length > 0) {
    children.push(
      new Paragraph({
        spacing: { after: 100 },
        children: [
          new TextRun({
            text: tr('৩. প্রেসে পরিশোধিত পেমেন্ট ভাউচার হিস্ট্রি', '3. Press Payment Voucher Transaction History', language),
            bold: true,
            size: 20,
            color: NAVY_COLOR,
            font: 'Segoe UI',
          }),
        ],
      })
    );

    const paymentRows: TableRow[] = [
      new TableRow({
        children: [
          new TableCell({ borders: cellBorders, margins: defaultCellMargins, shading: { fill: NAVY_COLOR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: tr('তারিখ', 'Date', language), bold: true, color: WHITE, size: 15 })] })] }),
          new TableCell({ borders: cellBorders, margins: defaultCellMargins, shading: { fill: NAVY_COLOR }, children: [new Paragraph({ children: [new TextRun({ text: tr('বইয়ের নাম', 'Book Title', language), bold: true, color: WHITE, size: 15 })] })] }),
          new TableCell({ borders: cellBorders, margins: defaultCellMargins, shading: { fill: NAVY_COLOR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: tr('পেমেন্ট মাধ্যম', 'Method', language), bold: true, color: WHITE, size: 15 })] })] }),
          new TableCell({ borders: cellBorders, margins: defaultCellMargins, shading: { fill: NAVY_COLOR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: tr('ভাউচার / চেক নং', 'Voucher / Cheque No', language), bold: true, color: WHITE, size: 15 })] })] }),
          new TableCell({ borders: cellBorders, margins: defaultCellMargins, shading: { fill: NAVY_COLOR }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: tr('টাকার পরিমাণ', 'Amount (BDT)', language), bold: true, color: WHITE, size: 15 })] })] }),
        ],
      }),
    ];

    pressPayments.slice(0, 15).forEach((p, idx) => {
      const isEven = idx % 2 === 0;
      paymentRows.push(
        new TableRow({
          children: [
            new TableCell({ borders: cellBorders, margins: defaultCellMargins, shading: { fill: isEven ? ZEBRA_BG : WHITE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: p.date, size: 15 })] })] }),
            new TableCell({ borders: cellBorders, margins: defaultCellMargins, shading: { fill: isEven ? ZEBRA_BG : WHITE }, children: [new Paragraph({ children: [new TextRun({ text: p.bookName || tr('সকল বই বাবদ', 'General / All Books', language), size: 15 })] })] }),
            new TableCell({ borders: cellBorders, margins: defaultCellMargins, shading: { fill: isEven ? ZEBRA_BG : WHITE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: p.paymentMethod.toUpperCase(), size: 15 })] })] }),
            new TableCell({ borders: cellBorders, margins: defaultCellMargins, shading: { fill: isEven ? ZEBRA_BG : WHITE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: p.voucherNo || '-', size: 15 })] })] }),
            new TableCell({ borders: cellBorders, margins: defaultCellMargins, shading: { fill: isEven ? ZEBRA_BG : WHITE }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: formatBDT(p.amount, language), bold: true, size: 15 })] })] }),
          ],
        })
      );
    });

    children.push(
      new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: paymentRows }),
      new Paragraph({ spacing: { after: 240 } })
    );
  }

  // ==============================================================
  // 6. CHANNEL DUES & COLLECTIONS (Online & Offline)
  // ==============================================================
  if (includeOnlineDue || includeOfflineDue) {
    const relevantChannels = channelAccounts.channels.filter(ch => {
      if (includeOnlineDue && includeOfflineDue) return true;
      if (includeOnlineDue && !includeOfflineDue) return ch.type === 'online';
      if (!includeOnlineDue && includeOfflineDue) return ch.type === 'offline';
      return false;
    });

    children.push(
      new Paragraph({
        spacing: { after: 100 },
        children: [
          new TextRun({
            text: tr('৪. সেলস চ্যানেল ভিত্তিক বিক্রয়, আদায় ও বকেয়া ডিউ খতিয়ান', '4. Sales Channels Billing, Collections & Pending Dues', language),
            bold: true,
            size: 20,
            color: NAVY_COLOR,
            font: 'Segoe UI',
          }),
        ],
      })
    );

    const dueRows: TableRow[] = [
      new TableRow({
        children: [
          new TableCell({ borders: cellBorders, margins: defaultCellMargins, shading: { fill: NAVY_COLOR }, children: [new Paragraph({ children: [new TextRun({ text: tr('চ্যানেল / বিক্রেতা', 'Channel / Seller', language), bold: true, color: WHITE, size: 15 })] })] }),
          new TableCell({ borders: cellBorders, margins: defaultCellMargins, shading: { fill: NAVY_COLOR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: tr('ধরন', 'Type', language), bold: true, color: WHITE, size: 15 })] })] }),
          new TableCell({ borders: cellBorders, margins: defaultCellMargins, shading: { fill: NAVY_COLOR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: tr('বিক্রিত কপি', 'Sold Copies', language), bold: true, color: WHITE, size: 15 })] })] }),
          new TableCell({ borders: cellBorders, margins: defaultCellMargins, shading: { fill: NAVY_COLOR }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: tr('মোট বিল (টাকা)', 'Billed (BDT)', language), bold: true, color: WHITE, size: 15 })] })] }),
          new TableCell({ borders: cellBorders, margins: defaultCellMargins, shading: { fill: NAVY_COLOR }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: tr('আদায়কৃত টাকা', 'Collected (BDT)', language), bold: true, color: WHITE, size: 15 })] })] }),
          new TableCell({ borders: cellBorders, margins: defaultCellMargins, shading: { fill: NAVY_COLOR }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: tr('বকেয়া ডিউ', 'Pending Due', language), bold: true, color: WHITE, size: 15 })] })] }),
          new TableCell({ borders: cellBorders, margins: defaultCellMargins, shading: { fill: NAVY_COLOR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: tr('আদায় হার', 'Rate %', language), bold: true, color: WHITE, size: 15 })] })] }),
        ],
      }),
    ];

    relevantChannels.forEach((ch, idx) => {
      const isEven = idx % 2 === 0;
      dueRows.push(
        new TableRow({
          children: [
            new TableCell({ borders: cellBorders, margins: defaultCellMargins, shading: { fill: isEven ? ZEBRA_BG : WHITE }, children: [new Paragraph({ children: [new TextRun({ text: ch.name, bold: true, size: 15 })] })] }),
            new TableCell({ borders: cellBorders, margins: defaultCellMargins, shading: { fill: isEven ? ZEBRA_BG : WHITE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: ch.type === 'online' ? tr('অনলাইন', 'Online', language) : tr('অফলাইন', 'Offline', language), size: 15 })] })] }),
            new TableCell({ borders: cellBorders, margins: defaultCellMargins, shading: { fill: isEven ? ZEBRA_BG : WHITE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${formatNumber(ch.totalCopies, language)}`, size: 15 })] })] }),
            new TableCell({ borders: cellBorders, margins: defaultCellMargins, shading: { fill: isEven ? ZEBRA_BG : WHITE }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: formatBDT(ch.totalBilled, language), size: 15 })] })] }),
            new TableCell({ borders: cellBorders, margins: defaultCellMargins, shading: { fill: isEven ? ZEBRA_BG : WHITE }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: formatBDT(ch.totalCollected, language), size: 15, color: '059669' })] })] }),
            new TableCell({ borders: cellBorders, margins: defaultCellMargins, shading: { fill: isEven ? ZEBRA_BG : WHITE }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: formatBDT(ch.dueAmount, language), bold: true, size: 15, color: ch.dueAmount > 0 ? 'DC2626' : '059669' })] })] }),
            new TableCell({ borders: cellBorders, margins: defaultCellMargins, shading: { fill: isEven ? ZEBRA_BG : WHITE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${ch.collectionRate.toFixed(1)}%`, size: 15 })] })] }),
          ],
        })
      );
    });

    children.push(
      new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: dueRows }),
      new Paragraph({ spacing: { after: 240 } })
    );
  }

  // ==============================================================
  // 7. OFFICIAL SIGNATURES & VERIFICATION BLOCK
  // ==============================================================
  if (includeSignatures) {
    children.push(
      new Paragraph({
        spacing: { before: 200, after: 120 },
        children: [
          new TextRun({
            text: tr('অফিসিয়াল অনুমোদন ও যাচাইকরণ স্বাক্ষর:', 'Official Verification & Approval Signatures:', language),
            bold: true,
            size: 18,
            color: NAVY_DARK,
          }),
        ],
      }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                borders: { top: tableBorder, bottom: tableBorder, left: tableBorder, right: tableBorder },
                margins: { top: 200, bottom: 200, left: 140, right: 140 },
                children: [
                  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 240 }, children: [new TextRun({ text: '_______________________________', color: TEXT_MUTED })] }),
                  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 60 }, children: [new TextRun({ text: tr('প্রস্তুতকারী কর্মকর্তা', 'Prepared By', language), bold: true, size: 16 })] }),
                  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: tr('বিদ্যাবাড়ি পাবলিকেশন শাখা', 'Biddabari Publication Section', language), size: 14, color: TEXT_MUTED })] }),
                ],
              }),
              new TableCell({
                borders: { top: tableBorder, bottom: tableBorder, left: tableBorder, right: tableBorder },
                margins: { top: 200, bottom: 200, left: 140, right: 140 },
                children: [
                  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 240 }, children: [new TextRun({ text: '_______________________________', color: TEXT_MUTED })] }),
                  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 60 }, children: [new TextRun({ text: tr('হিসাব রক্ষণ কর্মকর্তা', 'Accounts & Finance Officer', language), bold: true, size: 16 })] }),
                  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: tr('হিসাব ও অডিট বিভাগ', 'Accounts & Audit Dept', language), size: 14, color: TEXT_MUTED })] }),
                ],
              }),
              new TableCell({
                borders: { top: tableBorder, bottom: tableBorder, left: tableBorder, right: tableBorder },
                margins: { top: 200, bottom: 200, left: 140, right: 140 },
                children: [
                  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 240 }, children: [new TextRun({ text: '_______________________________', color: TEXT_MUTED })] }),
                  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 60 }, children: [new TextRun({ text: tr('অনুমোদনকারী কর্তৃপক্ষ', 'Authorized Executive / CEO', language), bold: true, size: 16 })] }),
                  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: tr('বিদ্যাবাড়ি পাবলিকেশন ঢাকা', 'Biddabari Publication Dhaka', language), size: 14, color: TEXT_MUTED })] }),
                ],
              }),
            ],
          }),
        ],
      })
    );
  }

  // ==============================================================
  // 8. ASSEMBLE DOCUMENT WITH LANDSCAPE ORIENTATION
  // ==============================================================
  const doc = new Document({
    title: `Biddabari Publication Report - ${periodTitle}`,
    description: reportTitle,
    creator: 'Biddabari Publication System',
    sections: [
      {
        properties: {
          page: {
            size: {
              orientation: PageOrientation.LANDSCAPE,
            },
            margin: {
              top: 720,    // 0.5 inch
              bottom: 720,
              left: 720,
              right: 720,
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: 'Biddabari Publication • Official Executive Report',
                    size: 14,
                    color: TEXT_MUTED,
                    font: 'Segoe UI',
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: `${tr('পৃষ্ঠা ', 'Page ', language)}`,
                    size: 14,
                    color: TEXT_MUTED,
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 14,
                    bold: true,
                    color: NAVY_COLOR,
                  }),
                  new TextRun({
                    text: ` ${tr('এর মধ্যে ', ' of ', language)}`,
                    size: 14,
                    color: TEXT_MUTED,
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    size: 14,
                    bold: true,
                    color: NAVY_COLOR,
                  }),
                  new TextRun({
                    text: ` | ${tr('গোপনীয় ও অফিসিয়াল ব্যবহারের জন্য সংরক্ষিত', 'Confidential - For internal executive use only', language)}`,
                    size: 14,
                    color: TEXT_MUTED,
                  }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });

  // Pack and trigger native browser download
  const blob = await Packer.toBlob(doc);
  const cleanPeriod = periodTitle.replace(/[/\\?%*:|"<>]/g, '-');
  const fileName = `Biddabari_Report_${cleanPeriod}_${new Date().toISOString().split('T')[0]}.docx`;

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 2500);
}
