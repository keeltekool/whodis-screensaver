"use client";

import { useEffect, useState } from "react";

interface PhotoCarouselProps {
  photoBaseUrl: string;
}

export default function PhotoCarousel({ photoBaseUrl }: PhotoCarouselProps) {
  const [photoKeys, setPhotoKeys] = useState<string[]>([]);
  const [count, setCount] = useState(0);

  useEffect(() => {
    fetch("/api/celebrities")
      .then((res) => res.json())
      .then((data) => {
        setPhotoKeys(data.map((c: { photo_key: string }) => c.photo_key));
        setCount(data.length);
      })
      .catch(console.error);
  }, []);

  if (photoKeys.length === 0) return null;

  // Limit to 40 for mobile performance, duplicate for seamless loop
  const limitedKeys = photoKeys.slice(0, 40);
  const allKeys = [...limitedKeys, ...limitedKeys];

  return (
    <div className="w-full overflow-hidden py-8">
      <div
        className="flex gap-2 animate-carousel"
        style={{ width: `${allKeys.length * 100}px` }}
      >
        {allKeys.map((key, i) => (
          <img
            key={`${key}-${i}`}
            src={`${photoBaseUrl}/photos/${key}`}
            alt=""
            loading="lazy"
            decoding="async"
            className="w-24 h-24 object-cover photo-filter shrink-0"
          />
        ))}
      </div>
      {count > 0 && (
        <p className="text-center text-on-surface-variant/40 font-label text-[10px] uppercase tracking-[0.3em] mt-4">
          {count} Icons &middot; 5 Decades &middot; 3 Worlds
        </p>
      )}
    </div>
  );
}
