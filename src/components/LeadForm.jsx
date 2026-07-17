import { useState } from 'react'

const emptyForm = {
  name: '',
  company: '',
  phone: '',
  email: '',
  message: '',
  source: 'web',
  status: 'new',
}

function LeadForm({ initialValues, onSubmit, onCancel }) {
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
      await onSubmit(form)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="lead-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <label>
          Name
          <input name="name" value={form.name} onChange={handleChange} required />
        </label>
        <label>
          Company
          <input name="company" value={form.company ?? ''} onChange={handleChange} />
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
          Source
          <select name="source" value={form.source} onChange={handleChange}>
            <option value="web">Web</option>
            <option value="meta_ad">Meta Ad</option>
            <option value="cold_call">Cold Call</option>
            <option value="referral">Referral</option>
          </select>
        </label>
        <label>
          Status
          <select name="status" value={form.status} onChange={handleChange}>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="audit_sent">Audit Sent</option>
            <option value="converted">Converted</option>
            <option value="dead">Dead</option>
          </select>
        </label>
      </div>

      <label className="form-notes">
        Biggest supplement headache
        <textarea name="message" value={form.message ?? ''} onChange={handleChange} rows={3} />
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

export default LeadForm
