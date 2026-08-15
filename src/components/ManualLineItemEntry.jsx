import { useState } from 'react'
import { submitManualLineItems } from '../lib/queries'

const BLANK_ROW = { code: '', description: '', qty: '', unit: '', rcv: '', acv: '' }

// Fallback for when a PDF can't be parsed (unreadable text layer) and/or
// Claude isn't available - lets Keri type in what the estimate actually
// says by hand, so line-item flagging, the side-by-side PDF view, and
// Estimate Value on the Jobs page all still work off real data instead
// of the audit being stuck. Saved items go through the same findings
// step as a parsed estimate (see audit-manual-entry-background.js).
function ManualLineItemEntry({ auditId, onSaved }) {
  const [rows, setRows] = useState([{ ...BLANK_ROW }])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  function updateRow(index, field, value) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)))
  }

  function addRow() {
    setRows((prev) => [...prev, { ...BLANK_ROW }])
  }

  function removeRow(index) {
    setRows((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSave() {
    const items = rows
      .filter((r) => r.description.trim())
      .map((r) => ({
        code: r.code.trim() || null,
        description: r.description.trim(),
        qty: r.qty === '' ? null : Number(r.qty),
        unit: r.unit.trim() || null,
        rcv: r.rcv === '' ? null : Number(r.rcv),
        acv: r.acv === '' ? null : Number(r.acv),
      }))
    if (items.length === 0) {
      setError('Enter at least one line item with a description.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await submitManualLineItems(auditId, items)
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="audit-review">
      <h3>Enter Line Items Manually</h3>
      <p className="form-hint">
        For when the PDF can't be parsed automatically. Type in what the estimate says - the same
        flagging and findings review will run against these items once saved.
      </p>
      <div className="audit-table-wrap">
        <table className="contractors-table manual-entry-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Description</th>
              <th>Qty</th>
              <th>Unit</th>
              <th>RCV</th>
              <th>ACV</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                <td>
                  <input type="text" value={row.code} onChange={(e) => updateRow(i, 'code', e.target.value)} />
                </td>
                <td>
                  <input
                    type="text"
                    value={row.description}
                    onChange={(e) => updateRow(i, 'description', e.target.value)}
                  />
                </td>
                <td>
                  <input type="number" value={row.qty} onChange={(e) => updateRow(i, 'qty', e.target.value)} />
                </td>
                <td>
                  <input type="text" value={row.unit} onChange={(e) => updateRow(i, 'unit', e.target.value)} />
                </td>
                <td>
                  <input type="number" value={row.rcv} onChange={(e) => updateRow(i, 'rcv', e.target.value)} />
                </td>
                <td>
                  <input type="number" value={row.acv} onChange={(e) => updateRow(i, 'acv', e.target.value)} />
                </td>
                <td>
                  <button type="button" onClick={() => removeRow(i)} disabled={rows.length === 1}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {error && <p className="form-error">{error}</p>}
      <div className="form-actions">
        <button type="button" onClick={addRow}>
          + Add Row
        </button>
        <button type="button" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save & Run Findings'}
        </button>
      </div>
    </div>
  )
}

export default ManualLineItemEntry
