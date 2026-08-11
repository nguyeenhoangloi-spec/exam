import React from 'react';

type DynamicImageProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'alt' | 'src'> & {
  alt: string;
  src: string;
};

/**
 * Image primitive for user-uploaded media, signed backend URLs, data URLs and
 * object URLs. These sources must bypass Next's server-side image loader so
 * browser credentials and short-lived URLs continue to work correctly.
 */
export function DynamicImage({ alt, decoding = 'async', loading = 'lazy', ...props }: DynamicImageProps) {
  // eslint-disable-next-line @next/next/no-img-element -- dynamic/authenticated media cannot safely use the Next image loader.
  return <img alt={alt} decoding={decoding} loading={loading} {...props} />;
}
