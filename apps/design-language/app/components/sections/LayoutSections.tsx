export function GridSection() {
  return (
    <section className="doc-section" id="grid">
      <header className="doc-section-header">
        <div className="doc-section-tag">// 007</div>
        <h1 className="doc-section-title">Grid System</h1>
        <p className="doc-section-desc">
          A 12-column grid provides the foundation for the modular layout. Cells
          snap to column widths like Lego blocks.
        </p>
      </header>

      <div className="doc-block">
        <h2 className="doc-block-title">12-Column Grid</h2>
        <p className="doc-block-text">
          The grid uses 12 columns with 1px gaps. Cells span multiples of
          columns (3, 4, 6, etc.) to create layouts that always complete to 12.
        </p>
        <div className="live-grid-demo">
          <div className="demo-cell mid" style={{ gridColumn: 'span 12' }}>
            w12
          </div>
          <div className="demo-cell light" style={{ gridColumn: 'span 6' }}>
            w6
          </div>
          <div className="demo-cell light" style={{ gridColumn: 'span 6' }}>
            w6
          </div>
          <div className="demo-cell mid" style={{ gridColumn: 'span 4' }}>
            w4
          </div>
          <div className="demo-cell mid" style={{ gridColumn: 'span 4' }}>
            w4
          </div>
          <div className="demo-cell mid" style={{ gridColumn: 'span 4' }}>
            w4
          </div>
          <div className="demo-cell light" style={{ gridColumn: 'span 3' }}>
            w3
          </div>
          <div className="demo-cell light" style={{ gridColumn: 'span 3' }}>
            w3
          </div>
          <div className="demo-cell light" style={{ gridColumn: 'span 3' }}>
            w3
          </div>
          <div className="demo-cell light" style={{ gridColumn: 'span 3' }}>
            w3
          </div>
          <div className="demo-cell mid" style={{ gridColumn: 'span 8' }}>
            w8
          </div>
          <div className="demo-cell mid" style={{ gridColumn: 'span 4' }}>
            w4
          </div>
        </div>
      </div>

      <div className="doc-block">
        <h2 className="doc-block-title">Common Patterns</h2>
        <table className="token-table">
          <thead>
            <tr>
              <th>Pattern</th>
              <th>Columns</th>
              <th>Usage</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <span className="token-name">Hero</span>
              </td>
              <td className="token-value">6 + 6</td>
              <td className="token-desc">Main headline with visual</td>
            </tr>
            <tr>
              <td>
                <span className="token-name">Stats Row</span>
              </td>
              <td className="token-value">3 + 3 + 3 + 3</td>
              <td className="token-desc">Four equal stat cells</td>
            </tr>
            <tr>
              <td>
                <span className="token-name">Features</span>
              </td>
              <td className="token-value">4 + 4 + 4</td>
              <td className="token-desc">Three feature cards</td>
            </tr>
            <tr>
              <td>
                <span className="token-name">Content + Visual</span>
              </td>
              <td className="token-value">5 + 7 or 6 + 6</td>
              <td className="token-desc">Text with screenshot/demo</td>
            </tr>
            <tr>
              <td>
                <span className="token-name">Full Width</span>
              </td>
              <td className="token-value">12</td>
              <td className="token-desc">Section headers, tabs</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="doc-block">
        <h2 className="doc-block-title">Row Spanning</h2>
        <p className="doc-block-text">
          Cells can span multiple rows using <code>h2</code>, <code>h3</code>,{' '}
          <code>h4</code> classes. This creates visual anchors and breaks up the
          grid monotony.
        </p>
        <div className="live-grid-demo">
          <div
            className="demo-cell light"
            style={{ gridColumn: 'span 6', gridRow: 'span 2' }}
          >
            w6 h2
          </div>
          <div className="demo-cell mid" style={{ gridColumn: 'span 6' }}>
            w6
          </div>
          <div className="demo-cell mid" style={{ gridColumn: 'span 3' }}>
            w3
          </div>
          <div className="demo-cell fill-cyan" style={{ gridColumn: 'span 3' }}>
            w3
          </div>
        </div>
      </div>
    </section>
  );
}

