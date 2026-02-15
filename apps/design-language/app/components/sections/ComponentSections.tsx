export function ButtonsSection() {
  return (
    <section className="doc-section" id="buttons">
      <header className="doc-section-header">
        <div className="doc-section-tag">// 010</div>
        <h1 className="doc-section-title">Buttons</h1>
        <p className="doc-section-desc">
          Buttons are sharp-edged and use monospace text for a technical feel. No
          rounded corners.
        </p>
      </header>

      <div className="doc-block">
        <h2 className="doc-block-title">Button Variants</h2>
        <div className="component-demo">
          <div className="component-demo-header">
            <span className="component-demo-title">Primary & Ghost</span>
          </div>
          <div className="component-demo-body">
            <button className="btn btn-primary">{'\u2192'} Primary</button>
            <button className="btn btn-ghost">Ghost</button>
            <button className="btn btn-cyan">Cyan</button>
            <button className="btn btn-magenta">Magenta</button>
          </div>
        </div>
      </div>

      <div className="doc-block">
        <h2 className="doc-block-title">Button Specs</h2>
        <table className="token-table">
          <thead>
            <tr>
              <th>Property</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><span className="token-name">Font</span></td>
              <td className="token-value">JetBrains Mono, 10px, 600</td>
            </tr>
            <tr>
              <td><span className="token-name">Text Transform</span></td>
              <td className="token-value">uppercase</td>
            </tr>
            <tr>
              <td><span className="token-name">Letter Spacing</span></td>
              <td className="token-value">1px</td>
            </tr>
            <tr>
              <td><span className="token-name">Padding</span></td>
              <td className="token-value">12px 20px</td>
            </tr>
            <tr>
              <td><span className="token-name">Border Radius</span></td>
              <td className="token-value">0 (none)</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function TagsSection() {
  return (
    <section className="doc-section" id="tags">
      <header className="doc-section-header">
        <div className="doc-section-tag">// 011</div>
        <h1 className="doc-section-title">Tags & Labels</h1>
        <p className="doc-section-desc">
          Section tags and labels provide wayfinding and reinforce the systematic
          aesthetic.
        </p>
      </header>

      <div className="doc-block">
        <h2 className="doc-block-title">Section Tags</h2>
        <p className="doc-block-text">
          Each section opens with a monospace tag in cyan. The double-slash
          prefix references code comments.
        </p>
        <div className="component-demo">
          <div className="component-demo-header">
            <span className="component-demo-title">Tag Examples</span>
          </div>
          <div className="component-demo-body">
            <span className="type-sample-tag">// Features</span>
            <span className="type-sample-tag" style={{ color: 'var(--blue-bright)' }}>
              // 001
            </span>
            <span className="type-sample-tag" style={{ color: 'var(--magenta-bright)' }}>
              // Built For
            </span>
          </div>
        </div>
      </div>

      <div className="doc-block">
        <h2 className="doc-block-title">Tag Specs</h2>
        <div className="doc-code">
          <span className="selector">.tag</span>
          {' {\n'}
          {'  '}
          <span className="prop">font-family</span>:{' '}
          <span className="value">'JetBrains Mono', monospace</span>;{'\n'}
          {'  '}
          <span className="prop">font-size</span>: <span className="value">9px</span>;{'\n'}
          {'  '}
          <span className="prop">font-weight</span>: <span className="value">600</span>;{'\n'}
          {'  '}
          <span className="prop">text-transform</span>:{' '}
          <span className="value">uppercase</span>;{'\n'}
          {'  '}
          <span className="prop">letter-spacing</span>:{' '}
          <span className="value">2px</span>;{'\n'}
          {'  '}
          <span className="prop">color</span>:{' '}
          <span className="value">var(--cyan-bright)</span>;{'\n'}
          {'}'}
        </div>
      </div>
    </section>
  );
}

export function UIElementsSection() {
  return (
    <section className="doc-section" id="ui-elements">
      <header className="doc-section-header">
        <div className="doc-section-tag">// 012</div>
        <h1 className="doc-section-title">UI Elements</h1>
        <p className="doc-section-desc">
          Interactive components that appear within cells to demonstrate product
          functionality.
        </p>
      </header>

      <div className="doc-block">
        <h2 className="doc-block-title">Tabs</h2>
        <p className="doc-block-text">
          Tab buttons for switching between content panels. Active state uses the
          primary blue.
        </p>
        <div className="component-demo">
          <div className="component-demo-header">
            <span className="component-demo-title">Tab States</span>
          </div>
          <div className="component-demo-body">
            <button
              className="btn"
              style={{ background: 'var(--blue)', color: 'white', padding: '10px 16px' }}
            >
              Active
            </button>
            <button
              className="btn"
              style={{
                background: 'var(--bg-mid)',
                color: 'var(--text-secondary)',
                padding: '10px 16px',
                border: '1px solid var(--border)',
              }}
            >
              Default
            </button>
            <button
              className="btn"
              style={{
                background: 'var(--bg-light)',
                color: 'var(--text-primary)',
                padding: '10px 16px',
                border: '1px solid var(--border)',
              }}
            >
              Hover
            </button>
          </div>
        </div>
      </div>

      <div className="doc-block">
        <h2 className="doc-block-title">Toggles</h2>
        <p className="doc-block-text">
          Square toggles for permission controls. No rounded corners to maintain
          the sharp aesthetic.
        </p>
        <div className="component-demo">
          <div className="component-demo-header">
            <span className="component-demo-title">Toggle States</span>
          </div>
          <div className="component-demo-body component-demo-centered">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Off</span>
              <div
                style={{
                  width: 36,
                  height: 20,
                  background: 'var(--bg-mid)',
                  border: '1px solid var(--border)',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 3,
                    left: 3,
                    width: 12,
                    height: 12,
                    background: 'var(--text-dim)',
                  }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>On</span>
              <div
                style={{
                  width: 36,
                  height: 20,
                  background: 'var(--blue)',
                  border: '1px solid var(--blue-light)',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 3,
                    right: 3,
                    width: 12,
                    height: 12,
                    background: 'white',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="doc-block">
        <h2 className="doc-block-title">UI Boxes</h2>
        <p className="doc-block-text">
          Container for interactive UI demos like wiki lists and permission
          editors. Includes a header bar with title and optional badge.
        </p>
        <div className="doc-code">
          <span className="selector">.ui-box</span>
          {' {\n'}
          {'  '}
          <span className="prop">background</span>:{' '}
          <span className="value">var(--bg-dark)</span>;{'\n'}
          {'  '}
          <span className="prop">border</span>:{' '}
          <span className="value">1px solid var(--border)</span>;{'\n'}
          {'}\n\n'}
          <span className="selector">.ui-bar</span>
          {' {\n'}
          {'  '}
          <span className="prop">display</span>: <span className="value">flex</span>;{'\n'}
          {'  '}
          <span className="prop">justify-content</span>:{' '}
          <span className="value">space-between</span>;{'\n'}
          {'  '}
          <span className="prop">padding</span>:{' '}
          <span className="value">10px 14px</span>;{'\n'}
          {'  '}
          <span className="prop">background</span>:{' '}
          <span className="value">var(--bg-mid)</span>;{'\n'}
          {'  '}
          <span className="prop">border-bottom</span>:{' '}
          <span className="value">1px solid var(--border)</span>;{'\n'}
          {'}'}
        </div>
      </div>

      <div className="doc-block">
        <h2 className="doc-block-title">Mockup Windows</h2>
        <p className="doc-block-text">
          App mockups use a window chrome with traffic light dots. The
          sidebar/main layout mimics the actual product structure.
        </p>
        <div className="component-demo">
          <div className="component-demo-header">
            <span className="component-demo-title">Window Chrome</span>
          </div>
          <div className="component-demo-body component-demo-centered">
            <div
              style={{
                display: 'flex',
                gap: 5,
                padding: '10px 14px',
                background: 'var(--bg-mid)',
                border: '1px solid var(--border)',
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: '#ef4444',
                }}
              />
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: '#eab308',
                }}
              />
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: '#22c55e',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
