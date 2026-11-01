"use client";

import { useEffect, useRef } from "react";
import { SUSPECTS } from "@/lib/suspects";

export default function Briefing({
  accusations,
  onClose,
}: {
  accusations: number;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  // showModal gives us the focus trap and closing on Escape.
  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  return (
    <dialog ref={dialogRef} onClose={onClose} aria-labelledby="briefing-title" className="briefing">
      <div className="tile-strip" />
      <div className="flex flex-col gap-5 p-5 md:p-7">
        <h2 id="briefing-title" className="neon-title text-[clamp(1.8rem,5vw,2.75rem)]">
          Your case briefing
        </h2>

        <section className="flex flex-col gap-2">
          <h3 className="sign-text text-lg text-accent">The case</h3>
          <p className="typewriter leading-relaxed">
            Machane Yehuda Market, the Shuk, is Jerusalem&apos;s main market. Its main gates are
            locked from 22:00 to 05:30, and a night guard patrols inside.
          </p>
          <p className="typewriter leading-relaxed">
            This Friday is the Jerusalem Hummus Championship: 20,000 NIS and a feature on national
            TV. The favorite is Hummus Shalev, stall 14, famous for Grandma Esther&apos;s recipe,
            handwritten in a small blue notebook. On Thursday morning, the notebook is gone.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h3 className="sign-text text-lg text-accent">The suspects</h3>
          <ul className="grid gap-2 sm:grid-cols-2">
            {SUSPECTS.map((s) => (
              <li key={s.id} className="flex items-center gap-2">
                <span className="monogram" aria-hidden="true">
                  {s.name[0]}
                </span>
                <span className="min-w-0 leading-tight">
                  <span className="block font-semibold">{s.name}</span>
                  <span className="block text-sm text-muted">{s.role}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="flex flex-col gap-2">
          <h3 className="sign-text text-lg text-accent">How to play</h3>
          <ol className="briefing-steps">
            <li>
              <strong>Search the files.</strong> Ask the Case Assistant what the police found. It
              shows which file each fact came from with a tag like{" "}
              <span className="cite">[C2]</span>, but it won&apos;t name the thief for you. B is
              background, C is a police or case file, and S is a suspect&apos;s statement. Hover a
              tag to see the file&apos;s name.
            </li>
            <li>
              <strong>Question the suspects.</strong> Pick a card to talk to someone. Each suspect
              only knows their own side and keeps secrets until you earn them, so be kind or bring
              real evidence from the files.
            </li>
            <li>
              <strong>Watch the nervousness meter.</strong> It shows how close you are to
              someone&apos;s secret. Everyone has something to hide, so it isn&apos;t proof of guilt.
            </li>
            <li>
              <strong>Make your accusation.</strong>{" "}
              {accusations === 1
                ? "You get one accusation, so be sure."
                : "Your team gets two accusations, so talk it over first."}{" "}
              Run out, and the thief gets away.
            </li>
          </ol>
        </section>

        <form method="dialog">
          <button className="gel-button w-full px-6 py-3 sm:w-auto">Start investigating</button>
        </form>
      </div>
    </dialog>
  );
}
