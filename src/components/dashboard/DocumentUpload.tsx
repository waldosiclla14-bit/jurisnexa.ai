'use client';

import { useState, useRef, useEffect } from 'react';

interface UploadResult {
  id: string;
  filename: string;
  size: number;
  textLength: number;
}

interface Document {
  id: string;
  filename: string;
  file_size: number;
  file_type: string;
  processed: boolean;
  created_at: string;
  thumbnail_url?: string;
}

const ACCEPTED_TYPES = {
  'application/pdf': 'PDF',
  'image/png': 'PNG',
  'image/jpeg': 'JPG',
  'image/webp': 'WEBP',
  'text/plain': 'TXT',
};

const ACCEPTED_EXTENSIONS = Object.keys(ACCEPTED_TYPES).join(',');

export function DocumentUpload() {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState('');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [processing, setProcessing] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/documents');
      const data = await res.json();
      setDocuments(data.documents || []);
    } catch {
      // Silently fail
    }
  };

  const validateFile = (file: File): string | null => {
    if (!Object.keys(ACCEPTED_TYPES).includes(file.type)) {
      return 'Formato no soportado. Usa PDF, PNG, JPG, WEBP o TXT';
    }
    if (file.size > 10 * 1024 * 1024) {
      return 'El archivo excede 10MB';
    }
    return null;
  };

  const handleUpload = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setUploading(true);
    setError('');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al subir');
      }

      setResult(data.document);
      if (fileRef.current) fileRef.current.value = '';
      fetchDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir documento');
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files);
    }
  };

  const processDocument = async (docId: string) => {
    setProcessing(docId);
    try {
      const res = await fetch('/api/documents', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: docId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al procesar');
      }

      fetchDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar documento');
    } finally {
      setProcessing(null);
    }
  };

  const deleteDocument = async (docId: string) => {
    if (!confirm('¿Eliminar este documento?')) return;
    try {
      await fetch(`/api/documents?id=${docId}`, { method: 'DELETE' });
      setDocuments(prev => prev.filter(d => d.id !== docId));
    } catch {
      setError('Error al eliminar');
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) {
      return (
        <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
    }
    if (type.includes('image')) {
      return (
        <svg className="w-5 h-5 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5 text-zinc-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  };

  return (
    <div className="space-y-6">
      {/* Upload area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive ? 'border-emerald-500 bg-emerald-500/5' : 'border-zinc-700 hover:border-zinc-600'
        }`}
      >
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS}
          onChange={(e) => handleUpload(e.target.files)}
          className="hidden"
          id="file-upload"
        />
        <label
          htmlFor="file-upload"
          className="cursor-pointer block"
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-zinc-400">Subiendo...</span>
            </div>
          ) : (
            <>
              <svg className="w-10 h-10 mx-auto text-zinc-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-sm text-zinc-400">
                Arrastra archivos o haz clic para seleccionar
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                PDF, PNG, JPG, WEBP, TXT • Máximo 10MB
              </p>
            </>
          )}
        </label>
      </div>

      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      {result && (
        <div className="p-3 bg-emerald-900/30 border border-emerald-700 rounded-lg">
          <p className="text-sm text-emerald-400 font-medium">Documento subido exitosamente</p>
          <p className="text-xs text-zinc-400 mt-1">
            {result.filename} • {formatSize(result.size)} • {result.textLength.toLocaleString()} caracteres extraídos
          </p>
        </div>
      )}

      {/* Documents list */}
      {documents.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-zinc-400 mb-3">Documentos subidos</h3>
          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 bg-zinc-800/50 border border-zinc-700 rounded-lg"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {getFileIcon(doc.file_type)}
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">{doc.filename}</p>
                    <p className="text-xs text-zinc-500">
                      {formatSize(doc.file_size)} • {new Date(doc.created_at).toLocaleDateString('es-PE')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {doc.processed ? (
                    <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">Procesado</span>
                  ) : (
                    <button
                      onClick={() => processDocument(doc.id)}
                      disabled={processing === doc.id}
                      className="text-xs text-emerald-400 hover:text-emerald-300 disabled:opacity-50 px-2 py-0.5 rounded border border-emerald-500/30 hover:bg-emerald-500/10 transition-colors"
                    >
                      {processing === doc.id ? 'Procesando...' : 'Procesar'}
                    </button>
                  )}
                  <button
                    onClick={() => deleteDocument(doc.id)}
                    className="text-xs text-zinc-500 hover:text-red-400 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {documents.length === 0 && !uploading && (
        <p className="text-center text-sm text-zinc-500">
          No hay documentos subidos aún
        </p>
      )}
    </div>
  );
}