export function CellsSection() {
  return (
    <section className="doc-section" id="cells">
      <header className="doc-section-header">
        <div className="doc-section-tag">// 008</div>
        <h1 className="doc-section-title">Cells & Themes</h1>
        <p className="doc-section-desc">
          Cells are the fundamental building blocks. Each cell has a theme that
          determines its background color and visual weight.
        </p>
      </header>

      <div className="doc-block">
        <h2 className="doc-block-title">Background Themes</h2>
        <p className="doc-block-text">
          Four neutral themes create depth within the grid. Mix them to create
          visual hierarchy.
        </p>
        <div className="component-demo">
          <div className="component-demo-header">
            <span className="component-demo-title">Background Themes</span>
          </div>
          <div className="component-demo-body">
            <div className="cell-demo dark">
              <span className="cell-demo-label">Dark</span>
              <span className="cell-demo-title">Headers</span>
            </div>
            <div className="cell-demo mid">
              <span className="cell-demo-label">Mid</span>
              <span className="cell-demo-title">Content</span>
            </div>
            <div className="cell-demo light">
              <span className="cell-demo-label">Light</span>
              <span className="cell-demo-title">Featured</span>
            </div>
            <div className="cell-demo lighter">
              <span className="cell-demo-label">Lighter</span>
              <span className="cell-demo-title">Emphasis</span>
            </div>
          </div>
        </div>
      </div>

      <div className="doc-block">
        <h2 className="doc-block-title">Fill Themes</h2>
        <p className="doc-block-text">
          Solid color fills for maximum impact. Use sparingly to create focal
          points.
        </p>
        <div className="component-demo">
          <div className="component-demo-header">
            <span className="component-demo-title">Fill Themes</span>
          </div>
          <div className="component-demo-body">
            <div className="cell-demo fill-blue">
              <span className="cell-demo-label">Fill Blue</span>
              <span className="cell-demo-title">Primary</span>
            </div>
            <div className="cell-demo fill-cyan">
              <span className="cell-demo-label">Fill Cyan</span>
              <span className="cell-demo-title">Info</span>
            </div>
            <div className="cell-demo fill-magenta">
              <span className="cell-demo-label">Fill Magenta</span>
              <span className="cell-demo-title">Accent</span>
            </div>
          </div>
        </div>
      </div>

      <div className="doc-block">
        <h2 className="doc-block-title">Accent Borders</h2>
        <p className="doc-block-text">
          Left border accents add color without overwhelming. Great for content
          cells that need subtle differentiation.
        </p>
        <div className="accent-demo">
          <div className="accent-cell accent-blue">
            <span className="accent-cell-title">accent-blue</span>
          </div>
          <div className="accent-cell accent-cyan">
            <span className="accent-cell-title">accent-cyan</span>
          </div>
          <div className="accent-cell accent-magenta">
            <span className="accent-cell-title">accent-magenta</span>
          </div>
          <div className="accent-cell accent-purple">
            <span className="accent-cell-title">accent-purple</span>
          </div>
        </div>
      </div>

      <div className="doc-block">
        <h2 className="doc-block-title">Cell IDs</h2>
        <p className="doc-block-text">
          Every cell can display a small ID label in the corner. This reinforces
          the systematic aesthetic and aids in referencing specific cells during
          design discussions.
        </p>
        <div className="doc-code">
          <span className="selector">.cell-id</span>
          {' {\n'}
          {'  '}
          <span className="prop">position</span>:{' '}
          <span className="value">absolute</span>;{'\n'}
          {'  '}
          <span className="prop">top</span>: <span className="value">8px</span>;
          {'\n'}
          {'  '}
          <span className="prop">right</span>:{' '}
          <span className="value">8px</span>;{'\n'}
          {'  '}
          <span className="prop">font-family</span>:{' '}
          <span className="value">'JetBrains Mono', monospace</span>;{'\n'}
          {'  '}
          <span className="prop">font-size</span>:{' '}
          <span className="value">8px</span>;{'\n'}
          {'  '}
          <span className="prop">color</span>:{' '}
          <span className="value">var(--text-dim)</span>;{'\n'}
          {'  '}
          <span className="prop">opacity</span>:{' '}
          <span className="value">0.5</span>;{'\n'}
          {'}'}
        </div>
      </div>
    </section>
  );
}

