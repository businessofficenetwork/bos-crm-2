import { useEffect, useState } from 'react'
import { listSupplementsForContractor } from '../lib/queries'
import { contractorColor } from '../lib/contractorColor'
import ContractorPendingBanner from './ContractorPendingBanner'
import ContractorSupplementsTable from './ContractorSupplementsTable'
import ContractorCommunications from './ContractorCommunications'

const TABS = ['Information', 'Supplements', 'Results', 'Communications']

function ContractorDetail({ contractor, fields, onEdit, onClose }) {
  const [tab, setTab] = useState('Information')
  const [supplements, setSupplements] = useState([])

  useEffect(() => {
    setTab('Information')
    listSupplementsForContractor(contractor.id)
      .then(setSupplements)
      .catch(() => setSupplements([]))
  }, [contractor.id])

  const active = supplements.filter((s) => s.stage !== 'Closed')
  const closed = supplements.filter((s) => s.stage === 'Closed')
  const headerColor = contractorColor(contractor.id)

  return (
    <div className="detail-view">
      <ContractorPendingBanner contractorId={contractor.id} />

      <div className="detail-header" style={headerColor ? { borderLeft: `4px solid ${headerColor}`, paddingLeft: '0.6rem' } : undefined}>
        <h3>{contractor.name}</h3>
        <div className="form-actions">
          <button type="button" onClick={onEdit}>
            Edit
          </button>
          <button type="button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>

      <div className="contractor-tabs">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            className={`contractor-tab ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t}
            {t === 'Results' && closed.length > 0 ? ` (${closed.length})` : ''}
          </button>
        ))}
      </div>

      <div className="contractor-tab-panel">
        {tab === 'Information' && (
          <dl className="detail-fields">
            {fields.map(({ label, value }) => (
              <div className="detail-row" key={label}>
                <dt>{label}</dt>
                <dd>{value || '—'}</dd>
              </div>
            ))}
          </dl>
        )}
        {tab === 'Supplements' && <ContractorSupplementsTable supplements={active} variant="active" />}
        {tab === 'Results' && <ContractorSupplementsTable supplements={closed} variant="results" />}
        {tab === 'Communications' && <ContractorCommunications contractorId={contractor.id} />}
      </div>
    </div>
  )
}

export default ContractorDetail
