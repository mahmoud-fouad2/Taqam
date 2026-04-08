import { Image, StyleProp, View, ViewStyle } from "react-native";

const logoDark = require("../assets/brand/logo-dark.png");
const logoLight = require("../assets/brand/logo-light.png");

export function BrandLogo({ style, variant = "light" }: { style?: StyleProp<ViewStyle>; variant?: "light" | "dark" }) {
  return (
    <View style={style}>
      {/* eslint-disable-next-line jsx-a11y/alt-text */}
      <Image
        source={variant === "dark" ? logoDark : logoLight}
        resizeMode="contain"
        style={{ width: 160, height: 48 }}
        accessibilityLabel="طاقم - Taqam"
      />
    </View>
  );
}
