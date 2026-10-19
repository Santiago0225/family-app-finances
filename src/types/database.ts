export type Profile = {
  id: string
  name: string
  savings_goal_percent: number
  created_at: string
}

export type Category = {
  id: string
  user_id: string
  name: string
  sort_order: number
  is_active: boolean
}

export type Subcategory = {
  id: string
  user_id: string
  category_id: string
  name: string
  sort_order: number
  is_active: boolean
}

export type Transaction = {
  id: string
  user_id: string
  date: string
  amount: number
  description: string
  merchant: string
  subcategory_id: string | null
  is_fixed: boolean
  origin: 'manual' | 'receipt' | 'screenshot' | 'transfer' | 'recurring' | 'installment'
  type: 'expense' | 'transfer' | 'card_payment'
  created_at: string
  subcategories?: Subcategory & { categories?: Category }
}
