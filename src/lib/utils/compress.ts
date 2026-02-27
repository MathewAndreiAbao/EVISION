/**
 * Client-Side Compression
 * Automatically compresses files larger than 1MB to optimize storage.
 * Uses browser-image-compression for images and pdf-lib for PDFs.
 */

const MAX_SIZE_BYTES = 1024 * 1024; // 1MB ideal target
const COMPRESSION_QUALITY = 0.6; // 60% quality for compression
const ABSOLUTE_MAX_SIZE = 10 * 1024 * 1024; // 10MB absolute limit (before compression attempt)

export async function compressFile(
    pdfBytes: Uint8Array,
    _maxSizeKb: number = 1024
): Promise<Uint8Array> {
    // If already under limit, return as-is
    if (pdfBytes.byteLength <= MAX_SIZE_BYTES) {
        console.log(
            `[compress] File is ${(pdfBytes.byteLength / 1024).toFixed(0)}KB, ` +
            `within ${MAX_SIZE_BYTES / 1024}KB target.`
        );
        return pdfBytes;
    }

    console.log(
        `[compress] PDF is ${(pdfBytes.byteLength / 1024).toFixed(0)}KB, ` +
        `exceeds ${MAX_SIZE_BYTES / 1024}KB target. Attempting compression...`
    );

    try {
        const compressed = await compressPdfContent(pdfBytes);
        console.log(
            `[compress] Compression result: ${(compressed.byteLength / 1024).toFixed(0)}KB ` +
            `(${((1 - compressed.byteLength / pdfBytes.byteLength) * 100).toFixed(1)}% reduction)`
        );
        return compressed;
    } catch (err) {
        console.error('[compress] Compression failed, returning original:', err);
        return pdfBytes;
    }
}

async function compressPdfContent(pdfBytes: Uint8Array): Promise<Uint8Array> {
    const { PDFDocument } = await import('pdf-lib');

    try {
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const pages = pdfDoc.getPages();
        const initialSize = pdfBytes.byteLength;

        console.log(`[compress] Processing ${pages.length} pages for compression...`);

        // Aggressive compression techniques
        for (let i = 0; i < pages.length; i++) {
            const page = pages[i];
            
            // Scale down large pages (if width/height exceed A4)
            const { width, height } = page.getSize();
            const A4_WIDTH = 595.28;
            const A4_HEIGHT = 841.89;
            
            if (width > A4_WIDTH * 1.2 || height > A4_HEIGHT * 1.2) {
                const scaleX = Math.min(1, A4_WIDTH / width);
                const scaleY = Math.min(1, A4_HEIGHT / height);
                const scale = Math.min(scaleX, scaleY);
                
                if (scale < 1) {
                    console.log(`[compress] Page ${i + 1}: Scaling down by ${(scale * 100).toFixed(0)}%`);
                    page.scale(scale, scale);
                }
            }
        }

        // Save with aggressive compression settings
        const compressedPdfBytes = await pdfDoc.save({
            useObjectStreams: true,  // Compress object streams
            objectsPerTick: 50,       // Optimize processing
            updateFieldAppearances: false, // Skip unnecessary updates
        });

        const reduction = ((1 - compressedPdfBytes.byteLength / initialSize) * 100);
        console.log(
            `[compress] Compression achieved: ${(initialSize / 1024).toFixed(0)}KB → ` +
            `${(compressedPdfBytes.byteLength / 1024).toFixed(0)}KB (${reduction.toFixed(1)}% reduction)`
        );

        return compressedPdfBytes;
    } catch (err) {
        console.error('[compress] PDF compression failed:', err);
        throw err;
    }
}

export async function compressImage(file: File, maxSizeKb: number = 1024): Promise<File> {
    if (file.size <= maxSizeKb * 1024) {
        console.log(
            `[compress] Image is ${(file.size / 1024).toFixed(0)}KB, ` +
            `within ${maxSizeKb}KB target.`
        );
        return file;
    }

    console.log(
        `[compress] Image is ${(file.size / 1024).toFixed(0)}KB, ` +
        `exceeds ${maxSizeKb}KB target. Compressing...`
    );

    const imageCompression = (await import('browser-image-compression')).default;

    return await imageCompression(file, {
        maxSizeMB: maxSizeKb / 1024,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: file.type as string
    });
}
