import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatCLP } from '@/lib/format'
import type { Transaction } from '@/types/database'

export const instant = false
import LogoutButton from './LogoutButton'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', user.id)
    .single()

  const now = new Date()
  const primerDia = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const ultimoDia = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString().split('T')[0]

  const { data: transactions } = await supabase
    .from('transactions')
    .select('*, subcategories(name, categories(name))')
    .eq('user_id', user.id)
    .eq('type', 'expense')
    .gte('date', primerDia)
    .lte('date', ultimoDia)
    .order('date', { ascending: false })

  const gastos = (transactions ?? []) as Transaction[]
  const total = gastos.reduce((sum, g) => sum + g.amount, 0)

  const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
  const mesActual = meses[now.getMonth()]

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">
            Hola{profile?.name ? `, ${profile.name}` : ''} 👋
          </h1>
          <p className="text-sm text-gray-400 capitalize">{mesActual} {now.getFullYear()}</p>
        </div>
        <LogoutButton />
      </header>

      <div className="max-w-lg mx-auto p-4 flex flex-col gap-4">
        {/* Total del mes */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Gastado este mes</p>
          <p className="text-4xl font-bold text-gray-900">{formatCLP(total)}</p>
          <p className="text-sm text-gray-400 mt-1">{gastos.length} {gastos.length === 1 ? 'gasto' : 'gastos'}</p>
        </div>

        {/* Lista de gastos */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <h2 className="font-semibold text-gray-900">Gastos del mes</h2>
          </div>

          {gastos.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-gray-400 text-sm">Aún no hay gastos este mes.</p>
              <p className="text-gray-300 text-sm mt-1">Registra tu primer gasto con el botón de abajo.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {gastos.map((g) => {
                const sub = g.subcategories as any
                const catName = sub?.categories?.name
                const subName = sub?.name
                return (
                  <li key={g.id} className="px-5 py-3 flex items-center justify-between">
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
          )}
        </div>
      </div>

      {/* Botón flotante */}
      <Link
        href="/gastos/nuevo"
        className="fixed bottom-6 right-6 w-14 h-14 bg-green-600 text-white rounded-full shadow-lg flex items-center justify-center text-2xl hover:bg-green-700 transition-colors"
      >
        +
      </Link>
    </main>
  )
}
