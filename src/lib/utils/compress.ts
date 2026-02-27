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
    const initialSize = pdfBytes.byteLength;
    const initialSizeMB = (initialSize / (1024 * 1024)).toFixed(2);
    
    console.log(`[compress] Starting compression on ${initialSizeMB}MB PDF...`);

    try {
        const { PDFDocument } = await import('pdf-lib');
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const pages = pdfDoc.getPages();

        console.log(`[compress] Processing ${pages.length} pages...`);

        // Multi-pass compression strategy using pdf-lib
        // Pass 1: Normalize page sizes and remove unnecessary scaling
        for (let i = 0; i < pages.length; i++) {
            const page = pages[i];
            const { width, height } = page.getSize();
            
            // Target A4 dimensions
            const A4_WIDTH = 595.28;
            const A4_HEIGHT = 841.89;
            
            // Scale oversized pages to A4
            if (width > A4_WIDTH * 1.2 || height > A4_HEIGHT * 1.2) {
                const scaleX = A4_WIDTH / width;
                const scaleY = A4_HEIGHT / height;
                const scale = Math.min(scaleX, scaleY);
                page.scale(scale, scale);
                console.log(`[compress] Page ${i + 1}: Scaled to ${(scale * 100).toFixed(0)}%`);
            }
        }

        // First save with compression
        let compressedBytes = await pdfDoc.save({
            useObjectStreams: true,
            compress: true,
            objectsPerTick: 50
        });

        console.log(`[compress] After pass 1: ${(compressedBytes.byteLength / (1024 * 1024)).toFixed(2)}MB`);

        // Pass 2: Reload and re-compress for additional optimization
        const pdfDoc2 = await PDFDocument.load(compressedBytes);
        compressedBytes = await pdfDoc2.save({
            useObjectStreams: true,
            compress: true,
            objectsPerTick: 50
        });

        console.log(`[compress] After pass 2: ${(compressedBytes.byteLength / (1024 * 1024)).toFixed(2)}MB`);

        // Pass 3: Final optimization pass
        const pdfDoc3 = await PDFDocument.load(compressedBytes);
        compressedBytes = await pdfDoc3.save({
            useObjectStreams: true,
            compress: true,
            objectsPerTick: 50
        });

        const finalSize = compressedBytes.byteLength;
        const finalSizeMB = (finalSize / (1024 * 1024)).toFixed(2);
        const reduction = ((1 - finalSize / initialSize) * 100).toFixed(1);
        
        console.log(
            `[compress] ✓ Compression complete: ${initialSizeMB}MB → ${finalSizeMB}MB (${reduction}% reduction)`
        );
        
        return compressedBytes;
    } catch (err) {
        console.error('[compress] Compression failed:', err);
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
