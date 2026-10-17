export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="max-w-xl text-center space-y-4">
        <h1 className="font-serif text-5xl sm:text-6xl font-bold tracking-tight">
          Chai &amp; News
        </h1>
        <p className="text-xl sm:text-2xl text-zinc-600 dark:text-zinc-400 font-serif italic">
          Your morning paper, brewed fresh.
        </p>
        <div className="pt-6">
          <span className="inline-block rounded-full bg-amber-100 px-4 py-1.5 text-sm font-medium text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
            Coming soon
          </span>
        </div>
      </div>
    </main>
  );
}
