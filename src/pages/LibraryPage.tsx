import { useState } from "react";

type AppInfo = Awaited<ReturnType<typeof window.gameVault.getAppInfo>>;

const navigation = ["Home", "Library", "Collections", "Settings"];

type LibraryPageProps = {
  appInfo: AppInfo | null;
  games: Game[];
  onGamesImported: (games: Game[]) => void;
};

export function LibraryPage({ appInfo, games, onGamesImported }: LibraryPageProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleChooseFolder() {
    setIsImporting(true);
    setMessage(null);
    try {
      const result = await window.gameVault.chooseAndImportGames();
      if (result.canceled) return;
      const updatedGames = await window.gameVault.getGames();
      onGamesImported(updatedGames);
      setMessage(result.imported === 0 ? "No playable apps or executables were found." : `${result.imported} game${result.imported === 1 ? "" : "s"} imported.`);
    } catch {
      setMessage("The folder could not be scanned. Please try another location.");
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto grid min-h-screen max-w-[1600px] grid-cols-[240px_1fr]">
        <aside className="border-r border-white/10 bg-zinc-900/40 px-5 py-7">
          <div className="mb-12 flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-lime-400 font-black text-zinc-950">G</div>
            <div><p className="font-semibold tracking-tight">GameVault</p><p className="text-xs text-zinc-500">Your games. One vault.</p></div>
          </div>
          <nav aria-label="Primary navigation" className="space-y-1">
            {navigation.map((item) => <button className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${item === "Library" ? "bg-white/10 font-medium text-white" : "text-zinc-400 hover:bg-white/5 hover:text-white"}`} key={item} type="button">{item}</button>)}
          </nav>
        </aside>

        <section className="px-8 py-10 sm:px-12">
          <header className="flex items-center justify-between gap-6"><div><p className="text-sm font-medium text-lime-400">GAMEVAULT 0.1</p><h1 className="mt-2 text-4xl font-bold tracking-tight">Your library.</h1></div><div className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-zinc-400">{appInfo?.databaseReady ? "Vault ready" : "Preparing vault…"}</div></header>

          <section className="mt-12 rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-800 to-zinc-900 p-8 shadow-2xl shadow-black/20">
            <p className="text-sm text-zinc-400">Import local games</p><h2 className="mt-3 text-2xl font-semibold">Add a game folder</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-400">Choose a folder and GameVault will find macOS apps plus executable files. Imported entries remain local to this device.</p>
            <button className="mt-7 rounded-xl bg-lime-400 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-lime-300 disabled:cursor-wait disabled:opacity-60" disabled={isImporting} onClick={handleChooseFolder} type="button">{isImporting ? "Scanning…" : "Choose folder"}</button>
            {message ? <p aria-live="polite" className="mt-4 text-sm text-lime-300">{message}</p> : null}
          </section>

          <section className="mt-10"><div className="flex items-end justify-between"><div><p className="text-sm text-zinc-500">Library status</p><h2 className="mt-1 text-2xl font-semibold">{games.length} game{games.length === 1 ? "" : "s"} imported</h2></div><p className="text-xs text-zinc-600">{appInfo ? `Desktop engine connected · v${appInfo.version}` : "Connecting…"}</p></div>
            {games.length === 0 ? <p className="mt-6 rounded-2xl border border-dashed border-white/15 px-6 py-10 text-sm text-zinc-500">Your imported games will appear here.</p> : <ul className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{games.map((game) => <li className="rounded-2xl border border-white/10 bg-white/[0.03] p-5" key={game.id}><p className="font-medium">{game.title}</p><p className="mt-2 truncate text-xs text-zinc-500" title={game.executablePath}>{game.executablePath}</p></li>)}</ul>}
          </section>
        </section>
      </div>
    </main>
  );
}
