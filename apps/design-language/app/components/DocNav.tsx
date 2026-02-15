const NAV_SECTIONS = [
  {
    title: 'Foundation',
    links: [
      { id: 'philosophy', label: 'Philosophy' },
      { id: 'principles', label: 'Principles' },
      { id: 'cactuspunk', label: 'Cactuspunk' },
    ],
  },
  {
    title: 'Tokens',
    links: [
      { id: 'colors', label: 'Colors' },
      { id: 'typography', label: 'Typography' },
      { id: 'spacing', label: 'Spacing' },
    ],
  },
  {
    title: 'Layout',
    links: [
      { id: 'grid', label: 'Grid System' },
      { id: 'cells', label: 'Cells & Themes' },
      { id: 'groups', label: 'Drawer Groups' },
    ],
  },
  {
    title: 'Components',
    links: [
      { id: 'buttons', label: 'Buttons' },
      { id: 'tags', label: 'Tags & Labels' },
      { id: 'ui-elements', label: 'UI Elements' },
    ],
  },
];

export function DocNav({ activeSection }: { activeSection: string }) {
  return (
    <nav className="doc-nav">
      <a href="#" className="doc-nav-logo">
        <div className="doc-nav-icon">{'\u7F8E'}</div>
        <div>
          <div className="doc-nav-title">Mikoto</div>
          <div className="doc-nav-subtitle">Design System</div>
        </div>
      </a>

      {NAV_SECTIONS.map((section) => (
        <div key={section.title} className="nav-section">
          <div className="nav-section-title">{section.title}</div>
          {section.links.map((link) => (
            <a
              key={link.id}
              href={`#${link.id}`}
              className={`nav-link${activeSection === link.id ? ' active' : ''}`}
            >
              {link.label}
            </a>
          ))}
        </div>
      ))}
    </nav>
  );
}
