'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Country } from '@/types';
import Header from '@/components/Header';
import ChatInterface from '@/components/ChatInterface';

function ChatPageContent() {
  const [country, setCountry] = useState<Country>('PERU');
  const searchParams = useSearchParams();
  const conversationId = searchParams.get('conversationId') || undefined;

  return (
    <div className="flex h-screen flex-col bg-zinc-950">
      <Header country={country} onCountryChange={setCountry} />
      <ChatInterface country={country} initialConversationId={conversationId} />
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-zinc-950">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ChatPageContent />
    </Suspense>
  );
}
