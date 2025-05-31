import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { title, content, metadata } = await req.json();
    console.log('PDF Export Request:', { title, content, metadata });

    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
    const { width, height } = page.getSize();

    // Add title
    // pdf-lib does not support color: use default black
    page.drawText(title || 'Note', {
      x: 50,
      y: height - 80,
      size: 24,
    });

    // Add content (plain text for now)
    const text = content.replace(/<[^>]+>/g, ''); // Strip HTML tags
    page.drawText(text, {
      x: 50,
      y: height - 120,
      size: 12,
      maxWidth: width - 100,
    });

    // Add metadata (optional)
    if (metadata) {
      page.drawText(`Matter: ${metadata.matterId || ''}`, { x: 50, y: 60, size: 10 });
      page.drawText(`Author: ${metadata.author || ''}`, { x: 50, y: 45, size: 10 });
      page.drawText(`Created: ${metadata.createdAt || ''}`, { x: 50, y: 30, size: 10 });
      page.drawText(`Updated: ${metadata.updatedAt || ''}`, { x: 50, y: 15, size: 10 });
    }

    const pdfBytes = await pdfDoc.save();
    console.log('PDF Export Success: PDF generated, size:', pdfBytes.length);

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${title || 'note'}.pdf"`,
      },
    });
  } catch (err: any) {
    console.error('PDF Export Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to generate PDF' }, { status: 500 });
  }
} 