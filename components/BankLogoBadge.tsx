import React, { useEffect, useState } from 'react';

type BankLogoBadgeProps = {
  name: string;
  logoUrl?: string | null;
  className?: string;
  imageClassName?: string;
  fallbackClassName?: string;
};

const BankLogoBadge: React.FC<BankLogoBadgeProps> = ({
  name,
  logoUrl,
  className = '',
  imageClassName = '',
  fallbackClassName = '',
}) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [logoUrl, name]);

  const fallbackLetter = name.trim().charAt(0).toUpperCase() || '?';
  const showImage = Boolean(logoUrl) && !hasError;

  return (
    <div
      className={`flex items-center justify-center overflow-hidden border border-primary/10 bg-white/90 shadow-[0_10px_25px_-18px_rgba(0,0,0,0.35)] ${className}`.trim()}
    >
      {showImage ? (
        <img
          src={logoUrl ?? undefined}
          alt=""
          aria-hidden="true"
          className={`h-full w-full object-contain ${imageClassName}`.trim()}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setHasError(true)}
        />
      ) : (
        <span className={`text-base font-bold text-primary/70 ${fallbackClassName}`.trim()}>
          {fallbackLetter}
        </span>
      )}
    </div>
  );
};

export default BankLogoBadge;
