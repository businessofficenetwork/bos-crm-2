// Shared by audit-run-background.js (parsed automatically) and
// audit-manual-entry.js (parsed by hand) - once there's a
// parsed_estimate, both paths run the exact same findings step so
// manually-entered estimates get identical treatment to parsed ones.

export async function setAuditStatus(supabase, auditId, updates) {
  const { error } = await supabase
    .from('audits')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', auditId)
  if (error) throw error
}

// Runs once parsing succeeds (from the free-text, AI, or manual-entry
// path) and a parsed_estimate exists. Loads active audit_rules —
// carrier_filter null means "all carriers", otherwise only rules
// whose list includes the claim's carrier — downloads the measurement
// report/photos when present, and lets findingsRulePass judge each
// rule. A throw here propagates to the caller, which decides how to
// record the failure; the findings-ready email is best-effort and
// never fails the run.
export async function runFindingsPhase(supabase, auditId, audit, parsedEstimate) {
  const { data: claim } = await supabase
    .from('claims')
    .select('property_address, carrier')
    .eq('id', audit.claim_id)
    .single()

  const { data: allRules } = await supabase
    .from('audit_rules')
    .select('id, tier, category, carrier_filter, detection_prompt')
    .eq('active', true)

  const carrier = claim?.carrier
  const rules = (allRules || []).filter(
    (r) => !r.carrier_filter || (carrier && r.carrier_filter.includes(carrier))
  )

  let measurementReport = null
  if (audit.measurement_report_path) {
    const { data: blob } = await supabase.storage
      .from('claim-docs')
      .download(audit.measurement_report_path)
    if (blob) measurementReport = { buffer: Buffer.from(await blob.arrayBuffer()) }
  }

  const photos = []
  for (const path of audit.photos_paths || []) {
    const { data: blob } = await supabase.storage.from('claim-docs').download(path)
    if (blob) photos.push({ path, buffer: Buffer.from(await blob.arrayBuffer()) })
  }

  const { runFindingsRulePass } = await import('./findingsRulePass.js')
  const { findings, estTotalRecovery } = await runFindingsRulePass({
    rules,
    parsedEstimate,
    measurementReport,
    photos,
  })

  await setAuditStatus(supabase, auditId, {
    status: 'findings_ready',
    findings,
    est_total_recovery: estTotalRecovery,
  })

  const { notifyFindingsReady } = await import('./notifyFindings.js')
  await notifyFindingsReady({
    auditId,
    address: claim?.property_address,
    estTotalRecovery,
    findingsCount: findings.length,
  }).catch((err) => console.warn('Findings-ready notify failed:', err.message || err))

  return { status: 'findings_ready', item_count: parsedEstimate.line_items.length, findings_count: findings.length }
}
