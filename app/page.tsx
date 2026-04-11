import ExperienceCard from "@/components/ExperienceCard";
import PhotoCarousel from "@/components/PhotoCarousel";

const R2_BASE = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "https://pub-19f678b6a57845a7bafc5e706541ab76.r2.dev";
const GAME_URL = "https://app-zeta-nine-52.vercel.app";

export default function HubPage() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Corner accents */}
      <div className="fixed top-0 right-0 w-24 h-24 border-t-2 border-r-2 border-primary-fixed-dim/20 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-24 h-24 border-b-2 border-l-2 border-primary-fixed-dim/20 pointer-events-none" />

      {/* HERO */}
      <section className="flex flex-col items-center justify-center px-8 pt-24 pb-16 relative">
        <div className="absolute inset-0 grain-texture" />
        <span className="font-label text-xs uppercase tracking-[0.3em] text-primary/60 mb-2">
          The Collection
        </span>
        <h1 className="text-6xl md:text-8xl font-headline font-black text-primary-fixed-dim tracking-tighter leading-none text-center">
          WHO DIS?
        </h1>
        <div className="mt-6 w-12 h-1 bg-primary-fixed-dim" />
        <p className="mt-6 text-on-surface-variant text-center max-w-md font-body text-lg font-light">
          Icons. Decades. Zero apologies.
        </p>
        <p className="mt-2 text-on-surface-variant/60 text-center max-w-lg font-body text-sm font-light">
          The faces that defined an era — before filters, before followers, before anyone asked permission.
        </p>
      </section>

      {/* EXPERIENCES — The Gateway */}
      <section className="px-8 pb-16 max-w-5xl mx-auto w-full">
        <h2 className="font-label text-xs font-extrabold uppercase tracking-[0.2em] text-on-surface-variant mb-6">
          Four Ways In
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ExperienceCard
            label="WHO DIS? — THE GAME"
            title="THE GAME"
            description="Six squares. One legend. How fast can you tell? Reveal the photo piece by piece. Use hints if you need them — but every hint costs you. 5 rounds, 15 points max. Beat your best."
            ctaText="PLAY NOW →"
            href={GAME_URL}
            external
          />
          <ExperienceCard
            label="WHO DIS? — THE WALL"
            title="THE WALL"
            description="Turn any screen into a gallery of legends. A fullscreen slideshow that cycles through every icon in the collection. Name. Photo. One fact you didn't know. Set it up. Walk away. Let them stare back at you."
            ctaText="LAUNCH →"
            href="/screensaver"
          />
          <ExperienceCard
            label="WHO DIS? — IN COLOR"
            title="IN COLOR"
            description="Not everything was black and white. The rare color shots — vivid, unfiltered, alive. Same legends, different light. A chromatic trip through the decades."
            ctaText="VIEW GALLERY →"
            href="/gallery"
          />
          <ExperienceCard
            label="WHO DIS? — DEATHMATCH"
            title="DEATHMATCH"
            description="Two legends. Seven rounds. Pick your answer and your knowledge decides who walks away standing. 30 showdowns. No refs. No mercy."
            ctaText="FIGHT →"
            href="/deathmatch"
          />
        </div>
      </section>

      {/* THE VAULT — Master Collection */}
      <section className="px-8 pb-16 max-w-5xl mx-auto w-full">
        <h2 className="font-label text-xs font-extrabold uppercase tracking-[0.2em] text-on-surface-variant mb-6">
          The Vault
        </h2>
        <ExperienceCard
          label="WHO DIS? — THE MASTER COLLECTION"
          title="EVERYTHING"
          description="Every frame. Every legend. Every reject, deep cut, and mood shot that didn't make the game. The ones you know. The ones you forgot. The ones nobody asked about. All of it — black and white, color, raw — rolling on a loop with zero apologies."
          ctaText="ENTER →"
          href="/master"
        />
      </section>

      {/* THE STORY */}
      <section className="px-8 pb-12 max-w-2xl mx-auto w-full">
        <h2 className="font-label text-xs font-extrabold uppercase tracking-[0.2em] text-on-surface-variant mb-6">
          The Icons
        </h2>
        <div className="space-y-4 text-on-surface-variant font-body text-sm font-light leading-relaxed">
          <p>
            There was a time when fame was earned in smoke-filled rooms, on sun-cracked courts,
            and under lights so hot they melted vinyl.
          </p>
          <p>
            These are the faces from that time. Film legends who made the camera fall in love.
            Athletes who rewrote what a body could do. Musicians who turned noise into religion.
          </p>
          <p className="text-primary/80 font-headline font-bold text-base">
            Shot in black and white, because color would be too easy.
          </p>
        </div>
      </section>

      {/* PHOTO CAROUSEL */}
      <section className="pb-8">
        <PhotoCarousel photoBaseUrl={R2_BASE} />
      </section>

      {/* FOOTER */}
      <footer className="py-8 text-center">
        <p className="text-on-surface-variant/30 font-label text-[10px] uppercase tracking-[0.3em]">
          WHO DIS? &middot; 2026 &middot; Neo-Noir Edition
        </p>
      </footer>
    </main>
  );
}
