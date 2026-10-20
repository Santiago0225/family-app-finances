import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import EditarGastoForm from './EditarGastoForm'

export const instant = false

export default async function EditarGastoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: transaction }, { data: categories }, { data: merchantRows }] = await Promise.all([
    supabase.from('transactions').select('*').eq('id', id).eq('user_id', user.id).single(),
    supabase.from('categories').select('*, subcategories(*)').eq('is_active', true).order('sort_order'),
    supabase.from('transactions').select('merchant').eq('user_id', user.id).neq('merchant', '').order('merchant'),
  ])

  if (!transaction) notFound()

  const merchants = [...new Set((merchantRows ?? []).map(r => r.merchant).filter(Boolean))] as string[]

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3">
        <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 text-xl">←</Link>
        <h1 className="text-lg font-semibold text-gray-900">Editar gasto</h1>
      </header>
      <div className="max-w-lg mx-auto p-4">
        <EditarGastoForm
          transaction={transaction}
          categories={categories ?? []}
          merchants={merchants}
        />
      </div>
    </main>
  )
}
