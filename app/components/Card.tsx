import React from "react";

interface CardProps {
  title: string;
  subtitle?: string;
  description?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export function Card({ title, subtitle, description, icon, children }: CardProps) {
  return (
    <div className="border border-gray-200 shadow-lg p-5 rounded-lg bg-white flex flex-col gap-3" style={{ fontFamily: "Avenir, sans-serif" }}>
      {/* Icone si fournie */}
      {icon && <div className="text-3xl text-blue-600">{icon}</div>}

      {/* Titre et sous-titre */}
      <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
      {subtitle && <p className="text-gray-500 text-sm">{subtitle}</p>}

      {/* Description */}
      {description && <p className="text-gray-600">{description}</p>}

      {/* Contenu supplémentaire */}
      {children}
    </div>
  );
}
