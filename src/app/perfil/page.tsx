import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import CambiarContrasenaForm from './CambiarContrasenaForm'

export const instant = false

export default async function PerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', user.id)
    .single()

  const tienePassword = user.app_metadata?.provider === 'email'

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3">
        <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 text-xl">←</Link>
        <h1 className="text-lg font-semibold text-gray-900">Perfil</h1>
      </header>

      <div className="max-w-lg mx-auto p-4 flex flex-col gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Nombre</p>
          <p className="font-semibold text-gray-900">{profile?.name || '—'}</p>
          <p className="text-sm text-gray-500 mt-3 mb-1">Correo</p>
          <p className="font-semibold text-gray-900">{user.email}</p>
        </div>

        {tienePassword && (
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-4">Cambiar contraseña</h2>
            <CambiarContrasenaForm />
          </div>
        )}

        {!tienePassword && (
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <p className="text-sm text-gray-400">Entraste con Google. No puedes cambiar la contraseña desde aquí.</p>
          </div>
        )}
      </div>
    </main>
  )
}
