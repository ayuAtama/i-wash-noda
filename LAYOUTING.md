# Layouting Cheat Sheet (Tailwind CSS v4)

Open the companion playground page at `http://localhost:3001/playground` and resize the browser while reading this — everything below exists there as a live demo.

---

## 0. The box model — the foundation

Every HTML element is a box. From inside out:

```
┌───────────────────────────────────────────────┐
│  margin (outside, transparent space)          │
│  ┌─────────────────────────────────────────┐  │
│  │  border (width + color)                 │  │
│  │  ┌───────────────────────────────────┐  │  │
│  │  │  padding (space inside the box)   │  │  │
│  │  │  ┌─────────────────────────────┐  │  │  │
│  │  │  │  content (text, images)     │  │  │  │
│  │  │  └─────────────────────────────┘  │  │  │
│  │  └───────────────────────────────────┘  │  │
│  └─────────────────────────────────────────┘  │
└───────────────────────────────────────────────┘
```

Tailwind maps directly to it:

| CSS property | Tailwind | Meaning |
|---|---|---|
| `padding` | `p-4` | space inside, around content |
| `margin` | `m-4` | space outside, around the box |
| `border-width` | `border` / `border-2` | visible edge |
| `border-radius` | `rounded-lg` | rounded corners |
| `width` | `w-*` | box width |
| `max-width` | `max-w-sm` | "never wider than" |
| `display` | `block` / `flex` / `grid` / `hidden` | how the box lays out |

The default scale: `p-2` = 8px, `p-3` = 12px, `p-4` = 16px, `p-6` = 24px, `p-8` = 32px. Same numbers for `m-*` and `gap-*`. You can combine: `py-4` (top+bottom), `px-6` (left+right), `mx-auto` (centers horizontally when the box has a max-width).

**Golden rule:** `p-*` pads the inside of the box, `m-*` / `gap-*` push other boxes away.

---

## 1. display — how boxes sit next to each other

| Class | What it does |
|---|---|
| `block` | Takes a full line, stacked vertically (default for `div`, `section`, `p`) |
| `inline` | Sits inside a line of text, sized to content (default for `span`, `a`, `button`) |
| `inline-block` | Like `inline` but you can set width/padding |
| `flex` | Turns children into a **row or column** (see §2) |
| `grid` | Turns children into a **2D grid** (see §3) |
| `hidden` | `display: none` — element is removed, takes no space |

Reading a class left-to-right: `hidden lg:flex` = "hidden by default (phone), become flex at `lg`".

---

## 2. Flexbox — one-dimensional rows & columns

**Mental model:** a flex container has a *main axis* (direction children flow) and a *cross axis* (perpendicular).

```
        main axis →  (justify-* controls here)
     ┌──────────────┬──────────────┬──────────────┐
     │   child 1    │   child 2    │   child 3    │
     └──────────────┴──────────────┴──────────────┘
        ▲ cross axis (items-* controls here) ▲
```

### Container (parent)

