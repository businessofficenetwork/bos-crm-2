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

export async function listClaims(search = '') {
  let query = supabase
    .from('claims')
    .select('*, contractor:contractors(id, name)')
    .order('created_at', { ascending: false })

  const term = search.trim()
  if (term) {
    query = query.or(
      `property_address.ilike.%${term}%,homeowner_name.ilike.%${term}%,claim_number.ilike.%${term}%`
    )
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function createClaim(claim) {
  const { data, error } = await supabase.from('claims').insert(claim).select().single()
  if (error) throw error
  return data
}

export async function updateClaim(id, updates) {
  const { data, error } = await supabase
    .from('claims')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}
