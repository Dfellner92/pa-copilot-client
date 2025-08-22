import LoginPage from "./login/page"

export default function Home() {
  return (
  <main className="p-6 max-w-xl mx-auto space-y-4">
    <h1 className="text-2xl font-semibold">PA Copilot</h1>
    <p className="text-sm text-gray-600">Next.js + Tailwind starter.</p>
    <a className="btn" href="/login">Go to Login</a>
  </main>
  )
  }