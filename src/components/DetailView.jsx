function DetailView({ title, fields, onEdit, onClose }) {
  return (
    <div className="detail-view">
      <div className="detail-header">
        <h3>{title}</h3>
        <div className="form-actions">
          <button type="button" onClick={onEdit}>
            Edit
          </button>
          <button type="button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
      <dl className="detail-fields">
        {fields.map(({ label, value }) => (
          <div className="detail-row" key={label}>
            <dt>{label}</dt>
            <dd>{value || '—'}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

export default DetailView
