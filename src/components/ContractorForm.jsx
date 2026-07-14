import { useState } from 'react'

const emptyForm = {
  name: '',
  contact_name: '',
  phone: '',
  email: '',
  market: 'other',
  pricing_tier: '',
  status: 'active',
  notes: '',
}

function ContractorForm({ initialValues, onSubmit, onCancel }) {
  const [form, setForm] = useState({ ...emptyForm, ...initialValues })
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
      await onSubmit(form)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="contractor-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <label>
          Name
          <input name="name" value={form.name} onChange={handleChange} required />
        </label>
        <label>
          Contact name
          <input name="contact_name" value={form.contact_name ?? ''} onChange={handleChange} />
        </label>
      </div>

      <div className="form-row">
        <label>
          Phone
          <input name="phone" value={form.phone ?? ''} onChange={handleChange} />
        </label>
        <label>
          Email
          <input name="email" type="email" value={form.email ?? ''} onChange={handleChange} />
        </label>
      </div>

      <div className="form-row">
        <label>
          Market
          <select name="market" value={form.market} onChange={handleChange}>
            <option value="MO">MO</option>
            <option value="WI">WI</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label>
          Pricing tier
          <input name="pricing_tier" value={form.pricing_tier ?? ''} onChange={handleChange} />
        </label>
        <label>
          Status
          <select name="status" value={form.status} onChange={handleChange}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="prospect">Prospect</option>
          </select>
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

export default ContractorForm
