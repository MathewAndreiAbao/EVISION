# Smart E-VISION: Technical Documentation
**Educational Supervision & Archiving System**

## 1. System Architecture
Smart E-VISION is built on a modern **SvelteKit** frontend with a **Supabase** backend, utilizing an **Offline-First** architecture.

### core Stack
- **Frontend**: SvelteKit 5 (Runes), TailwindCSS
- **Backend**: Supabase (Auth, PostgreSQL, Storage, Realtime)
- **Local Storage**: IndexedDB (via idb-keyval)
- **Processing**: Tesseract.js (OCR), pdf-lib (QR Stamping), browser-image-compression

## 2. Database Schema
The system uses 6 core tables with strict RLS (Row Level Security) policies.

| Table | Description |
|-------|-------------|
| `profiles` | User profiles with role-based access levels (Teacher, Supervisor, etc.) |
| `submissions` | Central archive for all uploaded documents with SHA-256 hashes. |
| `schools` | Institutional data linked to districts. |
| `districts` | Regional organization layer for supervisors. |
| `academic_calendar` | Managed deadlines and academic weeks. |
| `teaching_loads` | Assignment tracking for teachers (Subject + Grade). |

## 3. Upload Pipeline
Each file undergoes a 5-phase integrity pipeline:
1. **Transcode**: Converts images/docs to standardized PDF.
2. **Compress**: Optimizes file size to <1MB.
3. **Hash**: Generates a SHA-256 digital fingerprint.
4. **Stamp**: Embeds a unique verification QR code.
5. **Sync**: Securely uploads to Supabase with duplicate detection.

## 4. API & Integration
- **Auth**: Email/Password via Supabase Auth.
- **OCR API**: Client-side extraction of Week Number, Subject, and Document Type.
- **Reporting**: Automated generation of CSV and PDF compliance reports.
- **Verification**: Public `/verify/[hash]` route for instant QR-based authenticity checks.
