function money(value) {
  return value === null || value === undefined ? '—' : `$${Number(value).toLocaleString()}`
}

// Same table shape for both tabs: Supplements shows what's still
// active in the pipeline, Results shows what's closed out - variant
// just swaps which date/dollar columns matter most.
function ContractorSupplementsTable({ supplements, variant }) {
  const isResults = variant === 'results'

  if (supplements.length === 0) {
    return <p className="contractor-tab-empty">{isResults ? 'No closed supplements yet.' : 'No active supplements.'}</p>
  }

  return (
    <table className="contractors-table">
      <thead>
        <tr>
          <th>Job</th>
          {isResults ? (
            <>
              <th>Closed</th>
              <th>Supplement Approved</th>
              <th>BON Fee</th>
            </>
          ) : (
            <>
              <th>Stage</th>
              <th>Entered</th>
            </>
          )}
        </tr>
      </thead>
      <tbody>
        {supplements.map((s) => (
          <tr key={s.id}>
            <td>{s.claim?.property_address || s.claim?.claim_number || 'Untitled job'}</td>
            {isResults ? (
              <>
                <td>{s.closed_date || '—'}</td>
                <td>{money(s.supplement_approved)}</td>
                <td>{money(s.bon_fee)}</td>
              </>
            ) : (
              <>
                <td>{s.stage}</td>
                <td>{s.intake_date || s.created_at?.slice(0, 10) || '—'}</td>
              </>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default ContractorSupplementsTable
