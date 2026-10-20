import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatCLP, getMonthRangeSantiago } from '@/lib/format'
import type { Transaction } from '@/types/database'
import LogoutButton from './LogoutButton'
import TransactionList from './TransactionList'

export const instant = false

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { primerDia, ultimoDia, label } = getMonthRangeSantiago()

  const [{ data: profile }, { data: transactions }] = await Promise.all([
    supabase.from('profiles').select('name').eq('id', user.id).single(),
    supabase
      .from('transactions')
      .select('*, subcategories(name, categories(name))')
      .eq('user_id', user.id)
      .eq('type', 'expense')
      .gte('date', primerDia)
      .lte('date', ultimoDia)
      .order('date', { ascending: false }),
  ])

  const gastos = (transactions ?? []) as Transaction[]
  const total = gastos.reduce((sum, g) => sum + g.amount, 0)

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">
            Hola{profile?.name ? `, ${profile.name}` : ''} 👋
          </h1>
          <p className="text-sm text-gray-400 capitalize">{label}</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/perfil" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            Perfil
          </Link>
          <LogoutButton />
        </div>
      </header>

      <div className="max-w-lg mx-auto p-4 flex flex-col gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Gastado este mes</p>
          <p className="text-4xl font-bold text-gray-900">{formatCLP(total)}</p>
          <p className="text-sm text-gray-400 mt-1">{gastos.length} {gastos.length === 1 ? 'gasto' : 'gastos'}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <h2 className="font-semibold text-gray-900">Gastos del mes</h2>
          </div>
          <TransactionList gastos={gastos} />
        </div>
      </div>

      <Link
        href="/gastos/nuevo"
        className="fixed bottom-6 right-6 w-14 h-14 bg-green-600 text-white rounded-full shadow-lg flex items-center justify-center text-2xl hover:bg-green-700 transition-colors"
      >
        +
      </Link>
    </main>
  )
}
