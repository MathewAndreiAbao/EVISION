/**
 * DOCX → PDF Transcoding — mammoth.js + pdf-lib
 * All processing happens client-side.
 * The original Word document never leaves the teacher's device.
 */

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export interface TranscodeResult {
    pdfBytes: Uint8Array;
    text?: string;
}

export async function transcodeToPdf(file: File): Promise<TranscodeResult> {
    const ext = file.name.split('.').pop()?.toLowerCase();

    console.log(`[transcode] Processing file: ${file.name} (${(file.size / 1024).toFixed(0)}KB)`);

    // If already PDF, return as-is
    if (ext === 'pdf') {
        const buffer = await file.arrayBuffer();
        console.log(`[transcode] File is already PDF, returning as-is`);
        return { pdfBytes: new Uint8Array(buffer) };
    }

    // DOCX → PDF pipeline
    if (ext === 'docx' || ext === 'doc') {
        console.log(`[transcode] Converting ${ext.toUpperCase()} to PDF`);
        return docxToPdf(file);
    }

    throw new Error(`Unsupported file type: .${ext}. Only .docx and .pdf files are accepted.`);
}

async function docxToPdf(file: File): Promise<TranscodeResult> {
    const mammoth = await import('mammoth');
    const buffer = await file.arrayBuffer();

    console.log('[transcode] Extracting content from DOCX...');

    // Extract HTML from DOCX with image handling
    const result = await mammoth.convertToHtml({ 
        arrayBuffer: buffer,
        styleMap: [
            'b => em', // Bold → emphasis
            'i => strong', // Italic → strong
            'u => u' // Underline preserved
        ]
    });
    const html = result.value;
    const rawText = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

    console.log(`[transcode] Extracted ${rawText.length} characters from DOCX`);

    // Parse HTML into structured content
    const content = htmlToContent(html);

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

    const PAGE_WIDTH = 595.28; // A4
    const PAGE_HEIGHT = 841.89;
    const MARGIN = 40;
    const FONT_SIZE = 10;
    const LINE_HEIGHT = FONT_SIZE * 1.4;
    const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN;

    let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    let y = PAGE_HEIGHT - MARGIN;
    const bottomMargin = MARGIN;

    for (const elem of content) {
        const currentFont = elem.bold ? boldFont : elem.italic ? italicFont : font;
        const fontSize = elem.heading ? 13 : FONT_SIZE;
        const lineH = elem.heading ? fontSize * 1.6 : LINE_HEIGHT;
        const spacing = elem.heading ? lineH * 0.4 : LINE_HEIGHT * 0.3;

        // Word-wrap text
        const lines = wrapText(elem.text, currentFont, fontSize, CONTENT_WIDTH);

        for (const line of lines) {
            // Check if we need a new page
            if (y < bottomMargin + lineH) {
                page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
                y = PAGE_HEIGHT - MARGIN;
            }

            page.drawText(line, {
                x: MARGIN,
                y,
                size: fontSize,
                font: currentFont,
                color: elem.heading ? rgb(0.0, 0.0, 0.0) : rgb(0.1, 0.1, 0.1)
            });

            y -= lineH;
        }

        // Add spacing after element
        y -= spacing;
    }

    console.log(`[transcode] Generated PDF with ${pdfDoc.getPageCount()} pages`);
    const pdfBytes = await pdfDoc.save();
    console.log(`[transcode] PDF conversion complete, size: ${(pdfBytes.byteLength / 1024).toFixed(0)}KB`);
    
    return { pdfBytes, text: rawText };
}

interface ContentElement {
    text: string;
    bold: boolean;
    italic: boolean;
    heading: boolean;
}

function htmlToContent(html: string): ContentElement[] {
    const content: ContentElement[] = [];

    // Parse HTML structure more intelligently
    const elements = html.match(/<[^>]+>|[^<]+/g) || [];
    let currentText = '';
    let isBold = false;
    let isItalic = false;
    let isHeading = false;

    for (const elem of elements) {
        if (elem.startsWith('<h')) {
            // Heading tag
            const headingMatch = elem.match(/<h([1-6])/);
            if (headingMatch) {
                if (currentText.trim()) {
                    content.push({
                        text: currentText.trim(),
                        bold: isBold,
                        italic: isItalic,
                        heading: isHeading
                    });
                    currentText = '';
                }
                isHeading = true;
            }
        } else if (elem.match(/<\/h/)) {
            // End heading
            isHeading = false;
            if (currentText.trim()) {
                content.push({
                    text: currentText.trim(),
                    bold: isBold,
                    italic: isItalic,
                    heading: isHeading
                });
                currentText = '';
            }
        } else if (elem.match(/<(b|strong)/)) {
            isBold = true;
        } else if (elem.match(/<\/(b|strong)>/)) {
            isBold = false;
        } else if (elem.match(/<(i|em)/)) {
            isItalic = true;
        } else if (elem.match(/<\/(i|em)>/)) {
            isItalic = false;
        } else if (elem.match(/<(p|div|li|tr|td)/)) {
            // Start new block
            if (currentText.trim()) {
                content.push({
                    text: currentText.trim(),
                    bold: isBold,
                    italic: isItalic,
                    heading: isHeading
                });
                currentText = '';
            }
        } else if (elem.match(/<\/(p|div|li|tr|td)>|<br\s*\/?>/)) {
            // End block or line break
            if (currentText.trim()) {
                content.push({
                    text: currentText.trim(),
                    bold: isBold,
                    italic: isItalic,
                    heading: isHeading
                });
                currentText = '';
            }
        } else if (!elem.startsWith('<')) {
            // Text content
            const text = stripHtml(elem).trim();
            if (text) {
                currentText += (currentText ? ' ' : '') + text;
            }
        }
    }

    // Add any remaining text
    if (currentText.trim()) {
        content.push({
            text: currentText.trim(),
            bold: isBold,
            italic: isItalic,
            heading: isHeading
        });
    }

    return content.length > 0 ? content : [{
        text: stripHtml(html).trim() || 'Empty document',
        bold: false,
        italic: false,
        heading: false
    }];
}

function stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
}

function wrapText(text: string, font: any, fontSize: number, maxWidth: number): string[] {
    if (!text) return [''];
    
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const width = font.widthOfTextAtSize(testLine, fontSize);

        if (width > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
        } else {
            currentLine = testLine;
        }
    }

    if (currentLine) {
        lines.push(currentLine);
    }

    return lines.length > 0 ? lines : [''];
}
