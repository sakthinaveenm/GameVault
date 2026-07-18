type AppInfo = Awaited<ReturnType<typeof window.gameVault.getAppInfo>>;

const navigation = ["Home", "Library", "Collections", "Settings"];

export function LibraryPage({ appInfo }: { appInfo: AppInfo | null }) {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto grid min-h-screen max-w-[1600px] grid-cols-[240px_1fr]">
        <aside className="border-r border-white/10 bg-zinc-900/40 px-5 py-7">
          <div className="mb-12 flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-lime-400 font-black text-zinc-950">G</div>
            <div>
              <p className="font-semibold tracking-tight">GameVault</p>
              <p className="text-xs text-zinc-500">Your games. One vault.</p>
            </div>
          </div>
          <nav aria-label="Primary navigation" className="space-y-1">
            {navigation.map((item) => (
              <button
                className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                  item === "Library" ? "bg-white/10 font-medium text-white" : "text-zinc-400 hover:bg-white/5 hover:text-white"
                }`}
                key={item}
                type="button"
              >
                {item}
              </button>
            ))}
          </nav>
        </aside>

        <section className="px-8 py-10 sm:px-12">
          <header className="flex items-center justify-between gap-6">
            <div>
              <p className="text-sm font-medium text-lime-400">GAMEVAULT 0.1</p>
              <h1 className="mt-2 text-4xl font-bold tracking-tight">Your library starts here.</h1>
            </div>
            <div className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-zinc-400">
              {appInfo?.databaseReady ? "Vault ready" : "Preparing vault…"}
            </div>
          </header>

          <section className="mt-16 grid max-w-4xl gap-5 md:grid-cols-[1.4fr_1fr]">
            <article className="rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-800 to-zinc-900 p-8 shadow-2xl shadow-black/20">
              <p className="text-sm text-zinc-400">Your first step</p>
              <h2 className="mt-3 text-2xl font-semibold">Add a game folder</h2>
              <p className="mt-3 max-w-md text-sm leading-6 text-zinc-400">
                Game scanning is next. This shell already has a secure local vault ready to store your library.
              </p>
              <button className="mt-7 rounded-xl bg-lime-400 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-lime-300" type="button">
                Choose folder
              </button>
            </article>
            <article className="rounded-3xl border border-dashed border-white/15 p-8">
              <p className="text-sm text-zinc-500">Library status</p>
              <p className="mt-5 text-4xl font-bold">0</p>
              <p className="mt-1 text-sm text-zinc-400">games imported</p>
              <p className="mt-10 text-xs text-zinc-600">{appInfo ? `Desktop engine connected · v${appInfo.version}` : "Connecting to desktop engine…"}</p>
            </article>
          </section>
        </section>
      </div>
    </main>
  );
}
