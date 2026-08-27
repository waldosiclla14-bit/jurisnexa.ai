export type Country = 'PERU' | 'CHILE' | 'BOTH';

export type UserType = 'cliente' | 'abogado';

export const USER_TYPE_LABELS: Record<UserType, string> = {
  cliente: 'Cliente',
  abogado: 'Abogado',
};

export type LegalArea =
  | 'civil'
  | 'penal'
  | 'laboral'
  | 'familia'
  | 'constitucional'
  | 'administrativo'
  | 'tributario'
  | 'comercial'
  | 'consumidor'
  | 'inmobiliario'
  | 'migratorio'
  | 'transito'
  | 'societario'
  | 'previsional'
  | 'procesal'
  | 'propiedad_intelectual'
  | 'ambiental'
  | 'sucesiones'
  | 'otro';

export const LEGAL_AREAS: { value: LegalArea; label: string }[] = [
  { value: 'civil', label: 'Civil' },
  { value: 'penal', label: 'Penal' },
  { value: 'laboral', label: 'Laboral' },
  { value: 'familia', label: 'Familia' },
  { value: 'constitucional', label: 'Constitucional' },
  { value: 'administrativo', label: 'Administrativo' },
  { value: 'tributario', label: 'Tributario' },
  { value: 'comercial', label: 'Comercial' },
  { value: 'consumidor', label: 'Consumidor' },
  { value: 'inmobiliario', label: 'Inmobiliario' },
  { value: 'migratorio', label: 'Migratorio' },
  { value: 'transito', label: 'Tránsito' },
  { value: 'societario', label: 'Societario' },
  { value: 'previsional', label: 'Previsional' },
  { value: 'procesal', label: 'Procesal' },
  { value: 'propiedad_intelectual', label: 'Propiedad Intelectual' },
  { value: 'ambiental', label: 'Ambiental' },
  { value: 'sucesiones', label: 'Sucesiones' },
  { value: 'otro', label: 'Otro' },
];

export const LEGAL_AREA_LABELS: Record<LegalArea, string> = {
  civil: 'Civil',
  penal: 'Penal',
  laboral: 'Laboral',
  familia: 'Familia',
  constitucional: 'Constitucional',
  administrativo: 'Administrativo',
  tributario: 'Tributario',
  comercial: 'Comercial',
  consumidor: 'Consumidor',
  inmobiliario: 'Inmobiliario',
  migratorio: 'Migratorio',
  transito: 'Tránsito',
  societario: 'Societario',
  previsional: 'Previsional',
  procesal: 'Procesal',
  propiedad_intelectual: 'Propiedad Intelectual',
  ambiental: 'Ambiental',
  sucesiones: 'Sucesiones',
  otro: 'Otro',
};

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  country?: Country;
  legalArea?: LegalArea;
  citations?: Citation[];
  isStreaming?: boolean;
  metadata?: {
    documentType?: string;
    [key: string]: unknown;
  };
}

export interface Citation {
  id: string;
  normName: string;
  article?: string;
  country: Country;
  sourceUrl?: string;
  sourceName: string;
  excerpt?: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  country: Country;
  legalArea?: LegalArea;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatRequest {
  message: string;
  country: Country;
  legalArea?: LegalArea;
  tipoUsuario?: UserType;
  conversationId?: string;
  documentId?: string;
  fileData?: {
    name: string;
    type: string;
    size: number;
    base64: string;
  };
  history?: { role: 'user' | 'assistant'; content: string }[];
}

export interface ChatResponse {
  message: Message;
  conversationId: string;
}

export interface LLMProvider {
  chat(
    messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
    options?: { maxTokens?: number; temperature?: number; fileData?: { name: string; type: string; size: number; base64: string } }
  ): AsyncGenerator<string>;
}

export type LLMProviderType = 'openai' | 'anthropic' | 'google';

// ============================================================
// Estudios Jurídicos
// ============================================================

export type FirmRole = 'admin' | 'partner' | 'associate' | 'intern';

export const FIRM_ROLE_LABELS: Record<FirmRole, string> = {
  admin: 'Administrador',
  partner: 'Socio',
  associate: 'Asociado',
  intern: 'Practicante',
};

export interface LawFirm {
  id: string;
  name: string;
  slug: string;
  ruc?: string;
  rut?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo_url?: string;
  description?: string;
  plan: string;
  queries_used: number;
  queries_limit: number;
  credential_issued_at?: string | null;
  credential_expires_at?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface FirmMembership {
  id: string;
  user_id: string;
  firm_id: string;
  role: FirmRole;
  invited_by?: string;
  joined_at?: string;
  is_active: boolean;
  user?: {
    id: string;
    email: string;
    full_name: string;
    colegiatura: string;
    legal_areas: LegalArea[];
  };
}

export interface FirmInvitation {
  id: string;
  firm_id: string;
  invited_email: string;
  invited_by?: string;
  role: FirmRole;
  token: string;
  expires_at: string;
  accepted: boolean;
  created_at?: string;
  firm?: {
    id: string;
    name: string;
    slug: string;
  };
}
