import { useState } from 'react'
import { uploadAuditPdf, uploadAuditPhotos, createAudit, runAudit } from '../lib/queries'

// Inline version of AuditModal's "New Audit" form, embedded directly in
// the job screen so a scope audit can be uploaded without a trip to the
// Scope Audit tab. Deliberately a separate small component rather than a
// shared one with AuditModal - it always knows its claimId already, so it
// skips the claim picker, and this keeps each entry point independent.
function ScopeAuditUpload({ claimId }) {
  const [file, setFile] = useState(null)
  const [measurementFile, setMeasurementFile] = useState(null)
  const [photoFiles, setPhotoFiles] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [done, setDone] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!file) {
      setError('Choose the carrier estimate PDF.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const path = await uploadAuditPdf(claimId, file)
      const measurementPath = measurementFile ? await uploadAuditPdf(claimId, measurementFile) : null
      const photoPaths = photoFiles.length ? await uploadAuditPhotos(claimId, photoFiles) : null
      const audit = await createAudit({
        claim_id: claimId,
        estimate_pdf_path: path,
        measurement_report_path: measurementPath,
        photos_paths: photoPaths,
      })
      await runAudit(audit.id)
      setDone(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (done) {
    return (
      <div className="audit-review">
        <h3>Scope Audit</h3>
        <p>Uploaded and running — check the Scope Audit tab for results.</p>
        <div className="form-actions">
          <button type="button" onClick={() => setDone(false)}>
            Upload Another
          </button>
        </div>
      </div>
    )
  }

  return (
    <form className="supplement-form" onSubmit={handleSubmit}>
      <h3>Scope Audit</h3>
      <label>
        Carrier estimate (PDF)
        <input type="file" accept=".pdf" onChange={(e) => setFile(e.target.files[0] || null)} />
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
      </div>
    </form>
  )
}

export default ScopeAuditUpload
