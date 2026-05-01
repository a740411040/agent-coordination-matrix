import RunConsole from "./pages/RunConsole"

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <h1 className="text-xl font-bold">FutureAgent</h1>
          <p className="text-sm text-gray-500">Composite Visual AI Agent Coordination System</p>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6">
        <RunConsole />
      </main>
    </div>
  )
}
