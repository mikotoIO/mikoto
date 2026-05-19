import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-1 flex-col justify-center px-6 py-24">
      <h1 className="text-4xl font-semibold tracking-tight">
        Mikoto Developer Documentation
      </h1>
      <p className="mt-4 text-fd-muted-foreground">
        Mikoto is an open-source messaging platform for online communities —
        threads, voice/video, and real-time wiki channels in a single Rust +
        React stack. This site documents the moving pieces for developers who
        want to run it, hack on it, or build on top of it.
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          href="/docs"
          className="rounded-md bg-fd-primary px-4 py-2 text-sm font-medium text-fd-primary-foreground hover:opacity-90"
        >
          Read the docs
        </Link>
        <a
          href="https://github.com/mikoto-io/mikoto"
          className="rounded-md border border-fd-border px-4 py-2 text-sm font-medium hover:bg-fd-accent"
        >
          GitHub
        </a>
      </div>
    </main>
  );
}
