import * as React from "react";

type FeatureCardProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
};

export default function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="group bg-surface-900 hover:bg-surface-800 transition-colors p-10 border-l-2 border-transparent hover:border-brand-500">
      <div className="text-brand-400">{icon}</div>
      <h3 className="mt-4 text-white font-semibold text-xl">{title}</h3>
      <p className="mt-2 text-sm text-white/40 leading-relaxed">{description}</p>
    </div>
  );
}
