'use client';

import { useState } from 'react';
import { Country } from '@/types';
import { UserMenu } from './auth/UserMenu';

interface HeaderProps {
  country: Country;
  onCountryChange: (country: Country) => void;
}

export default function Header({ country, onCountryChange }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <a href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 ring-1 ring-emerald-500/30">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-white">
                Juris<span className="text-emerald-400">Nexa</span>
              </span>
              <span className="hidden text-[10px] font-medium uppercase tracking-widest text-zinc-500 sm:block">
                Asistente Jurídico IA
              </span>
            </div>
          </a>
        </div>

        {/* Country Selector - Desktop */}
        <div className="hidden md:block">
          <div className="flex rounded-lg border border-zinc-800 bg-zinc-900/50 p-0.5">
            <CountryButton
              active={country === 'PERU'}
              onClick={() => onCountryChange('PERU')}
              flag="🇵🇪"
              label="Perú"
            />
            <CountryButton
              active={country === 'CHILE'}
              onClick={() => onCountryChange('CHILE')}
              flag="🇨🇱"
              label="Chile"
            />
            <CountryButton
              active={country === 'BOTH'}
              onClick={() => onCountryChange('BOTH')}
              flag="🌎"
              label="Comparar"
            />
          </div>
        </div>

        {/* Right side: User Menu + Mobile menu */}
        <div className="flex items-center gap-2">
          <UserMenu />
          
          {/* Mobile menu button */}
          <button
            className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menú"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {menuOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-zinc-800 bg-zinc-950 px-4 py-3 md:hidden">
          <div className="flex flex-col gap-2">
            <CountryButton
              active={country === 'PERU'}
              onClick={() => { onCountryChange('PERU'); setMenuOpen(false); }}
              flag="🇵🇪"
              label="Perú"
            />
            <CountryButton
              active={country === 'CHILE'}
              onClick={() => { onCountryChange('CHILE'); setMenuOpen(false); }}
              flag="🇨🇱"
              label="Chile"
            />
            <CountryButton
              active={country === 'BOTH'}
              onClick={() => { onCountryChange('BOTH'); setMenuOpen(false); }}
              flag="🌎"
              label="Comparar Perú vs Chile"
            />
            <div className="border-t border-zinc-800 my-2" />
            <a href="/chat" className="text-sm text-zinc-400 hover:text-white py-2">Chat</a>
            <a href="/historial" className="text-sm text-zinc-400 hover:text-white py-2">Historial</a>
            <a href="/documentos" className="text-sm text-zinc-400 hover:text-white py-2">Documentos</a>
            <a href="/perfil" className="text-sm text-zinc-400 hover:text-white py-2">Perfil</a>
          </div>
        </div>
      )}
    </header>
  );
}

function CountryButton({
  active,
  onClick,
  flag,
  label,
}: {
  active: boolean;
  onClick: () => void;
  flag: string;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all ${
        active
          ? 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30'
          : 'text-zinc-400 hover:text-zinc-200'
      }`}
    >
      <span>{flag}</span>
      <span>{label}</span>
    </button>
  );
}
