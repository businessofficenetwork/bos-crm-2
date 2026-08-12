import { useState } from 'react'
import { AUDIT_STATUS_LABELS } from '../lib/auditStages'
import { uploadAuditPdf, uploadAuditPhotos, createAudit, runAudit } from '../lib/queries'

function money(value) {
  return value === null || value === undefined ? '—' : `$${Number(value).toLocaleString()}`
}

function claimLabel(claim) {
  const parts = [claim.property_address, claim.claim_number, claim.contractor?.name].filter(
    Boolean
  )
  return parts.length ? parts.join(' — ') : claim.id
}

function AuditModal({ audit, claims, onClose, onDone }) {
  const isNew = !audit
  const [claimId, setClaimId] = useState('')
  const [file, setFile] = useState(null)
  const [measurementFile, setMeasurementFile] = useState(null)
  const [photoFiles, setPhotoFiles] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function handleCreate(e) {
    e.preventDefault()
    if (!claimId || !file) {
      setError('Choose a claim and a PDF file.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const path = await uploadAuditPdf(claimId, file)
      const measurementPath = measurementFile ? await uploadAuditPdf(claimId, measurementFile) : null
      const photoPaths = photoFiles.length ? await uploadAuditPhotos(claimId, photoFiles) : null
      const newAudit = await createAudit({
        claim_id: claimId,
        estimate_pdf_path: path,
        measurement_report_path: measurementPath,
        photos_paths: photoPaths,
      })
      await runAudit(newAudit.id)
      onDone()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleRunAgain() {
    setSaving(true)
    setError(null)
    try {
      await runAudit(audit.id)
      onDone()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-window" onClick={(e) => e.stopPropagation()}>
        {isNew ? (
          <form className="supplement-form" onSubmit={handleCreate}>
            <h3>New Audit</h3>
            <label>
              Claim
              <select value={claimId} onChange={(e) => setClaimId(e.target.value)} required>
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
              Carrier estimate (PDF)
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setFile(e.target.files[0] || null)}
                required
              />
            </label>
            <label>
              Measurement report (PDF) — optional, enables quantity/waste checks
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setMeasurementFile(e.target.files[0] || null)}
              />
            </label>
            <label>
              Roof/property photos — optional, enables material verification checks
              <input
                type="file"
                accept=".jpg,.jpeg,.png"
                multiple
                onChange={(e) => setPhotoFiles([...e.target.files])}
              />
            </label>
            {error && <p className="form-error">{error}</p>}
            <div className="form-actions">
              <button type="submit" disabled={saving}>
                {saving ? 'Uploading…' : 'Upload & Run'}
              </button>
              <button type="button" onClick={onClose} disabled={saving}>
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="detail-view">
            <div className="detail-header">
              <h3>{audit.claim?.property_address || audit.claim?.claim_number || 'Audit'}</h3>
              <div className="form-actions">
                <button type="button" onClick={handleRunAgain} disabled={saving}>
                  {saving ? 'Running…' : 'Run again'}
                </button>
                <button type="button" onClick={onClose}>
                  Close
                </button>
              </div>
            </div>

            <dl className="detail-fields">
              <div className="detail-row">
                <dt>Contractor</dt>
                <dd>{audit.claim?.contractor?.name || '—'}</dd>
              </div>
              <div className="detail-row">
                <dt>Carrier</dt>
                <dd>{audit.claim?.carrier || '—'}</dd>
              </div>
              <div className="detail-row">
                <dt>Status</dt>
                <dd>{AUDIT_STATUS_LABELS[audit.status] || audit.status}</dd>
              </div>
              <div className="detail-row">
                <dt>Est. Recovery</dt>
                <dd>{money(audit.est_total_recovery)}</dd>
              </div>
            </dl>

            {error && <p className="form-error">{error}</p>}
            {audit.error_detail && <p className="form-error">{audit.error_detail}</p>}

            {audit.parsed_estimate?.line_items?.length > 0 && (
              <div className="audit-line-items">
                <h3>Parsed Line Items</h3>
                <div className="audit-table-wrap">
                  <table className="contractors-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Description</th>
                        <th>Qty</th>
                        <th>Unit</th>
                        <th>RCV</th>
                        <th>ACV</th>
                      </tr>
                    </thead>
                    <tbody>
                      {audit.parsed_estimate.line_items.map((item, i) => (
                        <tr key={i}>
                          <td>{item.code}</td>
                          <td>{item.description}</td>
                          <td>{item.qty}</td>
                          <td>{item.unit}</td>
                          <td>{money(item.rcv)}</td>
                          <td>{money(item.acv)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default AuditModal
