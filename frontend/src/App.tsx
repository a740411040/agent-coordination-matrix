import RunConsole from "./pages/RunConsole"

export default function App() {
  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 dot-grid pointer-events-none opacity-60" />
      <RunConsole />
    </div>
  )
}
