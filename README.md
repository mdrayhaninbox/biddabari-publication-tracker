# Biddabari Publication - Book Management & Sales Tracking System

A modern, cloud-connected enterprise web application designed for **Biddabari Publication** to streamline book manufacturing, printing press workflows, multi-edition inventory, daily sales channels, library credit accounts, and voucher documentation.

🌐 **Live Application**: [biddabari-publication.vercel.app](https://biddabari-publication.vercel.app)

---

## 🌟 Key Features

### 1. 📚 Book & Multi-Edition Inventory Management
- **Automatic Edition Detection**: Intelligently identifies and displays edition badges (e.g., *1st Edition*, *2nd Edition*) for books sharing identical titles or varying retail prices.
- **Custom Category System**: Filter and categorize books with built-in categories (*NTRCA*, *Digest*) or create and delete custom categories on the fly.
- **Financial Breakdown per Book**: Real-time calculations of Printing Cost, MRP, Channel Commission, Profit per Copy, Head Office Stock, Press Stock, and Total Net Profit.

### 2. 🏭 Printing Press Operations Ledger
- **Registered Printing Presses**: Dedicated press profiles including Farid Bhai Press and support for adding custom printing and binding houses.
- **Press Order Slips**: Track lot-by-lot printing orders with lot names, order quantities, production costs, and digital photo slip attachments.
- **Press Delivery Chalans**: Record incoming book delivery chalans from presses with automatic inventory incrementation at the Head Office.
- **Press Payment Vouchers**: Manage payments made to printing presses with cheque/voucher photo upload and payment method tagging.

### 3. 🏪 Sales Channels & Library Credit Ledger
- **Multi-Channel Distribution**: Support for online eCommerce channels (e.g., Boibari, website) and offline distributor libraries (e.g., Nilkhet, Banglabazar, district outlets).
- **Accounts Receivable & Dues Tracking**: Real-time ledger of total copies supplied, total billed amount, collections received, and outstanding dues per library.
- **🖨️ Printable Collection Vouchers (10/Page)**: Formats collection receipts strictly 10 per standard A4 page for field collection officers.

### 4. 🧾 Centralized "Create Voucher" Quick Menu
- Prominent header dropdown allowing one-click creation of:
  - 💰 **Collection Voucher / Money Receipt** (Library collections)
  - 💳 **Press Payment Voucher** (Printing press settlements)
  - 🚚 **Press Delivery Chalan** (Book delivery receipts)
  - 📋 **Press Order Slip** (New lot printing orders)
  - 🖨️ **Print Collection Vouchers (10/Page)** (Printable A4 collection sheet)

### 5. 📁 File Storage & Digital Voucher Gallery
- **Centralized Voucher Gallery**: Aggregates all uploaded receipts, chalans, and payment photos from across all publication operations into a unified, category-filtered gallery.
- **Preview, Zoom & Print**: Built-in modal viewer with full zoom, high-resolution download, and one-click browser printing.
- **Digital Notebook**: Keep publication notes, meeting memos, and urgent reminders in color-coded sticky cards.
- **Document Repository**: Store important contracts, agreements, invoices, spreadsheets, and PDFs (up to 25MB per file).

### 6. 📊 30-Day Sales Matrix & Period Analytics
- **Day-by-Day Calendar Matrix**: Comprehensive 1st-to-31st daily sales and delivery breakdown for every book across all distribution channels.
- **Historical Period Navigation**: Seamlessly navigate through months and years with immediate data hydration and comparative statistics.

### 7. ☁️ Real-Time Cloud Sync & Spreadsheet Integration
- **Google Firebase Firestore**: Real-time bi-directional synchronization—changes update instantly across all team members and devices.
- **Offline Durability**: Double-layer client persistence using IndexedDB and LocalStorage for smooth offline operation.
- **Excel (.xlsx) Import & Export**: One-click full database backup and restore, complete with all ledgers, channels, and books.

### 8. 🎨 Multilingual & Multi-Theme Experience
- **Bilingual Interface**: Toggle effortlessly between Bengali (**বাংলা**) and English (**EN**).
- **Executive Color Themes**: Choose from Royal Navy Blue, Deep Emerald Green, or Classic Monochrome.
- **A4 Portrait Print Ready**: Clean, auto-paginated CSS print styling for professional corporate reports.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend Framework** | React 19, TypeScript, Vite |
| **Styling & UI** | Tailwind CSS v4, Lucide React Icons |
| **Typography** | Hind Siliguri & Inter (Google Fonts) |
| **Cloud Database** | Google Firebase Firestore |
| **Offline Persistence** | IndexedDB (`idb-keyval`) & LocalStorage |
| **Spreadsheet Engine** | SheetJS (`xlsx`) |
| **Deployment & Hosting** | Vercel & GitHub Actions |

---

## 🚀 Getting Started (Run Locally)

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/mdrayhaninbox/biddabari-publication-tracker.git
   cd biddabari-publication-tracker
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Build for production**:
   ```bash
   npm run build
   ```

---

## 📄 License & Copyright

© 2026 **Biddabari Publication**. All rights reserved.
