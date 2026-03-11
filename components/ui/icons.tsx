import * as React from "react";

type IconProps = React.SVGProps<SVGSVGElement> & { className?: string };

const base = "w-5 h-5";

export function IconGrid(props: IconProps) {
  const { className, ...rest } = props;
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={`${base} ${className ?? ""}`} {...rest}>
      <path d="M4 4h7v7H4z" />
      <path d="M13 4h7v7h-7z" />
      <path d="M4 13h7v7H4z" />
      <path d="M13 13h7v7h-7z" />
    </svg>
  );
}

export function IconWallet(props: IconProps) {
  const { className, ...rest } = props;
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={`${base} ${className ?? ""}`} {...rest}>
      <path d="M3 7h18v12H3z" />
      <path d="M3 7a3 3 0 0 1 3-3h13a2 2 0 0 1 2 2v1" />
      <path d="M16 13h5" />
      <path d="M18.5 11.5v3" />
    </svg>
  );
}

export function IconUser(props: IconProps) {
  const { className, ...rest } = props;
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={`${base} ${className ?? ""}`} {...rest}>
      <path d="M20 21a8 8 0 0 0-16 0" />
      <path d="M12 13a4 4 0 1 0-4-4 4 4 0 0 0 4 4z" />
    </svg>
  );
}

export function IconSettings(props: IconProps) {
  const { className, ...rest } = props;
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={`${base} ${className ?? ""}`} {...rest}>
      <path d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7z" />
      <path d="M19.4 15a7.8 7.8 0 0 0 .1-6l2-1.5-2-3.5-2.4.7a8 8 0 0 0-5.2-3L11 1H9l-.9 2.2a8 8 0 0 0-5.2 3L.5 5.5l-2 3.5 2 1.5a7.8 7.8 0 0 0 .1 6l-2 1.5 2 3.5 2.4-.7a8 8 0 0 0 5.2 3L9 23h2l.9-2.2a8 8 0 0 0 5.2-3l2.4.7 2-3.5z" />
    </svg>
  );
}

export function IconChart(props: IconProps) {
  const { className, ...rest } = props;
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={`${base} ${className ?? ""}`} {...rest}>
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="M8 17v-6" />
      <path d="M12 17v-9" />
      <path d="M16 17v-4" />
    </svg>
  );
}

