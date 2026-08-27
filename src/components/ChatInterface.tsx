'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Message, Country, LegalArea, LEGAL_AREAS } from '@/types';
import MessageBubble from './MessageBubble';
import LegalAreaSelector from './LegalAreaSelector';
import SuggestedQuestions from './SuggestedQuestions';
import DocumentDrafting from './DocumentDrafting';
import CaseIntake from './CaseIntake';
import NormValidator from './NormValidator';
import SentenciaAnalyzer from './SentenciaAnalyzer';
import { DocumentType } from '@/lib/prompts/drafting';
import { useAuth } from './auth/AuthProvider';

interface ChatInterfaceProps {
  country: Country;
  initialConversationId?: string;
}

interface DBMessage {
  id: string;
  role: string;
  content: string;
  country: string | null;
  legal_area: string | null;
  created_at: string;
}

export default function ChatInterface({ country, initialConversationId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [legalArea, setLegalArea] = useState<LegalArea | undefined>();
  const [showAreaSelector, setShowAreaSelector] = useState(false);
  const [showDocumentDrafting, setShowDocumentDrafting] = useState(false);
  const [showCaseIntake, setShowCaseIntake] = useState(false);
  const [showNormValidator, setShowNormValidator] = useState(false);
  const [showSentenciaAnalyzer, setShowSentenciaAnalyzer] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>(initialConversationId);
  const [loadingConversation, setLoadingConversation] = useState(!!initialConversationId);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { user } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load existing conversation messages
  useEffect(() => {
    if (!initialConversationId) return;

    const loadConversation = async () => {
      try {
        const res = await fetch(`/api/conversations?id=${initialConversationId}`);
        const data = await res.json();

        if (data.messages) {
          const loadedMessages: Message[] = data.messages.map((msg: DBMessage) => ({
            id: msg.id,
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
            timestamp: new Date(msg.created_at),
            country: (msg.country as Country) || country,
            legalArea: msg.legal_area as LegalArea | undefined,
          }));
          setMessages(loadedMessages);
          if (data.conversation?.country) {
            // Could set country here if needed
          }
        }
      } catch {
        // Silently fail - start fresh conversation
      } finally {
        setLoadingConversation(false);
      }
    };

    loadConversation();
  }, [initialConversationId, country]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      alert('Formato no soportado. Usa PNG, JPG, WEBP, PDF o TXT');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('El archivo excede 10MB');
      return;
    }

    setIsLoading(true);
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: `📄 Adjuntando archivo: ${file.name} (${(file.size / 1024).toFixed(1)} KB)...`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      // Read file as base64
      const arrayBuffer = await file.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');

      // Send to chat API with file data
      const assistantMessageId = crypto.randomUUID();
      setMessages(prev => [...prev, {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: true,
      }]);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Analiza este documento jurídico adjunto: ${file.name}. Extrae los datos relevantes, partes involucradas, pretensiones, fundamentos de derecho y cualquier resolución o decisión contenida en el documento.`,
          country,
          legalArea,
          tipoUsuario: user?.tipo_usuario || 'cliente',
          history: messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
          conversationId,
          fileData: {
            name: file.name,
            type: file.type,
            size: file.size,
            base64: base64,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error de conexion' }));
        throw new Error(errorData.error || `Error HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No se pudo leer la respuesta');

      const decoder = new TextDecoder();
      let fullContent = '';
      let updatePending = false;
      let streamSources: { title: string; url: string | null; similarity: number }[] = [];

      const flushUpdate = () => {
        updatePending = false;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessageId ? { ...m, content: fullContent, ...(streamSources.length > 0 ? { metadata: { ...m.metadata, sources: streamSources } } : {}) } : m
          )
        );
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('__META__')) {
            try {
              const meta = JSON.parse(line.slice(8));
              if (meta.conversationId) setConversationId(meta.conversationId);
            } catch { /* ignore */ }
            continue;
          }
          if (line.startsWith('__SOURCES__')) {
            try { streamSources = JSON.parse(line.slice(11)).sources || []; } catch { /* ignore */ }
            continue;
          }
          if (line.startsWith('__ERROR__')) throw new Error(line.slice(9));
          if (line.trim()) {
            fullContent += line;
            if (!updatePending) {
              updatePending = true;
              setTimeout(flushUpdate, 50);
            }
          }
        }
      }
      if (updatePending) flushUpdate();

      setMessages((prev) =>
        prev.map((m) => m.id === assistantMessageId ? { ...m, isStreaming: false } : m)
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setMessages(prev => prev.map(m =>
        m.id === userMessage.id ? { ...m, content: `📄 Archivo: ${file.name}\n\nError: ${errorMessage}` } : m
      ));
    } finally {
      setIsLoading(false);
    }

    if (e.target) e.target.value = '';
  };

  const sendMessageWithDocument = useCallback(async (text: string, documentId?: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
      country,
      legalArea,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Create placeholder for assistant message
    const assistantMessageId = crypto.randomUUID();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      country,
      legalArea,
      isStreaming: true,
    };

    setMessages((prev) => [...prev, assistantMessage]);

    try {
      const history = messages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          country,
          legalArea,
          tipoUsuario: user?.tipo_usuario || 'cliente',
          history,
          conversationId,
          documentId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error de conexión' }));
        throw new Error(errorData.error || `Error HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No se pudo leer la respuesta');

      const decoder = new TextDecoder();
      let fullContent = '';
      let updatePending = false;
      let streamSources: { title: string; url: string | null; similarity: number }[] = [];

      const flushUpdate = () => {
        updatePending = false;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessageId
              ? { ...m, content: fullContent, ...(streamSources.length > 0 ? { metadata: { ...m.metadata, sources: streamSources } } : {}) }
              : m
          )
        );
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('__META__')) {
            try {
              const meta = JSON.parse(line.slice(8));
              if (meta.conversationId) {
                setConversationId(meta.conversationId);
              }
            } catch { /* ignore parse errors */ }
            continue;
          }
          if (line.startsWith('__SOURCES__')) {
            try { streamSources = JSON.parse(line.slice(11)).sources || []; } catch { /* ignore */ }
            continue;
          }
          if (line.startsWith('__ERROR__')) {
            throw new Error(line.slice(9));
          }
          if (line.trim()) {
            fullContent += line;
            if (!updatePending) {
              updatePending = true;
              setTimeout(flushUpdate, 50);
            }
          }
        }
      }
      if (updatePending) flushUpdate();

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessageId
            ? { ...m, isStreaming: false, ...(streamSources.length > 0 ? { metadata: { ...m.metadata, sources: streamSources } } : {}) }
            : m
        )
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessageId
            ? {
                ...m,
                content: `**Error:** ${errorMessage}\n\nSi el problema persiste, verifica que tu clave API esté configurada correctamente en \`.env.local\`.`,
                isStreaming: false,
              }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, [country, legalArea, isLoading, messages, conversationId, user]);

  const sendMessage = useCallback(async (text: string) => {
    return sendMessageWithDocument(text);
  }, [sendMessageWithDocument]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const isEmpty = messages.length === 0 && !loadingConversation;

  const handleDraftGenerated = useCallback((content: string, docType: DocumentType) => {
    const docTypeLabel = docType.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: `📄 Generar documento: ${docTypeLabel}`,
      timestamp: new Date(),
      country,
      legalArea,
    };
    setMessages(prev => [...prev, userMessage]);

    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: content,
      timestamp: new Date(),
      country,
      legalArea,
      metadata: { documentType: docType },
    };
    setMessages(prev => [...prev, assistantMessage]);
  }, [country, legalArea]);

  const handleCaseIntakeComplete = useCallback(async (facts: string, matter: string) => {
    setShowCaseIntake(false);
    setIsLoading(true);

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: `📁 Carpeta de Caso - ${matter}`,
      timestamp: new Date(),
      country,
    };
    setMessages(prev => [...prev, userMessage]);

    const assistantMessageId = crypto.randomUUID();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      country,
      metadata: { documentType: 'carpeta-caso' },
    };
    setMessages(prev => [...prev, assistantMessage]);

    try {
      const response = await fetch('/api/carpeta-caso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ facts, matter }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error de conexión' }));
        throw new Error(errorData.error || `Error HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No se pudo leer la respuesta');

      const decoder = new TextDecoder();
      let fullContent = '';
      let streamSources: { title: string; url: string | null; similarity: number }[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('__META__')) {
            try {
              const meta = JSON.parse(line.slice(8));
              if (meta.conversationId) setConversationId(meta.conversationId);
            } catch { /* ignore */ }
            continue;
          }
          if (line.startsWith('__SOURCES__')) {
            try { streamSources = JSON.parse(line.slice(11)).sources || []; } catch { /* ignore */ }
            continue;
          }
          if (line.startsWith('__ERROR__')) throw new Error(line.slice(9));
          if (line.trim()) fullContent += line;
        }
        setMessages(prev =>
          prev.map(m => m.id === assistantMessageId ? { ...m, content: fullContent, ...(streamSources.length > 0 ? { metadata: { ...m.metadata, sources: streamSources } } : {}) } : m)
        );
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setMessages(prev =>
        prev.map(m => m.id === assistantMessageId
          ? { ...m, content: `Error al generar carpeta: ${errorMessage}` }
          : m)
      );
    } finally {
      setIsLoading(false);
    }
  }, [country]);

  const handleSentenciaAnalyze = useCallback(async (texto: string) => {
    setShowSentenciaAnalyzer(false);
    setIsLoading(true);

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: '📑 Analizar sentencia / resolución',
      timestamp: new Date(),
      country,
      legalArea,
    };
    setMessages(prev => [...prev, userMessage]);

    const assistantMessageId = crypto.randomUUID();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      country,
      legalArea,
      metadata: { documentType: 'analisis-sentencia' },
    };
    setMessages(prev => [...prev, assistantMessage]);

    try {
      const response = await fetch('/api/analizar-sentencia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto, country, legalArea }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error de conexión' }));
        throw new Error(errorData.error || `Error HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No se pudo leer la respuesta');

      const decoder = new TextDecoder();
      let fullContent = '';
      let streamSources: { title: string; url: string | null; similarity: number }[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('__META__')) continue;
          if (line.startsWith('__SOURCES__')) {
            try { streamSources = JSON.parse(line.slice(11)).sources || []; } catch { /* ignore */ }
            continue;
          }
          if (line.startsWith('__ERROR__')) throw new Error(line.slice(9));
          if (line.trim()) fullContent += line;
        }
        setMessages(prev =>
          prev.map(m => m.id === assistantMessageId ? { ...m, content: fullContent, ...(streamSources.length > 0 ? { metadata: { ...m.metadata, sources: streamSources } } : {}) } : m)
        );
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setMessages(prev =>
        prev.map(m => m.id === assistantMessageId
          ? { ...m, content: `Error al analizar la sentencia: ${errorMessage}` }
          : m)
      );
    } finally {
      setIsLoading(false);
    }
  }, [country, legalArea]);

  if (loadingConversation) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-zinc-500">Cargando conversación...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* Document Drafting Modal */}
      {showDocumentDrafting && (
        <DocumentDrafting
          country={country}
          legalArea={legalArea}
          onDraftGenerated={handleDraftGenerated}
          onClose={() => setShowDocumentDrafting(false)}
        />
      )}
      {/* Case Intake Modal */}
      {showCaseIntake && (
        <CaseIntake
          onComplete={handleCaseIntakeComplete}
          onClose={() => setShowCaseIntake(false)}
        />
      )}
      {/* Norm Validator Modal */}
      {showNormValidator && (
        <NormValidator
          country={country}
          onClose={() => setShowNormValidator(false)}
        />
      )}
      {/* Sentencia Analyzer Modal */}
      {showSentenciaAnalyzer && (
        <SentenciaAnalyzer
          country={country}
          legalArea={legalArea}
          onAnalyze={handleSentenciaAnalyze}
          onClose={() => setShowSentenciaAnalyzer(false)}
        />
      )}
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
          <div className="flex h-full flex-col items-center justify-center px-4 py-12">
            <div className="mx-auto max-w-2xl space-y-8">
              {/* Hero */}
              <div className="text-center space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/30">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-white sm:text-3xl">
                  ¿Qué problema jurídico quieres analizar?
                </h1>
                <p className="text-sm text-zinc-500 sm:text-base">
                  Asistente de IA especializado en legislación de{' '}
                  <span className="font-medium text-emerald-400">
                    {country === 'PERU' ? 'Perú' : country === 'CHILE' ? 'Chile' : 'Perú y Chile'}
                  </span>
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap justify-center gap-3">
                <ActionButton
                  icon={
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                  }
                  label="Analizar caso"
                  onClick={() => setShowAreaSelector(!showAreaSelector)}
                />
                <ActionButton
                  icon={
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  }
                  label="Buscar legislación"
                  onClick={() => inputRef.current?.focus()}
                />
                <ActionButton
                  icon={
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="20" x2="18" y2="10" />
                      <line x1="12" y1="20" x2="12" y2="4" />
                      <line x1="6" y1="20" x2="6" y2="14" />
                    </svg>
                  }
                  label="Comparar Perú vs Chile"
                  onClick={() => sendMessage('Compara la legislación relevante entre Perú y Chile. ¿Qué diferencias principales existen?')}
                />
                <ActionButton
                  icon={
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                  }
                  label="Redactar documento"
                  onClick={() => setShowDocumentDrafting(true)}
                />
                <ActionButton
                  icon={
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2v20" />
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                  }
                  label="Verificar norma"
                  onClick={() => setShowNormValidator(true)}
                />
                <ActionButton
                  icon={
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                  }
                  label="Analizar sentencia"
                  onClick={() => setShowSentenciaAnalyzer(true)}
                />
                {country === 'CHILE' && (
                  <ActionButton
                    icon={
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                      </svg>
                    }
                    label="Carpeta de Caso (OJV)"
                    onClick={() => setShowCaseIntake(true)}
                  />
                )}
              </div>

              {/* Legal area selector */}
              {showAreaSelector && (
                <LegalAreaSelector value={legalArea} onChange={setLegalArea} />
              )}

              {/* Suggested questions */}
              <div className="space-y-3">
                <p className="text-center text-xs font-medium uppercase tracking-wider text-zinc-600">
                  Preguntas de ejemplo
                </p>
                <SuggestedQuestions onQuestionClick={sendMessage} />
              </div>
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-4 px-4 py-6">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {isLoading && messages[messages.length - 1]?.content === '' && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 ring-1 ring-emerald-500/30">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400 animate-pulse">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-zinc-800 bg-zinc-950/90 backdrop-blur-xl">
        <div className="mx-auto max-w-3xl px-4 py-4">
          {/* Quick area selector when messages exist */}
          {messages.length > 0 && (
            <div className="mb-3 flex items-center gap-2 overflow-x-auto pb-1">
              <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-600">Área:</span>
              <button
                onClick={() => setLegalArea(undefined)}
                className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium transition-all ${
                  !legalArea
                    ? 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Todas
              </button>
              {LEGAL_AREAS.slice(0, 8).map((area) => (
                <button
                  key={area.value}
                  onClick={() => setLegalArea(area.value)}
                  className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium transition-all ${
                    legalArea === area.value
                      ? 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {area.label}
                </button>
              ))}
              <div className="ml-auto flex-shrink-0 flex items-center gap-2">
                {country === 'CHILE' && (
                  <button
                    onClick={() => setShowCaseIntake(true)}
                    className="whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-medium bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/30 hover:bg-blue-500/20 transition-all flex items-center gap-1"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                    </svg>
                    Carpeta
                  </button>
                )}
                <button
                  onClick={() => setShowDocumentDrafting(true)}
                  className="whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-medium bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30 hover:bg-emerald-500/20 transition-all flex items-center gap-1"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                  Redactar
                </button>
                <button
                  onClick={() => setShowNormValidator(true)}
                  className="whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-medium bg-violet-500/10 text-violet-400 ring-1 ring-violet-500/30 hover:bg-violet-500/20 transition-all flex items-center gap-1"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2v20" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                  Verificar norma
                </button>
                <button
                  onClick={() => setShowSentenciaAnalyzer(true)}
                  className="whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-medium bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/30 hover:bg-blue-500/20 transition-all flex items-center gap-1"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                  Sentencia
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex gap-3">
            <div className="relative flex-1">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe tu consulta jurídica..."
                rows={1}
                aria-label="Consulta jurídica"
                className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 pr-12 text-sm text-white placeholder-zinc-600 outline-none transition-all focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30"
                style={{ minHeight: '48px', maxHeight: '120px' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = Math.min(target.scrollHeight, 120) + 'px';
                }}
              />
            </div>
            <input
              type="file"
              accept="image/*,.pdf,.txt"
              onChange={handleFileUpload}
              className="hidden"
              id="chat-file-upload"
            />
            <label
              htmlFor="chat-file-upload"
              className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-800 text-zinc-400 transition-all hover:border-emerald-500/40 hover:text-emerald-400 cursor-pointer"
              title="Subir archivo"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
              </svg>
            </label>
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              aria-label="Enviar mensaje"
              className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white transition-all hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              )}
            </button>
          </form>

          <p className="mt-2 text-center text-[10px] text-zinc-600">
            La información proporcionada es de carácter general y no sustituye el asesoramiento de un abogado.
          </p>
        </div>
      </div>
    </div>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2.5 text-sm text-zinc-400 transition-all hover:border-emerald-500/40 hover:bg-emerald-500/5 hover:text-zinc-200"
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