| Class | Effect |
|---|---|
| `flex` | children in a row |
| `flex-col` | children in a column |
| `flex-col md:flex-row` | stacked on phone, side-by-side from `md` — **the single most used responsive pattern** |
| `flex-wrap` | allow children to wrap to next line |
| `gap-2` / `gap-x-4` | space between children (don't use margins) |
| `justify-start` / `justify-center` / `justify-between` / `justify-end` | position children along the **main axis** |
| `items-start` / `items-center` / `items-end` / `items-stretch` | position children along the **cross axis** |
| `flex-col justify-between` | a column that spreads children top/middle/bottom |

### Children

| Class | Effect |
|---|---|
| `flex-1` | grow to fill available space equally |
| `flex-grow-0` | keep natural size, don't stretch |
| `shrink-0` | never shrink below content size (e.g. avatars, logos) |
| `w-24` / `w-1/2` | fixed / proportional width |
| `order-2` / `order-first` | reorder children (swap logo and menu on mobile) |

---

## 3. Grid — two-dimensional layout

**Mental model:** you define the *track* (number/size of columns and rows), then children fill cells left-to-right, top-to-bottom.

```
grid grid-cols-3                    grid md:grid-cols-4 (with spans)
┌────┬────┬────┐                    ┌─────┬─────────────┐
│ 1  │ 2  │ 3  │                    │     │             │
├────┼────┼────┤                    │aside│   content   │
│ 4  │ 5  │ 6  │                    │col-1│  col-span-3 │
└────┴────┴────┘                    └─────┴─────────────┘
```

### Common recipes

| Class | What it makes |
|---|---|
| `grid` | block-level grid |
| `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` | card list: 1 col phone, 2 at `sm`, 3 at `lg` |
| `grid-cols-3` | equal thirds |
| `grid-cols-4` | the classic: sidebar + content via spans |
| `grid-cols-[200px_1fr]` | fixed sidebar + flexible content (`1fr` = fill the rest) |
| `grid-cols-[repeat(auto-fit,minmax(240px,1fr))]` | auto-wrapping cards, no breakpoints needed |
| `col-span-2` / `col-span-3` | a child that merges multiple columns |
| `row-span-2` | a child that merges multiple rows |
| `gap-4` | gutter between all cells |
| `place-items-center` | center the child in the cell (both axes) |

---

## 4. Responsive = mobile-first

**One rule:** write the **phone layout first** (base classes), then *override* with `sm:` / `md:` / `lg:`.

| Prefix | Min width | Typical device |
|---|---|---|
| (none) | 0px | phone |
| `sm:` | 640px | large phone / tablet portrait |
| `md:` | 768px | tablet landscape |
| `lg:` | 1024px | laptop |
| `xl:` | 1280px | desktop |
| `2xl:` | 1536px | wide monitor |

```tsx
// stack on phone, row at md, row with 3 columns at lg
<div className="flex flex-col gap-4 md:flex-row lg:grid lg:grid-cols-3">…</div>
```

Because it's mobile-first, `sm:` means "from 640px up" — it does **not** mean "only on small screens". "Only on small screens" is `sm:hidden`.

### Show / hide per screen (your question)

| Need | Class |
|---|---|
| only on phone | `sm:hidden` |
| only from `sm` | `hidden sm:block` |
| only from `md` | `hidden md:block` |
| only from `lg` | `hidden lg:block` |
| desktop sidebar only | `hidden lg:flex` |
| mobile bottom nav only | `flex lg:hidden` |

Real examples in this repo:

- `apps/web/components/shared/AppShell.tsx:42` — `hidden … sm:flex` (name shown beside avatar only ≥ `sm`)
- `apps/web/components/shared/AppShell.tsx:95` — `hidden … lg:flex` (admin sidebar only ≥ `lg`)
- `apps/web/components/shared/AppShell.tsx:121` — `fixed inset-x-0 bottom-0` (mobile bottom nav)
- `apps/web/app/page.tsx:32` — `flex flex-col … sm:flex-row` (buttons stack, then sit side-by-side)

---

## 5. Centering — the 3 ways

| Situation | Code |
|---|---|
| Center a child in a flex box | `<div className="flex items-center justify-center">` |
| Center a child in a grid cell | `<div className="grid place-items-center">` |
| Center a block horizontally + cap width | `<div className="mx-auto max-w-2xl">` |

---

## 6. Positioning — the one that confuses everyone

There are 5 values. Only **3 of them do anything special**:

| Class | Behavior | Use for |
|---|---|---|
| `static` | default, nothing special | (you almost never write this) |
| `relative` | **keeps its space**, becomes the anchor for absolute children | parent of badges, dropdowns, overlays |
| `absolute` | pulled out of flow, positioned **relative to nearest positioned ancestor** | badges, tooltips, dropdowns, overlays |
| `fixed` | pulled out of flow, positioned relative to the **window** (ignores scrolling) | navbar, floating button, mobile bottom nav, modals |
| `sticky` | normal until it hits a scroll edge, then sticks | section headers, table headers, navbar |

### The mental model

> `absolute` positions relative to the **nearest ancestor that has `relative`, `absolute`, `fixed`, or `sticky`**. If none exists, it anchors to the page itself. So **always put `relative` on the parent** when you use `absolute` on a child.

### Moving positioned elements

The offsets: `top-0`, `right-4`, `bottom-0`, `left-1/2`, `inset-0` (= top+right+bottom+left all 0 → covers the whole parent).

```tsx
{/* sale badge on a card */}
<div className="relative">
  <div className="h-40 w-64 bg-slate-200">…</div>
  <span className="absolute -top-2 -right-2 rounded-full bg-red-500 px-2 text-white">-50%</span>
</div>

{/* full-screen overlay */}
<div className="absolute inset-0 bg-black/50">…</div>

{/* floating button */}
<button className="fixed bottom-4 right-4">…</button>

{/* sticky header */}
<header className="sticky top-0 z-40">…</header>

{/* mobile bottom nav */}
<nav className="fixed inset-x-0 bottom-0 z-40">…</nav>
```

### z-index (`z-*`) and stacking

`z-*` only works on **positioned** elements (`relative`, `absolute`, `fixed`, `sticky`). Higher number = on top.

```tsx
<header className="sticky top-0 z-40">   // navbar above everything
<div className="fixed inset-0 z-50">     // modal overlay above the navbar
```

Common z scale used by this repo (shadcn/ui convention): content auto → header `z-40` → dropdowns/popovers `z-50` → modals/overlays `z-50+`.

---

## 7. Deciding which layout tool to use

| You want to… | Use |
|---|---|
| Put 2–4 things in a row/column | `flex` |
| Fill vertical space evenly / stretch to bottom | `flex flex-col` + `flex-1` on children |
| Equal-width columns that respond to width | `flex` + `flex-1` on children, or `grid-cols-N` |
| A card list / dashboard that reflows | `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` |
| Sidebar + content | `grid-cols-[250px_1fr]` or `md:col-span-1` + `md:col-span-3` |
| Center something | §5 table |
| A badge / tooltip / overlay on a thing | `relative` parent + `absolute` child |
| A navbar / floating button / bottom nav | `fixed` |
| Keep a header in view while scrolling | `sticky` |

---

## 8. How to read a Tailwind class

```tsx
className="hidden lg:flex flex-col gap-2 px-4 py-6"
```
- `hidden` → default (phone): hidden
- `lg:` → from 1024px up
- `flex` → become flex
- `flex-col gap-2 px-4 py-6` → vertical, 8px gaps, 16px side / 24px vertical padding

Left to right: **base state, then breakpoint, then style.** Everything after a `md:`/`lg:` applies only at that size and up.
