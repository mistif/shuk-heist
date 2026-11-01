export default function StartScreen({ onStart }: { onStart: (players: number) => void }) {
  return (
    <main className="mx-auto flex max-w-xl flex-1 flex-col justify-center gap-6 p-6">
      <h1 className="text-4xl font-bold">The Shuk Recipe Heist</h1>
      <p>
        It is Thursday, 6:00 AM, in Machane Yehuda Market. Rina Shalev opens her hummus stall and
        finds that her grandmother&apos;s secret recipe, a small blue notebook, is gone. Tomorrow
        is the Jerusalem Hummus Championship.
      </p>
      <p>Four suspects. A handful of documents. Somebody is lying.</p>
      <div>
        <h2 className="mb-3 font-semibold">How many detectives?</h2>
        <div className="flex gap-3">
          {[1, 2, 3, 4].map((n) => (
            <button
              key={n}
              onClick={() => onStart(n)}
              className="h-14 w-14 rounded-lg bg-accent text-xl font-bold text-accent-text"
            >
              {n}
            </button>
          ))}
        </div>
        <p className="mt-3 text-sm text-muted">
          One detective gets one accusation. A team shares this screen and gets two.
        </p>
      </div>
    </main>
  );
}
