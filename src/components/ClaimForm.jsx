import { useState } from 'react'
import { TRADE_OPTIONS } from '../lib/opThreshold'

const emptyForm = {
  contractor_id: '',
  property_address: '',
  homeowner_name: '',
  carrier: '',
  claim_number: '',
  adjuster_name: '',
  adjuster_contact: '',
  date_of_loss: '',
  state: '',
  notes: '',
  trades_involved: [],
  op_override: '',
  op_notes: '',
}

function ClaimForm({ contractors, initialValues, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    ...emptyForm,
    ...Object.fromEntries(
      Object.keys(emptyForm).map((key) => [key, initialValues?.[key] ?? emptyForm[key]])
    ),
    op_override:
      initialValues?.op_override === true ? 'true' : initialValues?.op_override === false ? 'false' : '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  function handleChange(e) {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  function toggleTrade(trade) {
    setForm((f) => ({
      ...f,
      trades_involved: f.trades_involved.includes(trade)
        ? f.trades_involved.filter((t) => t !== trade)
        : [...f.trades_involved, trade],
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      await onSubmit({
        ...form,
        date_of_loss: form.date_of_loss || null,
        state: form.state ? form.state.trim().toUpperCase().slice(0, 2) : null,
        op_override: form.op_override === '' ? null : form.op_override === 'true',
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="claim-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <label>
          Contractor
          <select name="contractor_id" value={form.contractor_id} onChange={handleChange} required>
            <option value="" disabled>
              Select a contractor…
            </option>
            {contractors.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Date of loss
          <input
            name="date_of_loss"
            type="date"
            value={form.date_of_loss ?? ''}
            onChange={handleChange}
          />
        </label>
      </div>

      <label className="form-notes">
        Property address
        <input name="property_address" value={form.property_address ?? ''} onChange={handleChange} />
      </label>

      <div className="form-row">
        <label>
          Homeowner name
          <input name="homeowner_name" value={form.homeowner_name ?? ''} onChange={handleChange} />
        </label>
        <label>
          Carrier
          <input name="carrier" value={form.carrier ?? ''} onChange={handleChange} />
        </label>
        <label>
          Claim #
          <input name="claim_number" value={form.claim_number ?? ''} onChange={handleChange} />
        </label>
        <label>
          State
          <input
            name="state"
            value={form.state ?? ''}
            onChange={handleChange}
            maxLength={2}
            placeholder="MO"
            style={{ textTransform: 'uppercase' }}
          />
        </label>
      </div>

      <div className="form-row">
        <label>
          Adjuster name
          <input name="adjuster_name" value={form.adjuster_name ?? ''} onChange={handleChange} />
        </label>
        <label>
          Adjuster contact
          <input name="adjuster_contact" value={form.adjuster_contact ?? ''} onChange={handleChange} />
        </label>
      </div>

      <label className="form-notes">
        Notes
        <textarea name="notes" value={form.notes ?? ''} onChange={handleChange} rows={3} />
      </label>

      <div className="form-notes">
        <span>Trades involved (for O&amp;P threshold)</span>
        <div className="trade-checklist">
          {TRADE_OPTIONS.map((trade) => (
            <label key={trade} className="trade-checkbox">
              <input
                type="checkbox"
                checked={form.trades_involved.includes(trade)}
                onChange={() => toggleTrade(trade)}
              />
              {trade}
            </label>
          ))}
        </div>
      </div>

      <div className="form-row">
        <label>
          O&amp;P override
          <select name="op_override" value={form.op_override} onChange={handleChange}>
            <option value="">Use computed value</option>
            <option value="true">Force: Qualifies</option>
            <option value="false">Force: Does Not Qualify</option>
          </select>
        </label>
      </div>

      {form.op_override !== '' && (
        <label className="form-notes">
          O&amp;P override reason
          <textarea name="op_notes" value={form.op_notes ?? ''} onChange={handleChange} rows={2} />
        </label>
      )}

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

export default ClaimForm
