'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function CambiarContrasenaForm() {
  const supabase = createClient()
  const [password, setPassword] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [error, setError] = useState('')
  const [ok, setOk] = useState(false)
  const [guardando, setGuardando] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setOk(false)
    if (password.length < 6) { setError('Mínimo 6 caracteres'); return }
    if (password !== confirmar) { setError('Las contraseñas no coinciden'); return }

    setGuardando(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setOk(true)
      setPassword('')
      setConfirmar('')
    } catch {
      setError('No se pudo actualizar. Intenta de nuevo.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input
        type="password"
        placeholder="Nueva contraseña"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
        minLength={6}
        className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
      />
      <input
        type="password"
        placeholder="Confirmar contraseña"
        value={confirmar}
        onChange={e => setConfirmar(e.target.value)}
        required
        className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
      />
      {error && <p className="text-red-500 text-sm">{error}</p>}
      {ok && <p className="text-green-600 text-sm">Contraseña actualizada correctamente.</p>}
      <button
        type="submit"
        disabled={guardando}
        className="w-full bg-green-600 text-white font-medium py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
      >
        {guardando ? 'Guardando...' : 'Cambiar contraseña'}
      </button>
    </form>
  )
}
