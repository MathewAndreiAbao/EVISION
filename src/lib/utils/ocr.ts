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
    language: 'English' | 'Filipino' | 'Unknown';
    school: string | null;
    teacher: string | null;
}

export interface DLLContent {
    metadata: DocMetadata;
    contentStandards: string[];
    performanceStandards: string[];
    learningCompetencies: string[];
    content: string[];
    learningActivities: string[];
    resources: string[];
    assessment: string[];
    remarks: string | null;
}

export async function extractMetadata(file: File): Promise<DocMetadata> {
    // 1. Handle PDF OCR/Extraction
    if (file.type === 'application/pdf') {
        try {
            const pdfjsLib = (window as any)['pdfjsLib'];
            if (!pdfjsLib) {
                console.warn('[ocr] PDF.js not found. OCR for PDF skipped.');
                return createDefaultMetadata();
            }

            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            const page = await pdf.getPage(1);
            const textContent = await page.getTextContent();
            const text = textContent.items.map((item: any) => item.str).join(' ');

            const metadata = parseMetadata(text);
            return { ...metadata, confidence: 100 };
        } catch (err) {
            console.error('[ocr] PDF extraction failed:', err);
            return createDefaultMetadata();
        }
    }

    // 2. Handle Image OCR (Tesseract - multilingual)
    if (!file.type.startsWith('image/')) {
        console.warn('[ocr] Skipping Tesseract for non-image file type:', file.type);
        return createDefaultMetadata();
    }

    const { createWorker } = await import('tesseract.js');
    
    try {
        const dataUrl = await fileToDataUrl(file);
        
        // Detect language first (quick scan with English)
        const engWorker = await createWorker('eng');
        const { data: { text: engText } } = await engWorker.recognize(dataUrl);
        await engWorker.terminate();
        
        const language = detectLanguage(engText);
        console.log(`[ocr] Detected language: ${language}`);
        
        // Use appropriate worker for full extraction
        const lang = language === 'Filipino' ? 'fil' : 'eng';
        const worker = await createWorker(lang);
        
        try {
            const { data: { text, confidence } } = await worker.recognize(dataUrl);
            const metadata = parseMetadata(text);
            return { ...metadata, confidence, language };
        } finally {
            await worker.terminate();
        }
    } catch (err) {
        console.error('[ocr] Image OCR failed:', err);
        return createDefaultMetadata();
    }
}

function createDefaultMetadata(): DocMetadata {
    return {
        docType: 'Unknown',
        weekNumber: null,
        schoolYear: null,
        subject: null,
        gradeLevel: null,
        rawText: '',
        confidence: 0,
        language: 'Unknown',
        school: null,
        teacher: null
    };
}

function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Extract and parse DLL content from a document
 * Supports both English and Filipino DLL documents
 */
export async function extractDLLContent(file: File): Promise<DLLContent> {
    const { parseDLLContent } = await import('./dll-parser');
    
    console.log('[ocr] Extracting DLL content from file:', file.name);
    
    const metadata = await extractMetadata(file);
    
    if (metadata.docType !== 'DLL') {
        console.warn('[ocr] Document is not a DLL, parsing as DLL anyway...');
    }
    
    const dllContent = await parseDLLContent(metadata.rawText, metadata);
    return dllContent;
}

function detectLanguage(text: string): 'English' | 'Filipino' | 'Unknown' {
    const upper = text.toUpperCase();
    
    // Filipino/Tagalog indicators
    const filipinoPatterns = [
        /PAARALAN|GURO|PETSA|ORAS|BAITANG|ASIGNATURA|MARKAHAN|LUNES|MARTES|MIYERKULES|HUWEBES|BIYERNES/,
        /NILALAMAN|PAMANTAYAN|KASANAYAN|KURIKULUM|LAYUNIN|GAWAIN/,
        /EDUKASYON\s*SA\s*PAGPAPAKATAO|ARALING\s*PANLIPUNAN|PILIPINAS/
    ];
    
    // English indicators  
    const englishPatterns = [
        /SCHOOL|TEACHER|DATE|TIME|GRADE|SUBJECT|MARK|MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY/,
        /CONTENT|STANDARDS|COMPETENCIES|ACTIVITIES|ASSESSMENT|RESOURCES/,
        /LEARNING\s*OBJECTIVES|PERFORMANCE|QUARTER|WEEK/
    ];
    
    let filipinoScore = 0;
    let englishScore = 0;
    
    for (const pattern of filipinoPatterns) {
        const matches = text.match(pattern);
        filipinoScore += matches ? matches.length : 0;
    }
    
    for (const pattern of englishPatterns) {
        const matches = text.match(pattern);
        englishScore += matches ? matches.length : 0;
    }
    
    if (filipinoScore > englishScore && filipinoScore > 0) return 'Filipino';
    if (englishScore > filipinoScore && englishScore > 0) return 'English';
    return 'Unknown';
}

