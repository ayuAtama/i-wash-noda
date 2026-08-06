export default function Test() {
  return (
    <main className="min-h-screen bg-[#24273a] text-[#cad3f5]">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-[#5b6078] bg-[#1e2030]/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-5">
          <h1 className="text-xl font-bold text-[#8aadf4]">Catppuccin Blue</h1>

          <div className="flex gap-8 text-[#b8c0e0]">
            <a className="transition hover:text-[#91d7e3]" href="#">
              Home
            </a>
            <a className="transition hover:text-[#91d7e3]" href="#">
              Features
            </a>
            <a className="transition hover:text-[#91d7e3]" href="#">
              Pricing
            </a>
            <a className="transition hover:text-[#91d7e3]" href="#">
              Contact
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto flex max-w-7xl flex-col items-center px-8 py-24 text-center">
        <span className="rounded-full border border-[#8aadf4] bg-[#363a4f] px-4 py-2 text-sm text-[#8aadf4]">
          Modern Developer Dashboard
        </span>

        <h1 className="mt-8 text-6xl font-black">
          Build Beautiful
          <span className="text-[#8aadf4]"> Dark Interfaces</span>
        </h1>

        <p className="mt-6 max-w-3xl text-lg leading-8 text-[#b8c0e0]">
          Catppuccin Macchiato with elegant blue accents. Soft contrast,
          beautiful surfaces, modern interactions, and accessible colors.
        </p>

        <div className="mt-10 flex gap-5">
          <button
            className="
            rounded-xl
            bg-[#8aadf4]
            px-7
            py-4
            font-semibold
            text-[#181926]
            shadow-[0_0_25px_rgba(138,173,244,.35)]
            transition
            hover:bg-[#7dc4e4]
            hover:shadow-[0_0_40px_rgba(138,173,244,.5)]
          "
          >
            Get Started
          </button>

          <button className="rounded-xl border border-[#8aadf4] px-7 py-4 font-semibold text-[#8aadf4] transition hover:bg-[#363a4f]">
            Learn More
          </button>
        </div>
      </section>

      {/* Statistics */}
      <section className="mx-auto grid max-w-7xl grid-cols-4 gap-6 px-8">
        {[
          ["Users", "15K+"],
          ["Projects", "820"],
          ["Downloads", "245K"],
          ["Uptime", "99.98%"],
        ].map(([title, value]) => (
          <div
            key={title}
            className="rounded-2xl border border-[#5b6078] bg-[#363a4f] p-8 transition hover:bg-[#494d64]"
          >
            <p className="text-[#a5adcb]">{title}</p>

            <h2 className="mt-3 text-4xl font-bold text-[#8aadf4]">{value}</h2>
          </div>
        ))}
      </section>

      {/* Cards */}
      <section className="mx-auto mt-24 max-w-7xl px-8">
        <h2 className="mb-10 text-4xl font-bold">Surface Components</h2>

        <div className="grid grid-cols-3 gap-8">
          {["Performance", "Security", "Scalability"].map((card) => (
            <div
              key={card}
              className="
              rounded-3xl
              border
              border-[#5b6078]
              bg-[#363a4f]
              p-8
              transition
              hover:bg-[#494d64]
              hover:-translate-y-1
            "
            >
              <div className="mb-6 h-14 w-14 rounded-xl bg-[#8aadf4]/20 flex items-center justify-center">
                <div className="h-6 w-6 rounded bg-[#8aadf4]" />
              </div>

              <h3 className="text-2xl font-bold">{card}</h3>

              <p className="mt-4 leading-7 text-[#b8c0e0]">
                Beautiful surface colors with subtle hover transitions and
                comfortable readability.
              </p>

              <button className="mt-8 text-[#91d7e3] hover:underline">
                Read more →
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Form */}
      <section className="mx-auto mt-24 max-w-7xl px-8">
        <div className="rounded-3xl border border-[#5b6078] bg-[#363a4f] p-10">
          <h2 className="mb-8 text-3xl font-bold">Contact Form</h2>

          <div className="grid gap-6">
            <input
              placeholder="Your Name"
              className="
                rounded-xl
                border
                border-[#5b6078]
                bg-[#24273a]
                px-5
                py-4
                placeholder:text-[#a5adcb]
                outline-none
                transition
                focus:border-[#8aadf4]
              "
            />

            <input
              placeholder="Email Address"
              className="
                rounded-xl
                border
                border-[#5b6078]
                bg-[#24273a]
                px-5
                py-4
                placeholder:text-[#a5adcb]
                outline-none
                focus:border-[#8aadf4]
              "
            />

            <textarea
              rows={5}
              placeholder="Write something..."
              className="
                rounded-xl
                border
                border-[#5b6078]
                bg-[#24273a]
                p-5
                placeholder:text-[#a5adcb]
                outline-none
                focus:border-[#8aadf4]
              "
            />

            <button className="w-fit rounded-xl bg-[#8aadf4] px-7 py-4 font-semibold text-[#181926] transition hover:bg-[#7dc4e4]">
              Submit
            </button>
          </div>
        </div>
      </section>

      {/* Status */}
      <section className="mx-auto mt-24 max-w-7xl px-8">
        <h2 className="mb-8 text-3xl font-bold">Semantic Colors</h2>

        <div className="flex flex-wrap gap-5">
          <span className="rounded-full bg-[#a6da95]/20 px-5 py-2 text-[#a6da95]">
            Success
          </span>

          <span className="rounded-full bg-[#eed49f]/20 px-5 py-2 text-[#eed49f]">
            Warning
          </span>

          <span className="rounded-full bg-[#ed8796]/20 px-5 py-2 text-[#ed8796]">
            Error
          </span>

          <span className="rounded-full bg-[#8aadf4]/20 px-5 py-2 text-[#8aadf4]">
            Active
          </span>
        </div>

        <div className="mt-10 grid gap-5">
          <div className="rounded-xl border border-[#a6da95] bg-[#a6da95]/10 p-5 text-[#a6da95]">
            ✓ Your profile has been updated successfully.
          </div>

          <div className="rounded-xl border border-[#eed49f] bg-[#eed49f]/10 p-5 text-[#eed49f]">
            ⚠ Storage is almost full.
          </div>

          <div className="rounded-xl border border-[#ed8796] bg-[#ed8796]/10 p-5 text-[#ed8796]">
            ✕ Something went wrong.
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="mx-auto mt-24 grid max-w-7xl grid-cols-3 gap-8 px-8">
        {[
          ["Starter", "$9"],
          ["Professional", "$29"],
          ["Enterprise", "$99"],
        ].map(([plan, price], i) => (
          <div
            key={plan}
            className={`rounded-3xl border p-10 transition hover:bg-[#494d64]
            ${
              i === 1
                ? "border-[#8aadf4] bg-[#363a4f] shadow-[0_0_30px_rgba(138,173,244,.3)]"
                : "border-[#5b6078] bg-[#363a4f]"
            }`}
          >
            <h3 className="text-3xl font-bold">{plan}</h3>

            <p className="mt-5 text-5xl font-black text-[#8aadf4]">{price}</p>

            <ul className="mt-8 space-y-3 text-[#b8c0e0]">
              <li>✓ Unlimited Projects</li>
              <li>✓ API Access</li>
              <li>✓ Community Support</li>
            </ul>

            <button className="mt-10 w-full rounded-xl bg-[#8aadf4] py-4 font-semibold text-[#181926] transition hover:bg-[#7dc4e4]">
              Choose Plan
            </button>
          </div>
        ))}
      </section>

      {/* Footer */}
      <footer className="mt-24 border-t border-[#5b6078] bg-[#1e2030]">
        <div className="mx-auto flex max-w-7xl justify-between px-8 py-10">
          <div>
            <h3 className="font-bold text-[#8aadf4]">Catppuccin UI</h3>

            <p className="mt-3 text-[#a5adcb]">
              Soft dark theme with blue accents.
            </p>
          </div>

          <div className="flex gap-8 text-[#b8c0e0]">
            <a href="#" className="hover:text-[#91d7e3]">
              GitHub
            </a>

            <a href="#" className="hover:text-[#91d7e3]">
              Docs
            </a>

            <a href="#" className="hover:text-[#91d7e3]">
              Twitter
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
