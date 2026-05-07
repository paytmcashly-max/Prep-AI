import { Text } from "react-native";

import { COLORS } from "../utils/constants";

export default function LoadingDots({ label = "Loading..." }) {
  return (
    <Text selectable style={{ color: COLORS.muted, fontSize: 16, fontWeight: "700" }}>
      {label}
    </Text>
  );
}
