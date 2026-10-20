'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatCLP } from '@/lib/format'
import type { Transaction } from '@/types/database'

export default function TransactionList({ gastos }: { gastos: Transaction[] }) {
  const router = useRouter()
  const supabase = createClient()
  const [selected, setSelected] = useState<Transaction | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  function open(g: Transaction) { setSelected(g); setConfirmDelete(false) }
  function close() { setSelected(null); setConfirmDelete(false) }

  async function handleDelete() {
    if (!selected) return
    setDeleting(true)
    await supabase.from('transactions').delete().eq('id', selected.id)
    setDeleting(false)
    close()
    router.refresh()
  }

  if (gastos.length === 0) {
    return (
      <div className="px-5 py-10 text-center">
        <p className="text-gray-400 text-sm">Aún no hay gastos este mes.</p>
        <p className="text-gray-300 text-sm mt-1">Registra tu primer gasto con el botón de abajo.</p>
      </div>
    )
  }

  return (
    <>
      <ul className="divide-y divide-gray-50">
        {gastos.map((g) => {
          const sub = g.subcategories as any
          const catName = sub?.categories?.name
          const subName = sub?.name
          return (
            <li
              key={g.id}
              className="px-5 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors"
              onClick={() => open(g)}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {g.merchant || g.description || '—'}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {catName && subName ? `${catName} › ${subName}` : catName || subName || 'Sin categoría'}
                  {' · '}
                  {new Date(g.date + 'T12:00:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}
                </p>
              </div>
              <span className="text-sm font-semibold text-gray-900 ml-3 shrink-0">
                {formatCLP(g.amount)}
              </span>
            </li>
          )
        })}
      </ul>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={close}>
          <div className="absolute inset-0 bg-black/30" />
          <div
            className="relative w-full max-w-lg mx-auto bg-white rounded-t-2xl p-6 flex flex-col gap-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-gray-900 text-lg">
                  {selected.merchant || selected.description || '—'}
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{formatCLP(selected.amount)}</p>
                <p className="text-sm text-gray-400 mt-1">
                  {new Date(selected.date + 'T12:00:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <button onClick={close} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>

            {!confirmDelete ? (
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => { close(); router.push(`/gastos/${selected.id}/editar`) }}
                  className="w-full py-3 bg-gray-100 text-gray-900 font-medium rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Editar
                </button>
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="w-full py-3 text-red-500 font-medium rounded-xl hover:bg-red-50 transition-colors"
                >
                  Eliminar
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-sm text-gray-500 text-center">¿Eliminar este gasto? No se puede deshacer.</p>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="w-full py-3 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {deleting ? 'Eliminando...' : 'Confirmar eliminación'}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="w-full py-3 text-gray-500 font-medium rounded-xl hover:bg-gray-100 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
