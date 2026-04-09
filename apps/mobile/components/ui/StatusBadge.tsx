import { View, Text, type ViewStyle } from "react-native";
import { useTheme } from "@/theme";

type Variant = "pending" | "approved" | "rejected" | "cancelled" | "info" | "default";

type Props = {
  label: string;
  variant?: Variant;
  style?: ViewStyle;
};

export function StatusBadge({ label, variant = "default", style }: Props) {
  const { colors } = useTheme();

  const schemes: Record<Variant, { bg: string; text: string }> = {
    pending: { bg: colors.warningLight, text: "#92400e" },
    approved: { bg: colors.successLight, text: "#065f46" },
    rejected: { bg: colors.errorLight, text: "#991b1b" },
    cancelled: { bg: colors.borderLight, text: colors.textSecondary },
    info: { bg: colors.primaryLight, text: colors.primary },
    default: { bg: colors.surfaceSecondary, text: colors.textSecondary },
  };

  const s = schemes[variant];

  return (
    <View
      style={[
        {
          backgroundColor: s.bg,
          borderRadius: 8,
          paddingHorizontal: 10,
          paddingVertical: 4,
          alignSelf: "flex-start",
        },
        style,
      ]}
    >
      <Text style={{ color: s.text, fontSize: 11, fontWeight: "700" }}>{label}</Text>
    </View>
  );
}

/**
 * Map a status string to a StatusBadge variant.
 */
export function statusToVariant(status: string): Variant {
  const s = status.toUpperCase();
  if (s === "PENDING" || s === "OPEN") return "pending";
  if (s === "APPROVED" || s === "SENT") return "approved";
  if (s === "REJECTED") return "rejected";
  if (s === "CANCELLED" || s === "CLOSED") return "cancelled";
  return "default";
}
