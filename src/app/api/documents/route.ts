import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getSupabase, isSupabaseConfigured } from '@/lib/db/supabase';
import { uploadLimiter, rateLimitResponse } from '@/lib/rate-limit';

const ALLOWED_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'text/plain',
];

export async function POST(request: NextRequest) {
  // Rate limiting for uploads
  const { allowed, resetAt } = uploadLimiter.check(request);
  if (!allowed) {
    return rateLimitResponse(resetAt);
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return Response.json({ error: 'No se proporcionó archivo' }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return Response.json({ 
        error: 'Formato no soportado. Usa PDF, PNG, JPG, WEBP o TXT' 
      }, { status: 400 });
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return Response.json({ error: 'El archivo excede 10MB' }, { status: 400 });
    }

    // Extract text based on file type
    let extractedText = '';
    const arrayBuffer = await file.arrayBuffer();
    
    if (file.type === 'application/pdf') {
      try {
        const { PDFParse } = await import('pdf-parse');
        const parser = new PDFParse({ data: arrayBuffer });
        const textResult = await parser.getText();
        extractedText = textResult.text;
        await parser.destroy();

        // If very little text, it's likely a scanned PDF
        if (extractedText.trim().length < 100) {
          extractedText = '';
          console.log('PDF has little text (scanned PDF detected)');
        }
      } catch (pdfErr) {
        console.warn('PDF parse failed:', pdfErr);
      }

      // If no text extracted, store the PDF base64 for Gemini multimodal analysis
      if (!extractedText || extractedText.trim().length < 100) {
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        extractedText = `[PDF_ESCANEDO:${file.name}] ${base64.substring(0, 100)}...[BASE64_LENGTH:${base64.length}]`;
      }
    } else if (file.type.startsWith('image/')) {
      // Store image base64 for Gemini multimodal analysis
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      extractedText = `[IMAGEN:${file.name}] ${base64.substring(0, 100)}...[BASE64_LENGTH:${base64.length}]`;
    } else if (file.type === 'text/plain') {
      extractedText = new TextDecoder().decode(arrayBuffer);
    }

    // If Supabase not configured, return extracted text directly (demo mode)
    if (!isSupabaseConfigured()) {
      return Response.json({
        success: true,
        demo: true,
        document: {
          id: crypto.randomUUID(),
          filename: file.name,
          size: file.size,
          textLength: extractedText.length,
          text: extractedText.substring(0, 10000),
        },
      });
    }

    const user = await getCurrentUser();
    const supabase = getSupabase();

    // Upload file to Supabase Storage (optional)
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = user ? `documents/${user.id}/${fileName}` : `documents/anonymous/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('legal-documents')
      .upload(filePath, new Uint8Array(arrayBuffer), {
        contentType: file.type,
      });

    if (uploadError) {
      console.warn('Storage upload failed (continuing):', uploadError.message);
    }

    // Save document record
    const { data: docRecord, error: docError } = await supabase
      .from('documents_uploaded')
      .insert({
        user_id: user?.id || null,
        filename: file.name,
        file_size: file.size,
        file_type: file.type,
        original_text: extractedText.substring(0, 50000),
        processed: false,
      })
      .select()
      .single();

    if (docError) throw docError;

    return Response.json({
      success: true,
      document: {
        id: docRecord.id,
        filename: file.name,
        size: file.size,
        textLength: extractedText.length,
      },
    });
  } catch (error) {
    console.error('Document upload error:', error);
    const message = error instanceof Error ? error.message : 'Error al subir documento';
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      // Demo mode: return empty list
      return Response.json({ documents: [] });
    }

    const user = await getCurrentUser();
    const supabase = getSupabase();
    const { searchParams } = new URL(request.url);
    const docId = searchParams.get('id');

    if (docId) {
      let query = supabase
        .from('documents_uploaded')
        .select('*')
        .eq('id', docId);

      if (user) {
        query = query.eq('user_id', user.id);
      } else {
        query = query.is('user_id', null);
      }

      const { data, error } = await query.single();
      if (error) throw error;
      return Response.json({ document: data });
    }

    let query = supabase
      .from('documents_uploaded')
      .select('id, filename, file_size, file_type, processed, created_at')
      .order('created_at', { ascending: false })
      .limit(50);

    if (user) {
      query = query.eq('user_id', user.id);
    } else {
      query = query.is('user_id', null);
    }

    const { data, error } = await query;
    if (error) throw error;

    return Response.json({ documents: data });
  } catch (error) {
    console.error('Documents list error:', error);
    const message = error instanceof Error ? error.message : 'Error al listar documentos';
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  // Process document: chunk text and create embeddings
  try {
    if (!isSupabaseConfigured()) {
      return Response.json({ error: 'Base de datos no configurada' }, { status: 503 });
    }

    const user = await getCurrentUser();
    const body = await request.json();
    const { documentId } = body;

    if (!documentId) {
      return Response.json({ error: 'ID de documento requerido' }, { status: 400 });
    }

    const supabase = getSupabase();

    // Fetch document
    let docQuery = supabase
      .from('documents_uploaded')
      .select('*')
      .eq('id', documentId);

    if (user) {
      docQuery = docQuery.eq('user_id', user.id);
    } else {
      docQuery = docQuery.is('user_id', null);
    }

    const { data: doc, error: docError } = await docQuery.single();
    if (docError || !doc) {
      return Response.json({ error: 'Documento no encontrado' }, { status: 404 });
    }

    if (doc.processed) {
      return Response.json({ success: true, message: 'Ya procesado', chunks: 0 });
    }

    const text = doc.original_text || '';
    if (!text || text.length < 10) {
      return Response.json({ error: 'El documento no tiene suficiente texto extraído' }, { status: 400 });
    }

    // Chunk text into ~1000 char pieces with 200 char overlap
    const CHUNK_SIZE = 1000;
    const CHUNK_OVERLAP = 200;
    const chunks: string[] = [];

    for (let i = 0; i < text.length; i += CHUNK_SIZE - CHUNK_OVERLAP) {
      const chunk = text.substring(i, i + CHUNK_SIZE).trim();
      if (chunk.length > 50) {
        chunks.push(chunk);
      }
    }

    if (chunks.length === 0) {
      return Response.json({ error: 'No se pudieron generar chunks del documento' }, { status: 400 });
    }

    // Generate embeddings if OpenAI key available
    let embeddings: number[][] = [];
    const apiKey = process.env.OPENAI_API_KEY;

    if (apiKey && chunks.length > 0) {
      try {
        const response = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'text-embedding-3-small',
            input: chunks,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          embeddings = data.data.map((d: { embedding: number[] }) => d.embedding);
        }
      } catch {
        console.warn('Could not generate embeddings, storing chunks without vectors');
      }
    }

    // Store chunks in uploaded_document_chunks
    const chunkRecords = chunks.map((chunk, i) => ({
      uploaded_document_id: documentId,
      chunk_index: i,
      chunk_text: chunk,
      embedding: embeddings[i] ? JSON.stringify(embeddings[i]) : null,
    }));

    // Insert in batches of 50
    for (let i = 0; i < chunkRecords.length; i += 50) {
      const batch = chunkRecords.slice(i, i + 50);
      const { error: insertError } = await supabase
        .from('uploaded_document_chunks')
        .insert(batch);

      if (insertError) {
        console.error('Chunk insert error:', insertError);
        // Continue anyway - some chunks may have been inserted
      }
    }

    // Mark document as processed
    await supabase
      .from('documents_uploaded')
      .update({ processed: true })
      .eq('id', documentId);

    return Response.json({
      success: true,
      chunks: chunks.length,
      hasEmbeddings: embeddings.length > 0,
    });
  } catch (error) {
    console.error('Document process error:', error);
    const message = error instanceof Error ? error.message : 'Error al procesar documento';
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return Response.json({ success: true, demo: true });
    }

    const user = await getCurrentUser();
    const supabase = getSupabase();
    const { searchParams } = new URL(request.url);
    const docId = searchParams.get('id');

    if (!docId) {
      return Response.json({ error: 'ID de documento requerido' }, { status: 400 });
    }

    // Delete chunks first
    let chunkQuery = supabase
      .from('uploaded_document_chunks')
      .delete()
      .eq('uploaded_document_id', docId);

    if (user) {
      chunkQuery = chunkQuery.eq('user_id', user.id);
    }
    await chunkQuery;

    // Delete document
    let docQuery = supabase
      .from('documents_uploaded')
      .delete()
      .eq('id', docId);

    if (user) {
      docQuery = docQuery.eq('user_id', user.id);
    } else {
      docQuery = docQuery.is('user_id', null);
    }

    const { error } = await docQuery;
    if (error) throw error;

    return Response.json({ success: true });
  } catch (error) {
    console.error('Document delete error:', error);
    const message = error instanceof Error ? error.message : 'Error al eliminar documento';
    return Response.json({ error: message }, { status: 500 });
  }
}
