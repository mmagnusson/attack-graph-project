import React from 'react';
import { theme } from '../../theme';

interface AnalysisCardProps {
  title: string;
  children: React.ReactNode;
}

export function AnalysisCard({ title, children }: AnalysisCardProps) {
  return (
    <div style={{
      background: theme.colors.bg, border: "1px solid " + theme.colors.borderSubtle, borderRadius: theme.radii.md, padding: theme.spacing.xl,
    }}>
      <div style={{ fontSize: theme.fontSizes.base, color: theme.colors.orange, fontWeight: 700, marginBottom: theme.spacing.md, letterSpacing: "0.5px" }}>{title}</div>
      <div style={{ fontSize: theme.fontSizes.base, color: theme.colors.textSecondary, lineHeight: "1.5" }}>{children}</div>
    </div>
  );
}
