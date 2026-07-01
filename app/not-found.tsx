import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-surface text-on-surface font-body">
      <div className="text-center max-w-md">
        <div className="text-7xl font-bold tracking-tighter mb-2 text-[#FFBA20] font-display">404</div>
        <h1 className="text-2xl font-bold mb-2 font-display">WHO DIS PAGE?</h1>
        <p className="mb-8 opacity-60">This page doesn&apos;t exist. Maybe it never did.</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-none font-semibold no-underline bg-[#FFBA20] text-[#131313] hover:bg-[#e5a71c] transition-colors font-display tracking-wide"
        >
          ← BACK TO THE COLLECTION
        </Link>
      </div>
    </div>
  )
}
