import { useState } from 'react'
import DetailView from './DetailView'
import SupplementForm from './SupplementForm'
import ActionsPanel from './ActionsPanel'
import RequestedItemsChecklist from './RequestedItemsChecklist'
import SupplementActivityLog from './SupplementActivityLog'
import { COMPLEXITY_LABELS } from '../lib/stages'

function money(value) {
  return value === null || value === undefined ? '' : `$${Number(value).toFixed(2)}`
}

function supplementFields(s) {
  return [
    { label: 'Claim', value: s.claim?.property_address },
    { label: 'Claim #', value: s.claim?.claim_number },
    { label: 'Contractor', value: s.claim?.contractor?.name },
    { label: 'Stage', value: s.stage },
    { label: 'Original Estimate RCV', value: money(s.original_estimate_rcv) },
    { label: 'Supplement Requested', value: money(s.supplement_requested) },
    { label: 'Supplement Approved', value: money(s.supplement_approved) },
    { label: 'BON Fee', value: money(s.bon_fee) },
    { label: 'Closing Date', value: s.closing_date },
    { label: 'Complexity', value: s.complexity ? COMPLEXITY_LABELS[s.complexity] : null },
    { label: 'Intake Date', value: s.intake_date },
    { label: 'Docs Received Date', value: s.docs_received_date },
    { label: 'Reviewed Date', value: s.reviewed_date },
    { label: 'Supplement Written Date', value: s.supplement_written_date },
    { label: 'Submitted Date', value: s.submitted_date },
    { label: 'Carrier Response Date', value: s.carrier_response_date },
    { label: 'Approved Date', value: s.approved_date },
    { label: 'Paid Date', value: s.paid_date },
    { label: 'Invoiced Date', value: s.invoiced_date },
    { label: 'Closed Date', value: s.closed_date },
    { label: 'Notes', value: s.notes },
  ]
}

function SupplementModal({ supplement, claims, onClose, onSave }) {
  const isNew = !supplement.id
  const [editing, setEditing] = useState(isNew)

  async function handleSubmit(form) {
    await onSave(supplement, form)
    if (isNew) {
      onClose()
    } else {
      setEditing(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-window modal-window-large" onClick={(e) => e.stopPropagation()}>
        {editing ? (
          <SupplementForm
            claims={claims}
            initialValues={supplement}
            onSubmit={handleSubmit}
            onCancel={() => (isNew ? onClose() : setEditing(false))}
          />
        ) : (
          <DetailView
            title={
              supplement.claim?.property_address || supplement.claim?.claim_number || 'Supplement'
            }
            fields={supplementFields(supplement)}
            onEdit={() => setEditing(true)}
            onClose={onClose}
          />
        )}

        {!isNew && (
          <>
            <RequestedItemsChecklist supplementId={supplement.id} />
            <SupplementActivityLog supplementId={supplement.id} />
            <ActionsPanel supplementId={supplement.id} />
          </>
        )}
      </div>
    </div>
  )
}

export default SupplementModal
