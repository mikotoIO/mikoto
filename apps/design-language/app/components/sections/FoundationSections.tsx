export function PhilosophySection() {
  return (
    <section className="doc-section" id="philosophy">
      <header className="doc-section-header">
        <div className="doc-section-tag">// 001</div>
        <h1 className="doc-section-title">Philosophy</h1>
        <p className="doc-section-desc">
          The Mikoto design system is built on the principle of{' '}
          <em>organized density</em> — creating interfaces that are
          information-rich yet navigable, complex yet comprehensible.
        </p>
      </header>

      <div className="doc-block">
        <h2 className="doc-block-title">Design for Builders</h2>
        <p className="doc-block-text">
          Mikoto serves communities that create: developers, gamers, makers.
          These users are comfortable with density. They don't need excessive
          whitespace or oversimplified interfaces. They want{' '}
          <strong>power and clarity</strong>, not hand-holding.
        </p>
        <p className="doc-block-text" style={{ marginTop: 16 }}>
          Our design language respects this. Information is organized into
          modular cells like a well-organized workshop — everything has its
          place, everything is accessible, nothing is hidden behind unnecessary
          abstraction.
        </p>
      </div>

      <div className="doc-block">
        <h2 className="doc-block-title">Systematic, Not Sterile</h2>
        <p className="doc-block-text">
          The modular grid provides structure, but color and typography bring
          warmth. We use <strong>accent colors strategically</strong> — not as
          decoration, but as wayfinding. Blue for primary actions, cyan for
          information, magenta for highlights.
        </p>
      </div>

      <div className="doc-quote">
        "The best interfaces are like well-organized toolboxes: dense with
        capability, but everything exactly where you expect it."
        <cite>— Design Philosophy Note</cite>
      </div>
    </section>
  );
}

export function PrinciplesSection() {
  return (
    <section className="doc-section" id="principles">
      <header className="doc-section-header">
        <div className="doc-section-tag">// 002</div>
        <h1 className="doc-section-title">Principles</h1>
        <p className="doc-section-desc">
          Five core principles guide every design decision in the Mikoto system.
        </p>
      </header>

      <div className="principles-grid">
        {[
          {
            icon: '\u{1F4E6}',
            title: 'Modularity',
            desc: 'Every element is a self-contained unit that can be rearranged, combined, or removed without breaking the system.',
          },
          {
            icon: '\u{1F3AF}',
            title: 'Density with Clarity',
            desc: 'Pack information tightly, but use hierarchy, color, and spacing to maintain readability.',
          },
          {
            icon: '\u{1F532}',
            title: 'Sharp Edges',
            desc: 'No rounded corners. No soft gradients. Precision and intentionality in every shape.',
          },
          {
            icon: '\u{1F308}',
            title: 'Color as Function',
            desc: "Colors aren't decorative — they communicate. Each hue has semantic meaning.",
          },
          {
            icon: '\u{2328}\uFE0F',
            title: 'Systematic Naming',
            desc: 'Cell IDs, component labels, and structured hierarchies make the system self-documenting.',
          },
        ].map((p) => (
          <div key={p.title} className="principle-card">
            <div className="principle-icon">{p.icon}</div>
            <h3 className="principle-title">{p.title}</h3>
            <p className="principle-desc">{p.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function CactuspunkSection() {
  return (
    <section className="doc-section" id="cactuspunk">
      <header className="doc-section-header">
        <div className="doc-section-tag">// 003</div>
        <h1 className="doc-section-title">Cactuspunk Aesthetic</h1>
        <p className="doc-section-desc">
          Cactuspunk is an aesthetic philosophy that informs Mikoto's visual
          identity. It draws from otaku culture, cyberpunk density, and the
          principle of thriving under constraint.
        </p>
      </header>

      <div className="doc-block">
        <h2 className="doc-block-title">Origins</h2>
        <p className="doc-block-text">
          The name comes from the cactus — an organism that thrives in harsh
          conditions through clever adaptation. Cactuspunk applies this to
          living and working spaces:{' '}
          <strong>
            high density, hyper-organization, deliberate weirdness
          </strong>
          .
        </p>
        <p className="doc-block-text" style={{ marginTop: 16 }}>
          Think: walls of modular plastic storage drawers. Exposed cables routed
          precisely. Terminal windows with custom color schemes. Plants growing
          under LED lights. Everything optimized, nothing wasted.
        </p>
      </div>

      <div className="doc-block">
        <h2 className="doc-block-title">Visual Signatures</h2>
        <p className="doc-block-text">
          <strong>Grid-based modularity</strong> — Like stacked drawers or Lego
          blocks, every element fits into a precise grid.
          <br />
          <br />
          <strong>Dark backgrounds with color accents</strong> — Deep blacks and
          grays punctuated by vibrant blues, cyans, and magentas.
          <br />
          <br />
          <strong>Monospace labels</strong> — System-level text uses monospace
          fonts, reinforcing the technical aesthetic.
          <br />
          <br />
          <strong>Japanese typography influences</strong> — The Zen Kaku Gothic
          New font brings subtle anime/otaku character to headlines.
          <br />
          <br />
          <strong>No gratuitous animation</strong> — Movement is purposeful and
          subtle, never flashy.
        </p>
      </div>

      <div className="doc-quote">
        "Thriving under constraint through deliberate weirdness."
        <cite>— Cactuspunk Manifesto</cite>
      </div>
    </section>
  );
}