export function parseMetadata(text: string): Omit<DocMetadata, 'confidence' | 'language'> {
    const upper = text.toUpperCase();

    // Detect document type
    let docType: DocMetadata['docType'] = 'Unknown';
    if (/DAILY\s*LESSON\s*(LOG|PLAN)|D\.?L\.?L\.?|DETALYADONG\s*PLANO|ARAW-ARAW\s*LEKSYON/i.test(upper)) {
        docType = 'DLL';
    } else if (/INSTRUCTIONAL\s*SUPERVISORY\s*PLAN|I\.?S\.?P\.?/i.test(upper)) {
        docType = 'ISP';
    } else if (/INSTRUCTIONAL\s*SUPERVISORY\s*REPORT|I\.?S\.?R\.?/i.test(upper)) {
        docType = 'ISR';
    }

    // Detect Subject (both English and Filipino)
    let subject: string | null = null;
    const subjectPatterns = [
        { name: 'English', regex: /ENGLISH|WIKA/i },
        { name: 'Filipino', regex: /FILIPINO|TAGALOG|WIKANG\s*PILIPINO/i },
        { name: 'Mathematics', regex: /MATHEMATICS|MATH|MATEMATIKA/i },
        { name: 'Science', regex: /SCIENCE|AGHAM/i },
        { name: 'AP', regex: /ARALING\s*PANLIPUNAN|A\.?P\.?|SOCIAL\s*STUDIES/i },
        { name: 'GMRC', regex: /EDUKASYON\s*SA\s*PAGPAPAKATAO|E\.?S\.?P\.?|GMRC|VALUES|MORAL/i },
        { name: 'MAPEH', regex: /MAPEH|ARTS|MUSIC|PHYSICAL|HEALTH|PE/i },
        { name: 'EPP', regex: /E\.?P\.?P\.?|EDUKASYON.*PRODUKTIBO|VOCATIONAL/i },
        { name: 'TLE', regex: /T\.?L\.?E\.?|TECHNOLOGY.*LIVELIHOOD/i }
    ];

    for (const p of subjectPatterns) {
        if (p.regex.test(upper)) {
            subject = p.name;
            break;
        }
    }

    // Detect Grade/Level (Filipino: Baitang, English: Grade)
    const gradeMatch = upper.match(/(?:GRADE|GR\.?|BAITANG|ANTAS)\s*([1-9]|1[0-2])/) ||
        upper.match(/(?:GRADE|GR\.?|BAITANG|ANTAS)\s*([A-Z]+)/);
    const gradeLevel = gradeMatch ? gradeMatch[1] : null;

    // Extract week number
    const weekMatch = upper.match(/(?:WEEK|LINGGO)\s*#?\s*(\d+)/);
    const weekNumber = weekMatch ? parseInt(weekMatch[1], 10) : null;

    // Extract school year
    const syMatch = text.match(/S\.?Y\.?\s*(\d{4}\s*[-–]\s*\d{4})/i) ||
        text.match(/(\d{4}\s*[-–]\s*\d{4})/);
    const schoolYear = syMatch ? syMatch[1].replace(/\s/g, '') : null;

    // Extract school name (Filipino: Paaralan, English: School)
    const schoolMatch = text.match(/(?:SCHOOL|PAARALAN)\s*:?\s*([^\n]+)/i);
    const school = schoolMatch ? schoolMatch[1].trim() : null;

    // Extract teacher name (Filipino: Guro, English: Teacher)
    const teacherMatch = text.match(/(?:TEACHER|GURO|EDUCATOR)\s*:?\s*([^\n]+)/i);
    const teacher = teacherMatch ? teacherMatch[1].trim() : null;

    return { 
        docType, 
        weekNumber, 
        schoolYear, 
        subject, 
        gradeLevel, 
        rawText: text,
        school,
        teacher
    };
}