export function GroupsSection() {
  return (
    <section className="doc-section" id="groups">
      <header className="doc-section-header">
        <div className="doc-section-tag">// 009</div>
        <h1 className="doc-section-title">Drawer Groups</h1>
        <p className="doc-section-desc">
          Cells are organized into drawer groups — discrete sections with clear
          margins between them.
        </p>
      </header>

      <div className="doc-block">
        <h2 className="doc-block-title">Group Structure</h2>
        <p className="doc-block-text">
          Each major section of the page is wrapped in a{' '}
          <code>.drawer-group</code>. Groups have a 24px bottom margin that
          creates visual breathing room between sections.
        </p>
        <div className="doc-code">
          <span className="selector">.drawer-group</span>
          {' {\n'}
          {'  '}
          <span className="prop">margin-bottom</span>:{' '}
          <span className="value">24px</span>;{' '}
          <span className="comment">{'/* --group-gap */'}</span>
          {'\n}\n\n'}
          <span className="selector">.grid</span>
          {' {\n'}
          {'  '}
          <span className="prop">display</span>:{' '}
          <span className="value">grid</span>;{'\n'}
          {'  '}
          <span className="prop">grid-template-columns</span>:{' '}
          <span className="value">repeat(12, 1fr)</span>;{'\n'}
          {'  '}
          <span className="prop">gap</span>: <span className="value">1px</span>;{' '}
          <span className="comment">{'/* --cell-gap */'}</span>
          {'\n'}
          {'  '}
          <span className="prop">background</span>:{' '}
          <span className="value">var(--border)</span>;{' '}
          <span className="comment">{'/* creates grid lines */'}</span>
          {'\n'}
          {'  '}
          <span className="prop">border</span>:{' '}
          <span className="value">1px solid var(--border)</span>;{'\n'}
          {'}'}
        </div>
      </div>

      <div className="doc-block">
        <h2 className="doc-block-title">Section Flow</h2>
        <p className="doc-block-text">
          The landing page uses 7 drawer groups in sequence:
        </p>
        <table className="token-table">
          <thead>
            <tr>
              <th>Group</th>
              <th>Content</th>
              <th>Key Cells</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <span className="token-name">Hero</span>
              </td>
              <td className="token-desc">Main headline, mockup, stats</td>
              <td className="token-value">6+6, 3+3+3+3</td>
            </tr>
            <tr>
              <td>
                <span className="token-name">Problem</span>
              </td>
              <td className="token-desc">Pain points, illustration</td>
              <td className="token-value">8+4, 4+4+4</td>
            </tr>
            <tr>
              <td>
                <span className="token-name">Features</span>
              </td>
              <td className="token-desc">Feature cards overview</td>
              <td className="token-value">12, 4+4+4</td>
            </tr>
            <tr>
              <td>
                <span className="token-name">Showcase</span>
              </td>
              <td className="token-desc">Tabbed feature demos</td>
              <td className="token-value">12, 4+8, 4</td>
            </tr>
            <tr>
              <td>
                <span className="token-name">Deep Dive</span>
              </td>
              <td className="token-desc">Feature details, UI demos</td>
              <td className="token-value">6+6, 6+6</td>
            </tr>
            <tr>
              <td>
                <span className="token-name">Audience</span>
              </td>
              <td className="token-desc">Target communities</td>
              <td className="token-value">12, 4+4+4, 3+3+3+3</td>
            </tr>
            <tr>
              <td>
                <span className="token-name">Open Source</span>
              </td>
              <td className="token-desc">GitHub CTA, code block</td>
              <td className="token-value">12, 6+6</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
