interface ExperienceCardProps {
  label: string;
  title: string;
  description: string;
  ctaText: string;
  href?: string;
  external?: boolean;
  disabled?: boolean;
}

export default function ExperienceCard({ label, title, description, ctaText, href, external, disabled }: ExperienceCardProps) {
  return (
    <div className="bg-surface-container-low p-6 flex flex-col justify-between">
      <div>
        <span className="font-label text-[10px] uppercase tracking-[0.2em] text-primary-fixed-dim">
          {label}
        </span>
        <h3 className="font-headline font-bold text-2xl text-on-surface mt-2 mb-3">
          {title}
        </h3>
        <p className="text-on-surface-variant text-sm font-light leading-relaxed">
          {description}
        </p>
      </div>
      {disabled ? (
        <span className="mt-6 block w-full bg-surface-container-high text-on-surface-variant/40 font-label font-bold text-sm py-4 tracking-[0.1em] uppercase text-center">
          {ctaText}
        </span>
      ) : (
        <a
          href={href}
          target={external ? "_blank" : undefined}
          rel={external ? "noopener noreferrer" : undefined}
          className="mt-6 block w-full bg-primary-container text-on-primary font-label font-bold text-sm py-4 tracking-[0.1em] uppercase text-center transition-all hover:brightness-110 active:scale-[0.98]"
        >
          {ctaText}
        </a>
      )}
    </div>
  );
}
