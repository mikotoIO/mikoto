export function ColorsSection() {
  return (
    <section className="doc-section" id="colors">
      <header className="doc-section-header">
        <div className="doc-section-tag">// 004</div>
        <h1 className="doc-section-title">Colors</h1>
        <p className="doc-section-desc">
          The color system is built on a foundation of deep, warm blacks with
          vibrant accent colors that serve specific functional purposes.
        </p>
      </header>

      <div className="doc-block">
        <h2 className="doc-block-title">Background Scale</h2>
        <p className="doc-block-text">
          Five levels of background darkness create depth and hierarchy within
          the grid. Darker cells recede; lighter cells come forward.
        </p>
        <div className="swatch-grid">
          {[
            { name: '--bg-page', hex: '#0A0A0C' },
            { name: '--bg-dark', hex: '#0D0D10' },
            { name: '--bg-mid', hex: '#141418' },
            { name: '--bg-light', hex: '#1C1C22' },
            { name: '--bg-lighter', hex: '#26262E' },
          ].map((s) => (
            <div key={s.name} className="swatch">
              <div className="swatch-color" style={{ background: s.hex }} />
              <div className="swatch-info">
                <div className="swatch-name">{s.name}</div>
                <div className="swatch-hex">{s.hex}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="doc-block">
        <h2 className="doc-block-title">Brand Colors</h2>
        <p className="doc-block-text">
          Four accent colors, each with a bright variant for emphasis. Colors
          have semantic meaning and should be used consistently.
        </p>
        <div className="swatch-grid">
          {[
            { name: '--blue (Primary)', hex: '#2563EB' },
            { name: '--blue-bright', hex: '#60A5FA' },
            { name: '--cyan (Info)', hex: '#06B6D4' },
            { name: '--cyan-bright', hex: '#22D3EE' },
            { name: '--magenta (Accent)', hex: '#EC4899' },
            { name: '--magenta-bright', hex: '#F472B6' },
            { name: '--purple (Special)', hex: '#8B5CF6' },
            { name: '--purple-bright', hex: '#A78BFA' },
          ].map((s) => (
            <div key={s.name} className="swatch">
              <div className="swatch-color" style={{ background: s.hex }} />
              <div className="swatch-info">
                <div className="swatch-name">{s.name}</div>
                <div className="swatch-hex">{s.hex}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="doc-block">
        <h2 className="doc-block-title">Color Semantics</h2>
        <table className="token-table">
          <thead>
            <tr>
              <th>Color</th>
              <th>Usage</th>
              <th>Examples</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <span
                  className="token-name"
                  style={{ color: 'var(--blue-bright)' }}
                >
                  Blue
                </span>
              </td>
              <td className="token-desc">
                Primary actions, active states, key CTAs
              </td>
              <td className="token-value">
                Buttons, active tabs, primary links
              </td>
            </tr>
            <tr>
              <td>
                <span
                  className="token-name"
                  style={{ color: 'var(--cyan-bright)' }}
                >
                  Cyan
                </span>
              </td>
              <td className="token-desc">Information, labels, system text</td>
              <td className="token-value">Tags, code strings, status badges</td>
            </tr>
            <tr>
              <td>
                <span
                  className="token-name"
                  style={{ color: 'var(--magenta-bright)' }}
                >
                  Magenta
                </span>
              </td>
              <td className="token-desc">Highlights, accents, emphasis</td>
              <td className="token-value">
                Stats, feature callouts, hover effects
              </td>
            </tr>
            <tr>
              <td>
                <span
                  className="token-name"
                  style={{ color: 'var(--purple-bright)' }}
                >
                  Purple
                </span>
              </td>
              <td className="token-desc">Special features, premium, unique</td>
              <td className="token-value">Special offers, unique features</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function TypographySection() {
  return (
    <section className="doc-section" id="typography">
      <header className="doc-section-header">
        <div className="doc-section-tag">// 005</div>
        <h1 className="doc-section-title">Typography</h1>
        <p className="doc-section-desc">
          Three typefaces work together to create hierarchy and reinforce the
          cactuspunk aesthetic.
        </p>
      </header>

      <div className="doc-block">
        <h2 className="doc-block-title">Type Stack</h2>
        <table className="token-table">
          <thead>
            <tr>
              <th>Font</th>
              <th>Role</th>
              <th>Weights</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <span className="token-name">Zen Kaku Gothic New</span>
              </td>
              <td className="token-desc">
                Headlines, display text — Japanese-influenced, bold character
              </td>
              <td className="token-value">700, 900</td>
            </tr>
            <tr>
              <td>
                <span className="token-name">Outfit</span>
              </td>
              <td className="token-desc">
                Body text, descriptions — clean, modern, readable
              </td>
              <td className="token-value">400, 500, 600</td>
            </tr>
            <tr>
              <td>
                <span className="token-name">JetBrains Mono</span>
              </td>
              <td className="token-desc">
                System text, labels, code — technical, precise
              </td>
              <td className="token-value">400, 500, 600</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="doc-block">
        <h2 className="doc-block-title">Type Scale</h2>
        <div className="type-showcase">
          <div className="type-row">
            <div className="type-label">
              <div className="type-label-name">H1</div>
              <div className="type-label-size">48px / 900</div>
            </div>
            <div className="type-sample type-sample-h1">
              Where conversations grow
            </div>
          </div>
          <div className="type-row">
            <div className="type-label">
              <div className="type-label-name">H2</div>
              <div className="type-label-size">36px / 900</div>
            </div>
            <div className="type-sample type-sample-h2">
              Everything in one place
            </div>
          </div>
          <div className="type-row">
            <div className="type-label">
              <div className="type-label-name">H3</div>
              <div className="type-label-size">22px / 700</div>
            </div>
            <div className="type-sample type-sample-h3">Real-time chat</div>
          </div>
          <div className="type-row">
            <div className="type-label">
              <div className="type-label-name">Body</div>
              <div className="type-label-size">15px / 400</div>
            </div>
            <div className="type-sample type-sample-body">
              Real-time chat that doesn't forget. Documentation that stays
              alive. Built for communities that build things.
            </div>
          </div>
          <div className="type-row">
            <div className="type-label">
              <div className="type-label-name">Mono</div>
              <div className="type-label-size">12px / 400</div>
            </div>
            <div className="type-sample type-sample-mono">
              git clone mikoto-io/mikoto
            </div>
          </div>
          <div className="type-row">
            <div className="type-label">
              <div className="type-label-name">Tag</div>
              <div className="type-label-size">10px / 600</div>
            </div>
            <div className="type-sample type-sample-tag">
              // Open Source Platform
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function SpacingSection() {
  return (
    <section className="doc-section" id="spacing">
      <header className="doc-section-header">
        <div className="doc-section-tag">// 006</div>
        <h1 className="doc-section-title">Spacing</h1>
        <p className="doc-section-desc">
          Consistent spacing creates rhythm and hierarchy. All spacing values
          derive from a base unit.
        </p>
      </header>

      <div className="doc-block">
        <h2 className="doc-block-title">Spacing Scale</h2>
        <table className="token-table">
          <thead>
            <tr>
              <th>Token</th>
              <th>Value</th>
              <th>Usage</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <span className="token-name">--cell-gap</span>
              </td>
              <td className="token-value">1px</td>
              <td className="token-desc">Gap between grid cells</td>
            </tr>
            <tr>
              <td>
                <span className="token-name">--group-gap</span>
              </td>
              <td className="token-value">24px</td>
              <td className="token-desc">Margin between drawer groups</td>
            </tr>
            <tr>
              <td>
                <span className="token-name">--page-padding</span>
              </td>
              <td className="token-value">48px</td>
              <td className="token-desc">Page edge padding</td>
            </tr>
            <tr>
              <td>
                <span className="token-name">--cell-padding</span>
              </td>
              <td className="token-value">24px</td>
              <td className="token-desc">Internal cell padding</td>
            </tr>
          </tbody>
        </table>

        <div className="spacing-demo">
          {[1, 8, 16, 24, 32, 48].map((size) => (
            <div key={size} className="spacing-box">
              <div
                className="spacing-visual"
                style={{ width: size, height: 40 }}
              />
              <div className="spacing-label">{size}px</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
