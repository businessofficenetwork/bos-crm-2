import { useState } from 'react'
import { AUDIT_STATUS_LABELS, missingDocuments } from '../lib/auditStages'
import { contractorColor } from '../lib/contractorColor'
import { getSession } from '../lib/auth'
import ManualLineItemEntry from './ManualLineItemEntry'
import {
  uploadAuditPdf,
  uploadAuditPhotos,
  createAudit,
  runAudit,
  updateAuditFindings,
  markAuditReviewed,
  draftFindingsEmail,
  updateAuditDocuments,
  getAuditDocumentUrl,
} from '../lib/queries'

function money(value) {
  return value === null || value === undefined ? '—' : `$${Number(value).toLocaleString()}`
}

function claimLabel(claim) {
  const parts = [claim.property_address, claim.claim_number, claim.contractor?.name].filter(
    Boolean
  )
  return parts.length ? parts.join(' — ') : claim.id
}

// Quick visual scan aid for checking the parser got everything - not
// a judgment about the item itself, just flags categories Keri wants
// to eyeball every time.
const YELLOW_FLAG_TERMS = ['starter', 'ice', 'valley']
const GREEN_FLAG_TERMS = ['window', 'paint']
const BLUE_FLAG_TERMS = ['gutter']

// Gutter wins ties (e.g. "Prime & paint gutter / downspout" is blue,
// not green) - checked before the green terms for that reason.
function lineItemFlagClass(description) {
  const text = (description || '').toLowerCase()
  if (YELLOW_FLAG_TERMS.some((term) => text.includes(term))) return 'line-item-flag-yellow'
  if (BLUE_FLAG_TERMS.some((term) => text.includes(term))) return 'line-item-flag-blue'
  if (GREEN_FLAG_TERMS.some((term) => text.includes(term))) return 'line-item-flag-green'
  return ''
}

