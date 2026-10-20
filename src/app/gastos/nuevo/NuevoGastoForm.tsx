'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatCLP, parseCLP, getTodaySantiago, normalizeMerchant } from '@/lib/format'
import type { Category, Subcategory } from '@/types/database'

type Props = {
  categories: (Category & { subcategories: Subcategory[] })[]
  userId: string
  merchants: string[]
}

export default function NuevoGastoForm({ categories, userId, merchants }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [fecha, setFecha] = useState(getTodaySantiago())
  const [montoDisplay, setMontoDisplay] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [comercio, setComercio] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const [subcategoriaId, setSubcategoriaId] = useState('')
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  const subcategorias = categories.find(c => c.id === categoriaId)?.subcategories ?? []

  function handleMonto(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = parseCLP(e.target.value)
    setMontoDisplay(raw > 0 ? formatCLP(raw) : '')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const monto = parseCLP(montoDisplay)
    if (!monto || monto <= 0) { setError('Ingresa un monto válido'); return }

    setGuardando(true)
    const { error } = await supabase.from('transactions').insert({
      user_id: userId,
      date: fecha,
      amount: monto,
      description: descripcion,
      merchant: normalizeMerchant(comercio),
      subcategory_id: subcategoriaId || null,
      origin: 'manual',
      type: 'expense',
    })

    if (error) { setError('Error al guardar. Intenta de nuevo.'); setGuardando(false); return }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
        <input
          type="date"
          value={fecha}
          onChange={e => setFecha(e.target.value)}
          required
          className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Monto (CLP)</label>
        <input
          type="text"
          inputMode="numeric"
          placeholder="$0"
          value={montoDisplay}
          onChange={handleMonto}
          required
          className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Comercio</label>
        <input
          type="text"
          list="merchants-list"
          placeholder="Ej: Uber, Líder, Copec"
          value={comercio}
          onChange={e => setComercio(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <datalist id="merchants-list">
          {merchants.map(m => <option key={m} value={m} />)}
        </datalist>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
        <input
          type="text"
          placeholder="Ej: Compra supermercado"
          value={descripcion}
          onChange={e => setDescripcion(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
        <select
          value={categoriaId}
          onChange={e => { setCategoriaId(e.target.value); setSubcategoriaId('') }}
          className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
        >
          <option value="">Sin categoría</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {subcategorias.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Subcategoría</label>
          <select
            value={subcategoriaId}
            onChange={e => setSubcategoriaId(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
          >
            <option value="">Sin subcategoría</option>
            {subcategorias.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      )}

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={guardando}
        className="w-full bg-green-600 text-white font-medium py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 mt-2"
      >
        {guardando ? 'Guardando...' : 'Guardar gasto'}
      </button>
    </form>
  )
}
