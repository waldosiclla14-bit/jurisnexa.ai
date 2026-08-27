const requiredEnvVars = {
  LLM_PROVIDER: process.env.LLM_PROVIDER || 'openai',
} as const;

const optionalEnvVars = {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY || '',
  NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
} as const;

export type EnvConfig = typeof requiredEnvVars & typeof optionalEnvVars;

let validatedConfig: EnvConfig | null = null;

export function validateEnv(): EnvConfig {
  if (validatedConfig) return validatedConfig;

  const warnings: string[] = [];

  // Check required
  if (!requiredEnvVars.LLM_PROVIDER) {
    warnings.push('LLM_PROVIDER no está configurado. Usando "openai" por defecto.');
  }

  // Check LLM provider config
  const provider = requiredEnvVars.LLM_PROVIDER;
  if (provider === 'openai' && !optionalEnvVars.OPENAI_API_KEY) {
    warnings.push('OPENAI_API_KEY no está configurada. El chat no funcionará sin ella.');
  }
  if (provider === 'anthropic' && !optionalEnvVars.ANTHROPIC_API_KEY) {
    warnings.push('ANTHROPIC_API_KEY no está configurada. El chat no funcionará sin ella.');
  }

  // Check Supabase
  if (!optionalEnvVars.SUPABASE_URL || !optionalEnvVars.SUPABASE_ANON_KEY) {
    warnings.push('Supabase no está configurado. RAG, historial y usuarios no estarán disponibles.');
  }

  // Log warnings in development
  if (warnings.length > 0 && process.env.NODE_ENV === 'development') {
    console.warn('\n⚠️  JurisNexa.ai - Variables de entorno:');
    warnings.forEach(w => console.warn(`   ${w}`));
    console.warn('');
  }

  validatedConfig = {
    ...requiredEnvVars,
    ...optionalEnvVars,
  };

  return validatedConfig;
}

export function getEnvConfig() {
  return validateEnv();
}

export function isLLMConfigured(): boolean {
  const provider = requiredEnvVars.LLM_PROVIDER;
  if (provider === 'openai') return !!optionalEnvVars.OPENAI_API_KEY;
  if (provider === 'anthropic') return !!optionalEnvVars.ANTHROPIC_API_KEY;
  if (provider === 'google') return !!(process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY);
  return false;
}

export function isSupabaseConfigured(): boolean {
  return !!(optionalEnvVars.SUPABASE_URL && optionalEnvVars.SUPABASE_ANON_KEY);
}
