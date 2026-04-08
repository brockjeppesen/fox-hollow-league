import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-green-800 text-cream relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-brass blur-[200px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-green-600 blur-[150px]" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="px-6 py-6 md:px-12 md:py-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brass flex items-center justify-center">
              <svg
                className="w-5 h-5 text-green-900"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-4h2v-2h-2v2zm0-10h2v6h-2V6z" />
              </svg>
            </div>
            <span className="text-lg font-medium tracking-wide uppercase text-cream/80">
              Fox Hollow League
            </span>
          </div>
        </header>

        {/* Hero */}
        <main className="flex-1 flex items-center px-6 md:px-12 lg:px-24">
          <div className="max-w-3xl animate-fade-in">
            <p className="text-brass font-medium tracking-widest uppercase text-sm mb-4 animate-fade-in-delay">
              American Fork, Utah
            </p>
            <h1 className="font-heading text-5xl md:text-7xl lg:text-8xl leading-[0.95] mb-6">
              Fox Hollow
              <br />
              <span className="text-brass">Men&apos;s League</span>
            </h1>
            <p className="text-cream/70 text-lg md:text-xl max-w-xl leading-relaxed mb-10 animate-fade-in-delay-2">
              Weekly golf, good company, and a little friendly competition.
              Submit your preferences, get your pairings, and hit the links.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-delay-2">
              <Link
                href="/manager"
                className="inline-flex items-center justify-center px-8 py-4 bg-brass text-green-900 font-semibold rounded-lg hover:bg-brass-light transition-colors-smooth text-center"
              >
                Manager Dashboard
              </Link>
              <Link
                href="/sign-in"
                className="inline-flex items-center justify-center px-8 py-4 border border-cream/30 text-cream rounded-lg hover:bg-cream/10 transition-colors-smooth text-center"
              >
                Sign In
              </Link>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="px-6 py-8 md:px-12">
          <div className="flex items-center justify-between text-cream/40 text-sm">
            <p>Fox Hollow Golf Club</p>
            <p>Est. 2025</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
