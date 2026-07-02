
// ─── Palette générale ────────────────────────────────────────────────────────
// Fond blanc partout, seule la couleur d'accent change selon le rôle.

import { UserRole } from "@/types/users/userType";

export const COLORS = {
  background: '#FFFFFF',
  surface: '#F7F8FA',
  border: '#ECEEF1',
  textPrimary: '#14171A',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  success: '#2E9E5B',
  danger: '#E0483C',
  warning: '#E8863C',
};

// ─── Couleurs d'accent par rôle ──────────────────────────────────────────────

export const ROLE_ACCENT: Record<UserRole, string> = {
  buyer: '#2F6FED',       // bleu
  producer: '#2E9E5B',    // vert
  transporter: '#E8863C', // orange
};

export const ROLE_ACCENT_SOFT: Record<UserRole, string> = {
  buyer: '#EAF1FE',
  producer: '#EAF7EF',
  transporter: '#FCEFE3',
};

export const ROLE_LABEL: Record<UserRole, string> = {
  buyer: 'Acheteur',
  producer: 'Producteur',
  transporter: 'Transporteur',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 999,
};

export const FONT = {
  size: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 24,
  },
  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};