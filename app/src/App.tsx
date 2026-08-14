import { Button } from "@/components/ui/button";

// Placeholder shell screen (T-001). Everything visible here styles itself
// via the tokens in src/styles/tokens.css — T-006 brings the real design.
function App() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6">
      <div className="flex flex-col items-center gap-2">
        <h1 className="font-mono text-3xl font-semibold">nputer</h1>
        <p className="text-sm text-muted-foreground">
          app shell placeholder — the story map arrives with T-004
        </p>
      </div>
      <Button
        variant="outline"
        onClick={() => document.documentElement.classList.toggle("dark")}
      >
        Toggle theme
      </Button>
    </main>
  );
}

export default App;
