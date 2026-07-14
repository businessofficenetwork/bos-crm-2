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

export async function listSupplements(search = '') {
  let query = supabase
    .from('supplements')
    .select(
      '*, claim:claims!inner(id, property_address, homeowner_name, claim_number, contractor:contractors(name))'
    )
    .order('created_at', { ascending: false })

  const term = search.trim()
  if (term) {
    query = query.or(
      `property_address.ilike.%${term}%,homeowner_name.ilike.%${term}%,claim_number.ilike.%${term}%`,
      { foreignTable: 'claims' }
    )
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function createSupplement(supplement) {
  const { data, error } = await supabase.from('supplements').insert(supplement).select().single()
  if (error) throw error
  return data
}

export async function updateSupplement(id, updates) {
  const { data, error } = await supabase
    .from('supplements')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function listActions(supplementId) {
  const { data, error } = await supabase
    .from('actions')
    .select('*')
    .eq('supplement_id', supplementId)
    .order('due_date', { ascending: true, nullsFirst: false })

  if (error) throw error
  return data
}

export async function createAction(action) {
  const { data, error } = await supabase.from('actions').insert(action).select().single()
  if (error) throw error
  return data
}

export async function updateAction(id, updates) {
  const { data, error } = await supabase
    .from('actions')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}
