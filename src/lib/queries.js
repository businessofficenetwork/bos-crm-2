import { supabase } from './supabase'

export async function listContractors(search = '') {
  let query = supabase.from('contractors').select('*').order('name', { ascending: true })

  const term = search.trim()
  if (term) {
    query = query.or(
      `name.ilike.%${term}%,contact_name.ilike.%${term}%,email.ilike.%${term}%`
    )
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function createContractor(contractor) {
  const { data, error } = await supabase
    .from('contractors')
    .insert(contractor)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateContractor(id, updates) {
  const { data, error } = await supabase
    .from('contractors')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}
