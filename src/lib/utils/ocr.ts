/**
 * OCR Metadata Extraction — Tesseract.js (Client-Side)
 * Dynamically imported to avoid blocking initial bundle.
 * Scans the first page ROI to extract document type, week, and school year.
 */

export interface DocMetadata {
    docType: 'DLL' | 'ISP' | 'ISR' | 'Unknown';
    weekNumber: number | null;
    schoolYear: string | null;
    subject: string | null;
    gradeLevel: string | null;
    rawText: string;
    confidence: number;
}

export async function extractMetadata(file: File): Promise<DocMetadata> {
    // 1. Handle PDF OCR/Extraction
    if (file.type === 'application/pdf') {
        try {
            const pdfjsLib = (window as any)['pdfjsLib'];
            // If PDF.js isn't loaded, try to load it dynamically or fallback
            if (!pdfjsLib) {
                console.warn('[ocr] PDF.js not found in global scope. OCR for PDF skipped.');
                return { docType: 'Unknown', weekNumber: null, schoolYear: null, subject: null, gradeLevel: null, rawText: '', confidence: 0 };
            }

            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            const page = await pdf.getPage(1);
            const textContent = await page.getTextContent();
            const text = textContent.items.map((item: any) => item.str).join(' ');

            const metadata = parseMetadata(text);
            return { ...metadata, confidence: 100 }; // Direct text extraction is 100% confident
        } catch (err) {
            console.error('[ocr] PDF extraction failed:', err);
            return { docType: 'Unknown', weekNumber: null, schoolYear: null, subject: null, gradeLevel: null, rawText: '', confidence: 0 };
        }
    }

    // 2. Handle Image OCR (Tesseract)
    if (!file.type.startsWith('image/')) {
        console.warn('[ocr] Skipping Tesseract for non-image file type:', file.type);
        return {
            docType: 'Unknown',
            weekNumber: null,
            schoolYear: null,
            subject: null,
            gradeLevel: null,
            rawText: '',
            confidence: 0
        };
    }

    const { createWorker } = await import('tesseract.js');
    const worker = await createWorker('eng');

    try {
        const dataUrl = await fileToDataUrl(file);
        const { data: { text, confidence } } = await worker.recognize(dataUrl);
        const metadata = parseMetadata(text);
        return { ...metadata, confidence };
    } finally {
        await worker.terminate();
    }
}

function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

export function parseMetadata(text: string): Omit<DocMetadata, 'confidence'> {
    const upper = text.toUpperCase();

    // Detect document type
    let docType: DocMetadata['docType'] = 'Unknown';
    if (/DAILY\s*LESSON\s*LOG|D\.?L\.?L\.?/i.test(upper)) {
        docType = 'DLL';
    } else if (/INSTRUCTIONAL\s*SUPERVISORY\s*PLAN|I\.?S\.?P\.?/i.test(upper)) {
        docType = 'ISP';
    } else if (/INSTRUCTIONAL\s*SUPERVISORY\s*REPORT|I\.?S\.?R\.?/i.test(upper)) {
        docType = 'ISR';
    }

    // Detect Subject
    let subject: string | null = null;
    const subjectPatterns = [
        { name: 'English', regex: /ENGLISH/i },
        { name: 'Filipino', regex: /FILIPINO/i },
        { name: 'Mathematics', regex: /MATHEMATICS|MATH/i },
        { name: 'Science', regex: /SCIENCE/i },
        { name: 'AP', regex: /ARALING\s*PANLIPUNAN|A\.?P\.?/i },
        { name: 'EsP', regex: /EDUKASYON\s*SA\s*PAGPAPAKATAO|E\.?S\.?P\.?/i },
        { name: 'MAPEH', regex: /MAPEH/i },
        { name: 'EPP', regex: /E\.?P\.?P\.?/i },
        { name: 'TLE', regex: /T\.?L\.?E\.?/i }
    ];

    for (const p of subjectPatterns) {
        if (p.regex.test(upper)) {
            subject = p.name;
            break;
        }
    }

    // Detect Grade Level
    const gradeMatch = upper.match(/GRADE\s*([1-9]|1[0-2])/) ||
        upper.match(/GR\.?\s*([1-9]|1[0-2])/);
    const gradeLevel = gradeMatch ? gradeMatch[1] : null;

    // Extract week number
    const weekMatch = upper.match(/WEEK\s*#?\s*(\d+)/);
    const weekNumber = weekMatch ? parseInt(weekMatch[1], 10) : null;

    // Extract school year
    const syMatch = text.match(/S\.?Y\.?\s*(\d{4}\s*[-–]\s*\d{4})/i) ||
        text.match(/(\d{4}\s*[-–]\s*\d{4})/);
    const schoolYear = syMatch ? syMatch[1].replace(/\s/g, '') : null;

    return { docType, weekNumber, schoolYear, subject, gradeLevel, rawText: text };
}

