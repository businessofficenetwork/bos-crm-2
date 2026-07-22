import { useState } from 'react'

const STAGES = [
  'Intake',
  'Docs Received',
  'Reviewed',
  'Supplement Written',
  'Submitted',
  'Carrier Response',
  'Approved',
  'Paid',
  'Invoiced',
  'Closed',
]

const DATE_FIELDS = [
  ['intake_date', 'Intake'],
  ['docs_received_date', 'Docs Received'],
  ['reviewed_date', 'Reviewed'],
  ['supplement_written_date', 'Supplement Written'],
  ['submitted_date', 'Submitted'],
  ['carrier_response_date', 'Carrier Response'],
  ['approved_date', 'Approved'],
  ['paid_date', 'Paid'],
  ['invoiced_date', 'Invoiced'],
  ['closed_date', 'Closed'],
]

const MONEY_FIELDS = [
  'original_estimate_rcv',
  'supplement_requested',
  'supplement_approved',
  'bon_fee',
]

const emptyForm = {
  claim_id: '',
  stage: 'Intake',
  original_estimate_rcv: '',
  supplement_requested: '',
  supplement_approved: '',
  bon_fee: '',
  notes: '',
  closing_date: '',
  complexity: '',
  card_color: '',
  ...Object.fromEntries(DATE_FIELDS.map(([key]) => [key, ''])),
}

function claimLabel(claim) {
  const parts = [claim.property_address, claim.claim_number, claim.contractor?.name].filter(
    Boolean
  )
  return parts.length ? parts.join(' — ') : claim.id
}

function toPayload(form) {
  const payload = { ...form }
  for (const key of MONEY_FIELDS) {
    payload[key] = payload[key] === '' ? null : Number(payload[key])
  }
  for (const [key] of DATE_FIELDS) {
    payload[key] = payload[key] === '' ? null : payload[key]
  }
  payload.closing_date = payload.closing_date === '' ? null : payload.closing_date
  payload.complexity = payload.complexity === '' ? null : payload.complexity
  payload.card_color = payload.card_color === '' ? null : payload.card_color
  return payload
}

function SupplementForm({ claims, initialValues, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    ...emptyForm,
    ...Object.fromEntries(
      Object.keys(emptyForm).map((key) => [key, initialValues?.[key] ?? emptyForm[key]])
    ),
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  function handleChange(e) {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  function handleClosingCheckbox(e) {
    setForm((f) => ({ ...f, closing_date: e.target.checked ? f.closing_date || '' : '' }))
  }

  function handleCardColorCheckbox(e) {
    setForm((f) => ({ ...f, card_color: e.target.checked ? f.card_color || '#e8a020' : '' }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      await onSubmit(toPayload(form))
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="supplement-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <label>
          Claim
          <select name="claim_id" value={form.claim_id} onChange={handleChange} required>
            <option value="" disabled>
              Select a claim…
            </option>
            {claims.map((c) => (
              <option key={c.id} value={c.id}>
                {claimLabel(c)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Stage
          <select name="stage" value={form.stage} onChange={handleChange}>
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="form-row">
        <label>
          Original estimate RCV
          <input
            name="original_estimate_rcv"
            type="number"
            step="0.01"
            value={form.original_estimate_rcv}
            onChange={handleChange}
          />
        </label>
        <label>
          Supplement requested
          <input
            name="supplement_requested"
            type="number"
            step="0.01"
            value={form.supplement_requested}
            onChange={handleChange}
          />
        </label>
        <label>
          Supplement approved
          <input
            name="supplement_approved"
            type="number"
            step="0.01"
            value={form.supplement_approved}
            onChange={handleChange}
          />
        </label>
        <label>
          BON fee
          <input
            name="bon_fee"
            type="number"
            step="0.01"
            value={form.bon_fee}
            onChange={handleChange}
          />
        </label>
      </div>

      <div className="form-row">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={!!form.closing_date}
            onChange={handleClosingCheckbox}
          />
          Home is being sold (has a closing date)
        </label>
        {!!form.closing_date && (
          <label>
            Closing date
            <input
              name="closing_date"
              type="date"
              value={form.closing_date}
              onChange={handleChange}
            />
          </label>
        )}
        <label>
          Complexity
          <select name="complexity" value={form.complexity ?? ''} onChange={handleChange}>
            <option value="">Not set</option>
            <option value="roof_only">Roof Only</option>
            <option value="multiple_trades">Multiple Trades</option>
            <option value="complex">Complex</option>
          </select>
        </label>
      </div>

      <div className="form-row">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={!!form.card_color}
            onChange={handleCardColorCheckbox}
          />
          Highlight this card with a custom color
        </label>
        {!!form.card_color && (
          <label>
            Card color
            <input
              name="card_color"
              type="color"
              value={form.card_color}
              onChange={handleChange}
            />
          </label>
        )}
      </div>

      <fieldset className="stage-dates">
        <legend>Stage dates</legend>
        <div className="form-row wrap">
          {DATE_FIELDS.map(([key, label]) => (
            <label key={key}>
              {label}
              <input name={key} type="date" value={form[key]} onChange={handleChange} />
            </label>
          ))}
        </div>
      </fieldset>

      <label className="form-notes">
        Notes
        <textarea name="notes" value={form.notes ?? ''} onChange={handleChange} rows={3} />
      </label>

      {error && <p className="form-error">{error}</p>}

      <div className="form-actions">
        <button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button type="button" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
      </div>
    </form>
  )
}

export default SupplementForm
