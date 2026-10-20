'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function RecuperarContrasenaPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setCargando(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
      })
      if (error) throw error
      setEnviado(true)
    } catch {
      setError('No se pudo enviar el correo. Verifica el email e intenta de nuevo.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Recuperar contraseña</h1>
        <p className="text-gray-400 text-sm mb-6">Te enviaremos un link para crear una nueva contraseña.</p>

        {enviado ? (
          <div className="text-center">
            <p className="text-green-600 font-medium mb-2">¡Correo enviado!</p>
            <p className="text-gray-500 text-sm mb-6">Revisa tu bandeja de entrada y sigue el link.</p>
            <Link href="/login" className="text-sm text-gray-500 hover:text-gray-700">
              Volver al inicio de sesión
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="email"
              placeholder="Tu correo"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={cargando}
              className="w-full bg-green-600 text-white font-medium py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {cargando ? 'Enviando...' : 'Enviar link'}
            </button>
            <Link href="/login" className="text-sm text-gray-400 hover:text-gray-600 text-center">
              Volver al inicio de sesión
            </Link>
          </form>
        )}
      </div>
    </main>
  )
}
