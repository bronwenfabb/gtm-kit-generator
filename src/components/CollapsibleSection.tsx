import type { ReactNode } from 'react'

interface Props {
  id: string
  title: string
  open: boolean
  onToggle: (id: string) => void
  children: ReactNode
}

export function CollapsibleSection({ id, title, open, onToggle, children }: Props) {
  return (
    <section id={id} className="collapsible">
      <button
        type="button"
        className="collapsible-header"
        aria-expanded={open}
        aria-controls={`${id}-body`}
        onClick={() => onToggle(id)}
      >
        <span className={`chevron ${open ? 'open' : ''}`} aria-hidden="true">
          ▸
        </span>
        <h2>{title}</h2>
      </button>
      {open && (
        <div id={`${id}-body`} className="collapsible-body">
          {children}
        </div>
      )}
    </section>
  )
}
