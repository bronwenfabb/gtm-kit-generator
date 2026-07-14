import { useState } from 'react'

interface Props {
  value: string
  onSave: (value: string) => void
  multiline?: boolean
  className?: string
}

export function EditableText({ value, onSave, multiline = false, className = '' }: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  function start() {
    setDraft(value)
    setEditing(true)
  }

  function commit() {
    setEditing(false)
    const trimmed = draft.trim()
    if (trimmed && trimmed !== value) onSave(trimmed)
  }

  function cancel() {
    setDraft(value)
    setEditing(false)
  }

  if (!editing) {
    return (
      <span
        className={`editable ${className}`}
        title="Click to edit"
        role="button"
        tabIndex={0}
        onClick={start}
        onKeyDown={(e) => {
          if (e.key === 'Enter') start()
        }}
      >
        {value}
      </span>
    )
  }

  if (multiline) {
    return (
      <textarea
        className={`editable-input ${className}`}
        value={draft}
        autoFocus
        rows={Math.min(14, Math.max(3, draft.split('\n').length + 1))}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Escape') cancel()
        }}
      />
    )
  }

  return (
    <input
      className={`editable-input ${className}`}
      value={draft}
      autoFocus
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') commit()
        if (e.key === 'Escape') cancel()
      }}
    />
  )
}
