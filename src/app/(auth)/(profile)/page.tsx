import { LawyerProfileForm } from '@/components/lawyer/LawyerProfileForm';
import { LawyerCredential } from '@/components/lawyer/LawyerCredential';
import { useState, useEffect } from 'react';
import { updateUserProfile, getCurrentUser } from '@/lib/auth';
import { LegalArea, UserType } from '@/types';

export default function LawyerProfilePage() {
const [user, setUser] = useState<{
    id: string;
    full_name: string;
    colegiatura: string;
    legal_areas: LegalArea[];
    plan: string;
    tipo_usuario: UserType;
    credential_issued_at: string | null;
    credential_expires_at: string | null;
  }>({
    id: '',
    full_name: '',
    colegiatura: '',
    legal_areas: [],
    plan: 'free',
    tipo_usuario: 'cliente',
    credential_issued_at: null,
    credential_expires_at: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ;(async () => {
      const currentUser = await getCurrentUser();
      if (currentUser && (currentUser.tipo_usuario === 'abogado' || currentUser.plan === 'abogado')) {
        setUser({
          id: currentUser.id,
          full_name: currentUser.full_name || 'Abogado',
          colegiatura: currentUser.colegiatura || '',
          legal_areas: currentUser.legal_areas || [],
          plan: currentUser.plan,
          tipo_usuario: currentUser.tipo_usuario || 'abogado',
          credential_issued_at: currentUser.credential_issued_at || null,
          credential_expires_at: currentUser.credential_expires_at || null,
        });
      }
      setLoading(false);
    })();
  }, []);

  const handleSave = async (data: {
    colegiatura: string;
    legal_areas: LegalArea[];
  }) => {
    await updateUserProfile(user.id, {
      colegiatura: data.colegiatura,
      legal_areas: data.legal_areas as LegalArea[],
      credential_issued_at: new Date().toISOString(),
      credential_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    });
    // Recargar datos del usuario
    const updatedUser = await getCurrentUser();
    if (updatedUser) {
      setUser({
        id: updatedUser.id,
        full_name: updatedUser.full_name || 'Abogado',
        colegiatura: updatedUser.colegiatura || '',
        legal_areas: updatedUser.legal_areas || [],
        plan: updatedUser.plan,
        tipo_usuario: updatedUser.tipo_usuario || 'abogado',
        credential_issued_at: updatedUser.credential_issued_at || null,
        credential_expires_at: updatedUser.credential_expires_at || null,
      });
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Cargando perfil...</div>;
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-amber-600">
          Mi Perfil de Abogado
        </h1>
        {user.tipo_usuario === 'abogado' && (
          <LawyerCredential
            user={{
              full_name: user.full_name,
              colegiatura: user.colegiatura,
              legal_areas: user.legal_areas,
              plan: user.plan,
              credential_issued_at: user.credential_issued_at,
              credential_expires_at: user.credential_expires_at,
            }}
          />
        )}
      </header>

      {user.tipo_usuario === 'abogado' ? (
        <LawyerProfileForm
          user={user}
          onSave={handleSave}
        />
      ) : (
        <div>
          <p className="text-amber-600 font-medium">
            Regístrate para convertirte en abogado y acceder a credenciales completas
          </p>
        </div>
      )}
    </div>
  );
}