"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const BREAKPOINTS = [
  { name: "base", min: 0, label: "default (phone)" },
  { name: "sm", min: 640, label: "sm ≥ 640px" },
  { name: "md", min: 768, label: "md ≥ 768px" },
  { name: "lg", min: 1024, label: "lg ≥ 1024px" },
  { name: "xl", min: 1280, label: "xl ≥ 1280px" },
  { name: "2xl", min: 1536, label: "2xl ≥ 1536px" },
] as const;

function ViewportReader() {
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState<string>("base");

  useEffect(() => {
    const mqls = BREAKPOINTS.slice(1).map((bp) =>
      window.matchMedia(`(min-width: ${bp.min}px)`),
    );

    function update() {
      setWidth(window.innerWidth);
      const hit = mqls
        .filter((m) => m.matches)
        .map((m) => m.media)
        .at(-1);
      const name = hit ? hit.match(/(\d+)px/)?.[1] : null;
      setActive(
        name
          ? BREAKPOINTS.find((bp) => String(bp.min) === name)?.name ?? "base"
          : "base",
      );
    }

    update();
    mqls.forEach((m) => m.addEventListener("change", update));
    window.addEventListener("resize", update);
    return () => {
      mqls.forEach((m) => m.removeEventListener("change", update));
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-primary bg-primary/5 p-4">
      <p className="font-semibold">Current width:</p>
      <code className="rounded bg-muted px-2 py-0.5 text-sm">{width}px</code>
      <p className="font-semibold">Active breakpoint:</p>
      <code className="rounded bg-muted px-2 py-0.5 text-sm">
        {active === "base" ? "base" : `${active} ≥ ${BREAKPOINTS.find((b) => b.name === active)?.min}px`}
      </code>
      <p className="w-full text-sm text-muted-foreground">
        Drag the browser window edge smaller / bigger and watch this change.
      </p>
    </div>
  );
}

function Swatch({ label, className }: { label: string; className?: string }) {
  return (
    <div
      className={`flex h-16 items-center justify-center rounded-lg bg-primary/15 text-center text-xs font-semibold text-primary ring-1 ring-inset ring-primary ${className ?? ""}`}
    >
      {label}
    </div>
  );
}

function Section({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-2xl border border-border p-4 sm:p-6">
      <div>
        <h2 className="text-lg font-bold">{title}</h2>
        {note ? <p className="mt-1 text-sm text-muted-foreground">{note}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Code({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs text-foreground">
      {children}
    </pre>
  );
}

export default function PlaygroundPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <header>
          <Link
            href="/"
            className="text-sm font-medium text-primary hover:underline"
          >
            ← Back home
          </Link>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
            Layouting Playground
          </h1>
          <p className="mt-1 text-muted-foreground">
            Every colored box below reacts to your screen width. Resize the
            window and watch each section change.
          </p>
        </header>

        <ViewportReader />

        {/* ------------------------------------------------------------------ */}
        {/* 1. Breakpoints 101 */}
        {/* ------------------------------------------------------------------ */}
        <Section
          title="1 · Breakpoints 101"
          note='One element, restyled per breakpoint: "text-base bg-red" is the phone default, and md:/lg: override it on bigger screens.'
        >
          <div className="rounded-lg bg-red-200 p-3 text-sm font-medium text-red-900 md:bg-blue-200 md:text-blue-900 lg:bg-green-200 lg:text-green-900 lg:text-lg">
            On phone: red, small text. On ≥768px (md): blue. On ≥1024px (lg):
            green, bigger text.
          </div>
          <Code>{`<div className="bg-red-200 p-3 md:bg-blue-200 lg:bg-green-200 lg:text-lg">
  ...
</div>`}</Code>
        </Section>

        {/* ------------------------------------------------------------------ */}
        {/* 2. Show / hide */}
        {/* ------------------------------------------------------------------ */}
        <Section
          title="2 · Show / hide per screen"
          note="The pattern you asked about. Base classes are the phone layout; md:/lg: classes change it for bigger screens."
        >
          <div className="flex flex-wrap gap-2">
            <span className="rounded-md bg-red-100 px-3 py-1 text-sm font-semibold text-red-700 sm:hidden">
              sm:hidden → only on phone ({"<"} 640px)
            </span>
            <span className="hidden rounded-md bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700 sm:inline-block">
              hidden sm:inline-block → only from sm (≥ 640px)
            </span>
            <span className="hidden rounded-md bg-green-100 px-3 py-1 text-sm font-semibold text-green-700 md:inline-block">
              hidden md:inline-block → only from md (≥ 768px)
            </span>
            <span className="hidden rounded-md bg-purple-100 px-3 py-1 text-sm font-semibold text-purple-700 lg:inline-block">
              hidden lg:inline-block → only from lg (≥ 1024px)
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary" aria-hidden="true" />
            <div>
              <p className="font-semibold">This is a real-world example</p>
              <p className="text-sm text-muted-foreground">
                The name next to the avatar is hidden on phones and shown on
                sm+, exactly like your AppShell UserMenu.
              </p>
            </div>
            <span className="hidden rounded-md bg-muted px-3 py-1 text-sm text-muted-foreground sm:block">
              hidden sm:block
            </span>
          </div>

          <Code>{`<span className="hidden sm:block">   only from sm   </span>
<span className="sm:hidden">           only below sm  </span>
<nav className="hidden lg:flex">      desktop sidebar </nav>
<nav className="flex lg:hidden">      mobile bottom nav</nav>`}</Code>
        </Section>

        {/* ------------------------------------------------------------------ */}
        {/* 3. Flex */}
        {/* ------------------------------------------------------------------ */}
        <Section
          title="3 · Flex (one-dimensional rows / columns)"
          note="Stack children on a row (default) or column. justify-* works on the main axis, items-* on the cross axis, gap-* is the space between children."
        >
          <p className="text-sm font-semibold text-muted-foreground">
            Column on phone → row on md+ (flex flex-col md:flex-row)
          </p>
          <div className="flex flex-col gap-2 rounded-lg bg-muted p-3 md:flex-row">
            <Swatch label="A" className="h-16 md:flex-1" />
            <Swatch label="B" className="h-16 md:flex-1" />
            <Swatch label="C" className="h-16 md:flex-1" />
          </div>

          <p className="text-sm font-semibold text-muted-foreground">
            justify-between → first item left, last item right
          </p>
          <div className="flex items-center justify-between gap-2 rounded-lg bg-muted p-3">
            <Swatch label="left" className="h-12 w-24" />
            <Swatch label="center" className="h-12 w-24" />
            <Swatch label="right" className="h-12 w-24" />
          </div>

          <p className="text-sm font-semibold text-muted-foreground">
            flex-wrap → children wrap to the next line instead of shrinking
          </p>
          <div className="flex flex-wrap gap-2 rounded-lg bg-muted p-3">
            {["1", "2", "3", "4", "5", "6"].map((n) => (
              <Swatch key={n} label={n} className="h-12 w-28" />
            ))}
          </div>

          <Code>{`<div className="flex flex-col gap-2 md:flex-row">
  <div className="md:flex-1">A</div>  // grows to fill
  <div className="md:flex-1">B</div>
</div>

<div className="flex items-center justify-between">left · center · right</div>
<div className="flex flex-wrap gap-2">…items wrap…</div>`}</Code>
        </Section>

        {/* ------------------------------------------------------------------ */}
        {/* 4. Grid */}
        {/* ------------------------------------------------------------------ */}
        <Section
          title="4 · Grid (two-dimensional rows + columns)"
          note="Define columns, children fill them in order. Grid adapts by changing grid-cols-N per breakpoint."
        >
          <p className="text-sm font-semibold text-muted-foreground">
            1 column on phone → 2 on sm → 3 on lg
          </p>
          <div className="grid grid-cols-1 gap-2 rounded-lg bg-muted p-3 sm:grid-cols-2 lg:grid-cols-3">
            <Swatch label="1" />
            <Swatch label="2" />
            <Swatch label="3" />
            <Swatch label="4" />
            <Swatch label="5" />
            <Swatch label="6" />
          </div>

          <p className="text-sm font-semibold text-muted-foreground">
            Sidebar + content, using col-span to merge columns
          </p>
          <div className="grid grid-cols-1 gap-2 rounded-lg bg-muted p-3 md:grid-cols-4">
            <div className="rounded-lg bg-primary/20 p-4 text-center text-sm font-semibold text-primary md:col-span-1">
              sidebar
              <p className="text-xs font-normal">md:col-span-1</p>
            </div>
            <div className="rounded-lg bg-primary/20 p-4 text-center text-sm font-semibold text-primary md:col-span-3">
              content
              <p className="text-xs font-normal">md:col-span-3</p>
            </div>
          </div>

          <p className="text-sm font-semibold text-muted-foreground">
            Fixed sidebar with an arbitrary column track: grid-cols-[200px_1fr]
          </p>
          <div className="grid grid-cols-1 gap-2 rounded-lg bg-muted p-3 md:grid-cols-[200px_1fr]">
            <div className="rounded-lg bg-primary/20 p-4 text-center text-sm font-semibold text-primary">
              200px
            </div>
            <div className="rounded-lg bg-primary/20 p-4 text-center text-sm font-semibold text-primary">
              1fr (fills the rest)
            </div>
          </div>

          <Code>{`<div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">…</div>
<div className="grid md:grid-cols-4">
  <aside  className="md:col-span-1">sidebar</aside>
  <main   className="md:col-span-3">content</main>
</div>
<div className="grid md:grid-cols-[200px_1fr]">…</div>`}</Code>
        </Section>

        {/* ------------------------------------------------------------------ */}
        {/* 5. Centering */}
        {/* ------------------------------------------------------------------ */}
        <Section
          title="5 · The 3 ways to center"
          note="Flex and grid center in both axes; mx-auto with max-w-* centers a block horizontally and caps its width."
        >
          <p className="text-sm font-semibold text-muted-foreground">
            Flex: items-center justify-center
          </p>
          <div className="flex h-32 items-center justify-center rounded-lg bg-muted">
            <Swatch label="centered" className="h-14 w-40" />
          </div>

          <p className="text-sm font-semibold text-muted-foreground">
            Grid: place-items-center
          </p>
          <div className="grid h-32 place-items-center rounded-lg bg-muted">
            <Swatch label="centered" className="h-14 w-40" />
          </div>

          <p className="text-sm font-semibold text-muted-foreground">
            Block: mx-auto max-w-* (page containers)
          </p>
          <div className="rounded-lg bg-muted p-3">
            <div className="mx-auto max-w-sm rounded-lg bg-primary/20 p-4 text-center text-sm font-semibold text-primary">
              mx-auto max-w-sm
            </div>
          </div>

          <Code>{`<div className="flex items-center justify-center">…</div>
<div className="grid place-items-center">…</div>
<div className="mx-auto max-w-sm">…</div>`}</Code>
        </Section>

        {/* ------------------------------------------------------------------ */}
        {/* 6. Positioning */}
        {/* ------------------------------------------------------------------ */}
        <Section
          title="6 · Positioning (relative · absolute · fixed · sticky)"
          note="The mental model: absolute positions relative to the nearest positioned ancestor. fixed ignores everything and sticks to the window. sticky is normal until it hits a scroll edge."
        >
          <p className="text-sm font-semibold text-muted-foreground">
            relative + absolute → a badge pinned to the corner of a card
          </p>
          <div className="relative rounded-lg bg-muted p-8">
            <div className="relative mx-auto h-40 w-full max-w-sm rounded-xl bg-primary/20">
              <span className="absolute -right-2 -top-2 rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                -50%
              </span>
              <div className="flex h-full items-center justify-center text-sm font-semibold text-primary">
                the card
              </div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              The badge uses <code className="rounded bg-muted px-1">absolute -right-2 -top-2</code>{" "}
              inside a card that has <code className="rounded bg-muted px-1">relative</code>.
              Without the <code className="rounded bg-muted px-1">relative</code> on the card,
              the badge would fly to the page corner instead.
            </p>
          </div>

          <p className="text-sm font-semibold text-muted-foreground">
            absolute + inset-0 → a full-size overlay covering the box
          </p>
          <div className="relative flex h-40 items-center justify-center overflow-hidden rounded-lg bg-muted">
            <div className="absolute inset-0 grid place-items-center rounded-lg bg-primary/15 text-sm font-semibold text-primary">
              inset-0 overlay covers everything
            </div>
            <p className="text-sm font-semibold text-primary">
              (underneath the overlay)
            </p>
          </div>

          <p className="text-sm font-semibold text-muted-foreground">
            fixed → floats at the window edge, ignores scroll. Note it has its
            own row here so it does not cover other sections.
          </p>
          <div className="rounded-lg bg-muted p-8">
            <p className="mx-auto max-w-sm text-center text-sm text-muted-foreground">
              Scroll this page to the bottom — a demo floating button is pinned
              to the bottom-right of your screen. This is the same trick your
              AppShell uses for the mobile bottom nav.
            </p>
          </div>

          <p className="text-sm font-semibold text-muted-foreground">
            sticky → sticks while scrolling, then releases. Scroll down and
            watch this badge stay at the top of the viewport.
          </p>
          <div className="h-64 overflow-y-auto rounded-lg border border-border">
            <div className="sticky top-0 flex h-10 items-center justify-center rounded-t-lg bg-primary px-3 text-sm font-bold text-primary-foreground">
              sticky top-0 — I stay visible while you scroll
            </div>
            <div className="space-y-4 p-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-lg bg-muted p-4 text-sm text-muted-foreground"
                >
                  Scrollable content block #{i + 1}
                </div>
              ))}
            </div>
          </div>

          <Code>{`<div className="relative">            // positioned ancestor
  <span className="absolute -top-2 -right-2">badge</span>
</div>

<div className="absolute inset-0">…</div>  // full overlay
<div className="fixed bottom-4 right-4">…</div> // floating button
<div className="sticky top-0">…</div>        // stick while scrolling
<div className="fixed inset-x-0 bottom-0">…</div> // bottom nav (AppShell)</Code>`}</Code>
        </Section>

        {/* ------------------------------------------------------------------ */}
        {/* 7. Widths & spacing */}
        {/* ------------------------------------------------------------------ */}
        <Section
          title="7 · Widths, margin, padding, gap"
          note="Spacing is a 4px base scale in Tailwind: p-2 = 8px, p-4 = 16px, p-6 = 24px. Same scale for margin and gap."
        >
          <div className="space-y-3 rounded-lg bg-muted p-3">
            <div className="rounded-lg bg-primary/20 p-4">
              <p className="text-sm font-semibold text-primary">p-4</p>
              <p className="text-xs text-primary">
                padding 16px on all sides (this box&apos;s border is 16px in)
              </p>
            </div>
            <div className="flex gap-3">
              <div className="flex-1 rounded-lg bg-primary/20 p-4 text-center text-sm font-semibold text-primary">
                w-full-ish (flex-1)
              </div>
              <div className="w-1/2 rounded-lg bg-primary/20 p-4 text-center text-sm font-semibold text-primary">
                w-1/2
              </div>
            </div>
            <div className="rounded-lg bg-primary/20 p-4 text-center text-sm font-semibold text-primary">
              max-w-md mx-auto — caps at 28rem, centered
            </div>
          </div>
          <Code>{`p-2 (8px)  p-4 (16px)  p-6 (24px)
m-2 / my-4 / mx-auto   margin
gap-2 / gap-x-4        flex & grid gutters
w-1/2 (50%)  w-full  max-w-sm  max-w-7xl`}</Code>
        </Section>

        {/* ------------------------------------------------------------------ */}
        {/* 8. Fixed demo button */}
        {/* ------------------------------------------------------------------ */}
        <a
          href="https://tailwindcss.com/docs/flex"
          target="_blank"
          rel="noreferrer"
          className="fixed bottom-4 right-4 z-50 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-lg transition hover:opacity-90"
        >
          fixed bottom-4 right-4
        </a>
      </div>
    </main>
  );
}
