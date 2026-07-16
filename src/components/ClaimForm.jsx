import { useState } from 'react'

const emptyForm = {
  contractor_id: '',
  property_address: '',
  homeowner_name: '',
  carrier: '',
  claim_number: '',
  adjuster_name: '',
  adjuster_contact: '',
  date_of_loss: '',
  notes: '',
}

function ClaimForm({ contractors, initialValues, onSubmit, onCancel }) {
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

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      await onSubmit({ ...form, date_of_loss: form.date_of_loss || null })
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
