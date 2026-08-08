import './App.css'

function App() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="font-semibold text-lg">My App</span>
          <nav className="flex gap-8 text-sm text-gray-600">
            <a href="#" className="hover:text-gray-900 transition-colors">Features</a>
            <a href="#" className="hover:text-gray-900 transition-colors">Pricing</a>
            <a href="#" className="hover:text-gray-900 transition-colors">Docs</a>
          </nav>
          <button className="bg-gray-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
            Get started
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-24 text-center">
        <h1 className="text-5xl font-bold tracking-tight mb-6">
          Build something great
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10">
          A React + Vite project ready to be deployed on Cloudflare Pages.
          Paste your Google Stitch design to get started.
        </p>
        <div className="flex gap-4 justify-center">
          <button className="bg-gray-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-gray-700 transition-colors">
            Get started
          </button>
          <button className="border border-gray-200 text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors">
            Learn more
          </button>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { title: 'Fast', desc: 'Built with Vite for instant HMR and optimised production builds.' },
          { title: 'Styled', desc: 'Tailwind CSS v4 for utility-first styling right out of the box.' },
          { title: 'Ready to ship', desc: 'Pre-configured for Cloudflare Pages with one-command deployment.' },
        ].map((f) => (
          <div key={f.title} className="p-6 rounded-2xl border border-gray-100 bg-gray-50">
            <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
            <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </section>

      <footer className="border-t border-gray-100 mt-auto py-8 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} My App. Deployed on Cloudflare Pages.
      </footer>
    </div>
  )
}

export default App
