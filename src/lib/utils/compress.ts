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
    
    console.log(`[compress] Starting aggressive compression on ${initialSizeMB}MB PDF...`);

    try {
        // Try canvas-based compression first (most effective for image-heavy PDFs)
        const compressed = await compressPdfViaCanvas(pdfBytes);
        
        const finalSize = compressed.byteLength;
        const finalSizeMB = (finalSize / (1024 * 1024)).toFixed(2);
        const reduction = ((1 - finalSize / initialSize) * 100).toFixed(1);
        
        console.log(
            `[compress] ✓ Compression complete: ${initialSizeMB}MB → ${finalSizeMB}MB (${reduction}% reduction)`
        );
        
        return compressed;
    } catch (canvasErr) {
        console.warn('[compress] Canvas compression failed, falling back to structural optimization...', canvasErr);
        return await compressPdfStructural(pdfBytes);
    }
}

async function compressPdfViaCanvas(pdfBytes: Uint8Array): Promise<Uint8Array> {
    try {
        // Use pdfjs-dist to render PDF pages to canvas, then save as compressed JPEG
        const pdfjsLib = await import('pdfjs-dist');
        const { PDFDocument } = await import('pdf-lib');
        
        // Set up worker
        pdfjsLib.default.GlobalWorkerOptions.workerSrc = 
            `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.default.version}/pdf.worker.min.js`;

        const pdf = await pdfjsLib.default.getDocument({ data: pdfBytes }).promise;
        const newPdf = await PDFDocument.create();
        const pageCount = pdf.numPages;

        console.log(`[compress] Rendering ${pageCount} pages to canvas for recompression...`);

        for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale: 1.25 }); // 125% DPI for quality
            
            // Use OffscreenCanvas if available (modern browsers)
            let canvas: HTMLCanvasElement | OffscreenCanvas;
            let ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
            
            if (typeof OffscreenCanvas !== 'undefined') {
                canvas = new OffscreenCanvas(viewport.width, viewport.height);
                ctx = canvas.getContext('2d');
            } else {
                // Fallback for environments without OffscreenCanvas
                const doc = typeof document !== 'undefined' ? document : null;
                if (!doc) throw new Error('OffscreenCanvas not available and DOM not accessible');
                canvas = doc.createElement('canvas');
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                ctx = canvas.getContext('2d');
            }

            if (!ctx) throw new Error('Failed to get canvas context');

            // Render PDF page to canvas
            await page.render({
                canvasContext: ctx,
                viewport: viewport
            }).promise;

            // Convert canvas to JPEG image data with compression
            const imageData = await canvasToJpeg(canvas, 0.75); // 75% JPEG quality
            const image = await newPdf.embedJpg(imageData);
            
            // Add page with rendered image
            const pdfPage = newPdf.addPage([viewport.width, viewport.height]);
            pdfPage.drawImage(image, {
                x: 0,
                y: 0,
                width: viewport.width,
                height: viewport.height
            });

            if (pageNum % 5 === 0) {
                console.log(`[compress] Processed ${pageNum}/${pageCount} pages...`);
            }
        }

        // Save with maximum compression
        const compressedBytes = await newPdf.save({
            useObjectStreams: true,
            compress: true
        });

        return compressedBytes;
    } catch (err) {
        throw new Error(`Canvas compression failed: ${err instanceof Error ? err.message : String(err)}`);
    }
}

async function canvasToJpeg(
    canvas: HTMLCanvasElement | OffscreenCanvas,
    quality: number
): Promise<string> {
    return new Promise((resolve, reject) => {
        try {
            if ('convertToBlob' in canvas) {
                // OffscreenCanvas
                (canvas as OffscreenCanvas).convertToBlob({ type: 'image/jpeg', quality }).then((blob) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });
            } else {
                // HTMLCanvasElement
                const dataUrl = (canvas as HTMLCanvasElement).toDataURL('image/jpeg', quality);
                resolve(dataUrl);
            }
        } catch (err) {
            reject(err);
        }
    });
}

async function compressPdfStructural(pdfBytes: Uint8Array): Promise<Uint8Array> {
    const { PDFDocument } = await import('pdf-lib');
    const initialSize = pdfBytes.byteLength;

    console.log(`[compress] Applying structural optimization...`);

    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();

    // Scale down pages to A4 if needed
    for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const { width, height } = page.getSize();
        const A4_WIDTH = 595.28;
        const A4_HEIGHT = 841.89;
        
        if (width > A4_WIDTH * 1.1 || height > A4_HEIGHT * 1.1) {
            const scale = Math.min(A4_WIDTH / width, A4_HEIGHT / height);
            page.scale(scale, scale);
        }
    }

    // Save with compression
    const compressedBytes = await pdfDoc.save({
        useObjectStreams: true,
        compress: true,
    });

    const reduction = ((1 - compressedBytes.byteLength / initialSize) * 100).toFixed(1);
    console.log(
        `[compress] Structural: ${(initialSize / (1024 * 1024)).toFixed(2)}MB → ` +
        `${(compressedBytes.byteLength / (1024 * 1024)).toFixed(2)}MB (${reduction}% reduction)`
    );

    return compressedBytes;
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
