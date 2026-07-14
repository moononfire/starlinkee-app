// Zestaw kolorów i promieni zaokrągleń spójny z brandingiem starlinkee.com.
export const Colors = {
  brand50: "#eff6ff",
  brand100: "#dbeafe",
  brand200: "#bfdbfe",
  brand600: "#2563eb",
  brand700: "#1d4ed8",

  background: "#f9fafb",
  white: "#ffffff",

  textPrimary: "#111827",
  textSecondary: "#4b5563",
  textMuted: "#6b7280",
  textPlaceholder: "#9ca3af",

  border: "#e5e7eb",
  borderStrong: "#d1d5db",

  success: "#16a34a",
  successBg: "#dcfce7",
  successText: "#166534",

  warning: "#d97706",
  error: "#ef4444",
};

export const Radius = {
  md: 6,
  lg: 8,
  xl: 12,
  xxl: 16,
  xxxl: 24,
  full: 9999,
};

// Kolorowy cień pod przyciskiem/kartą marki, jak na starlinkee.com.
export const brandShadow = {
  shadowColor: Colors.brand600,
  shadowOpacity: 0.25,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 6 },
  elevation: 6,
};
