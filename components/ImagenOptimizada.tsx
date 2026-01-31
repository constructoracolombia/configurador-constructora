'use client';

import Image from 'next/image';
import { useState } from 'react';

interface Props {
  src?: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
}

export function ImagenOptimizada({ src, alt, width, height, className }: Props) {
  const [error, setError] = useState(false);

  const placeholderSrc = `https://placehold.co/${width}x${height}/006699/FFFFFF?text=${encodeURIComponent(alt)}`;

  return (
    <Image
      src={error || !src ? placeholderSrc : src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={() => setError(true)}
      priority={false}
    />
  );
}
