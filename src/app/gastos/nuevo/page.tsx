import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import NuevoGastoForm from './NuevoGastoForm'

export const instant = false

export default async function NuevoGastoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: categories }, { data: merchantRows }] = await Promise.all([
    supabase.from('categories').select('*, subcategories(*)').eq('is_active', true).order('sort_order'),
    supabase.from('transactions').select('merchant').eq('user_id', user.id).neq('merchant', '').order('merchant'),
  ])

  const merchants = [...new Set((merchantRows ?? []).map(r => r.merchant).filter(Boolean))] as string[]

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3">
        <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 text-xl">←</Link>
        <h1 className="text-lg font-semibold text-gray-900">Nuevo gasto</h1>
      </header>
      <div className="max-w-lg mx-auto p-4">
        <NuevoGastoForm categories={categories ?? []} userId={user.id} merchants={merchants} />
      </div>
    </main>
  )
}