function AuditModal({ audit, claims, onClose, onDone }) {
  const isNew = !audit
  const [claimId, setClaimId] = useState('')
  const [file, setFile] = useState(null)
  const [measurementFile, setMeasurementFile] = useState(null)
  const [photoFiles, setPhotoFiles] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [findings, setFindings] = useState(audit?.findings || [])
  const [savingFinding, setSavingFinding] = useState(null)
  const [reviewedBy, setReviewedBy] = useState(audit?.reviewed_by || null)
  const [reviewerName, setReviewerName] = useState('')
  const [fullscreen, setFullscreen] = useState(false)
  const [draftingEmail, setDraftingEmail] = useState(false)
  const [emailDraft, setEmailDraft] = useState(null)
  const [copyStatus, setCopyStatus] = useState('')
  const [missingEstimateFile, setMissingEstimateFile] = useState(null)
  const [missingMeasurementFile, setMissingMeasurementFile] = useState(null)
  const [missingPhotoFiles, setMissingPhotoFiles] = useState([])
  const [addingDocs, setAddingDocs] = useState(false)
  const [pdfUrl, setPdfUrl] = useState(null)
  const [pdfLoading, setPdfLoading] = useState(false)

  async function setFindingStatus(index, status) {
    const updated = findings.map((f, i) => (i === index ? { ...f, review_status: status } : f))
    setFindings(updated)
    setSavingFinding(index)
    setError(null)
    try {
      await updateAuditFindings(audit.id, updated)
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingFinding(null)
    }
  }

  async function handleMarkReviewed() {
    const name = getSession()?.name || reviewerName.trim()
    if (!name) {
      setError('Enter your name to mark this reviewed.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await markAuditReviewed(audit.id, name)
      setReviewedBy(name)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDraftEmail() {
    setDraftingEmail(true)
    setError(null)
    setCopyStatus('')
    try {
      const draft = await draftFindingsEmail(audit.id)
      setEmailDraft(draft)
    } catch (err) {
      setError(err.message)
    } finally {
      setDraftingEmail(false)
    }
  }

  async function handleCopyEmail() {
    const text = `Subject: ${emailDraft.subject}\n\n${emailDraft.body}`
    try {
      await navigator.clipboard.writeText(text)
      setCopyStatus('Copied!')
    } catch {
      setCopyStatus('Could not copy — select the text manually.')
    }
  }

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

  async function handleAddMissingDocs() {
    setAddingDocs(true)
    setError(null)
    try {
      const claimId = audit.claim_id
      const updates = {}
      if (missingEstimateFile) updates.estimate_pdf_path = await uploadAuditPdf(claimId, missingEstimateFile)
      if (missingMeasurementFile) {
        updates.measurement_report_path = await uploadAuditPdf(claimId, missingMeasurementFile)
      }
      if (missingPhotoFiles.length) {
        updates.photos_paths = await uploadAuditPhotos(claimId, missingPhotoFiles)
      }
      if (Object.keys(updates).length === 0) {
        setError('Choose at least one file to add.')
        return
      }
      const updated = await updateAuditDocuments(audit.id, updates)
      if (missingDocuments(updated).length === 0) {
        await runAudit(audit.id)
      }
      onDone()
    } catch (err) {
      setError(err.message)
    } finally {
      setAddingDocs(false)
    }
  }

  async function toggleOriginalPdf() {
    if (pdfUrl) {
      setPdfUrl(null)
      return
    }
    setPdfLoading(true)
    setError(null)
    try {
      const url = await getAuditDocumentUrl(audit.estimate_pdf_path)
      setPdfUrl(url)
    } catch (err) {
      setError(err.message)
    } finally {
      setPdfLoading(false)
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
    <div
      className={`modal-overlay ${fullscreen ? 'modal-overlay-fullscreen' : ''}`}
      onClick={onClose}
    >
      <div
        className={`modal-window ${!isNew ? 'modal-window-wide' : ''} ${fullscreen ? 'modal-window-fullscreen' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
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
            <div
              className="detail-header"
              style={
                audit.claim?.contractor?.id
                  ? { borderLeft: `4px solid ${contractorColor(audit.claim.contractor.id)}`, paddingLeft: '0.6rem' }
                  : undefined
              }
            >
              <h3>{audit.claim?.property_address || audit.claim?.claim_number || 'Audit'}</h3>
              <div className="form-actions">
                <button
                  type="button"
                  className="fullscreen-toggle-btn"
                  onClick={() => setFullscreen((f) => !f)}
                >
                  {fullscreen ? '⤡ Exit Fullscreen' : '⤢ Fullscreen'}
                </button>
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

            {(audit.status === 'manual_review' || audit.status === 'failed') && (
              <ManualLineItemEntry auditId={audit.id} onSaved={onDone} />
            )}

            {audit.status === 'queued' && missingDocuments(audit).length > 0 && (
              <div className="audit-review">
                <h3>Add Missing Documents</h3>
                <p className="form-hint">
                  Still need: {missingDocuments(audit).join(', ')}. Adding the last one starts the
                  audit automatically.
                </p>
                {missingDocuments(audit).includes('Estimate') && (
                  <label>
                    Carrier estimate (PDF)
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setMissingEstimateFile(e.target.files[0] || null)}
                    />
                  </label>
                )}
                {missingDocuments(audit).includes('Measurement Report') && (
                  <label>
                    Measurement report (PDF)
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setMissingMeasurementFile(e.target.files[0] || null)}
                    />
                  </label>
                )}
                {missingDocuments(audit).includes('Photos') && (
                  <label>
                    Photos
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png"
                      multiple
                      onChange={(e) => setMissingPhotoFiles([...e.target.files])}
                    />
                  </label>
                )}
                <div className="form-actions">
                  <button type="button" onClick={handleAddMissingDocs} disabled={addingDocs}>
                    {addingDocs ? 'Uploading…' : 'Add Documents'}
                  </button>
                </div>
              </div>
            )}

            {findings.length > 0 && (
              <div className="audit-line-items">
                <h3>Findings</h3>
                <div className="audit-table-wrap">
                  <table className="contractors-table">
                    <thead>
                      <tr>
                        <th>Rule</th>
                        <th>Line Item</th>
                        <th>Est. Value</th>
                        <th>Confidence</th>
                        <th>Rationale</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {findings.map((f, i) => {
                        const status = f.review_status || 'pending'
                        return (
                          <tr key={i}>
                            <td>{f.shortfall_type || f.rule_id}</td>
                            <td>{f.line_item}</td>
                            <td>{money(f.est_value)}</td>
                            <td>{f.confidence}</td>
                            <td>{f.rationale}</td>
                            <td>
                              <div className={`finding-status finding-${status}`}>{status}</div>
                              <div className="finding-actions">
                                <button
                                  type="button"
                                  onClick={() => setFindingStatus(i, 'accepted')}
                                  disabled={savingFinding === i || status === 'accepted'}
                                >
                                  Accept
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setFindingStatus(i, 'rejected')}
                                  disabled={savingFinding === i || status === 'rejected'}
                                >
                                  Reject
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="audit-review">
                  {reviewedBy ? (
                    <p>
                      Reviewed by <strong>{reviewedBy}</strong>
                    </p>
                  ) : getSession()?.name ? (
                    <div className="form-actions">
                      <button type="button" onClick={handleMarkReviewed} disabled={saving}>
                        {saving ? 'Saving…' : `Mark Reviewed as ${getSession().name}`}
                      </button>
                    </div>
                  ) : (
                    <div className="form-actions">
                      <input
                        type="text"
                        placeholder="Your name"
                        value={reviewerName}
                        onChange={(e) => setReviewerName(e.target.value)}
                      />
                      <button type="button" onClick={handleMarkReviewed} disabled={saving}>
                        Mark Reviewed
                      </button>
                    </div>
                  )}
                </div>

                {findings.some((f) => f.review_status === 'accepted') && (
                  <div className="audit-review">
                    <button type="button" onClick={handleDraftEmail} disabled={draftingEmail}>
                      {draftingEmail ? 'Drafting…' : 'Draft Justification Email'}
                    </button>
                    <p className="form-hint">
                      Drafts from accepted findings only, citing the Knowledge Base where relevant.
                      This is a draft only — review and send it yourself, nothing is sent
                      automatically.
                    </p>

                    {emailDraft && (
                      <div className="email-draft">
                        <label>
                          Subject
                          <input type="text" value={emailDraft.subject} readOnly />
                        </label>
                        <label>
                          Body
                          <textarea value={emailDraft.body} readOnly rows={14} />
                        </label>
                        <div className="form-actions">
                          <button type="button" onClick={handleCopyEmail}>
                            Copy to Clipboard
                          </button>
                          {copyStatus && <span>{copyStatus}</span>}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {audit.parsed_estimate?.line_items?.length > 0 && (
              <div className="audit-line-items">
                <div className="audit-line-items-header">
                  <h3>Parsed Line Items</h3>
                  {audit.estimate_pdf_path && (
                    <button type="button" onClick={toggleOriginalPdf} disabled={pdfLoading}>
                      {pdfLoading ? 'Loading…' : pdfUrl ? 'Hide Original PDF' : 'Show Original PDF'}
                    </button>
                  )}
                </div>
                <div className={pdfUrl ? 'audit-side-by-side' : undefined}>
                  {pdfUrl && (
                    <iframe className="audit-pdf-viewer" src={pdfUrl} title="Original estimate PDF" />
                  )}
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
                          <tr key={i} className={lineItemFlagClass(item.description)}>
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
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default AuditModal
