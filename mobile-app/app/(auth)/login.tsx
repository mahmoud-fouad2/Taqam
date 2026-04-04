import { useEffect, useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, View } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Button, Divider, Text, TextInput, useTheme } from "react-native-paper";
import NetInfo from "@react-native-community/netinfo";

import { useAuth } from "../../state/auth";
import { getApiBaseUrl } from "../../lib/config";
import { apiFetch } from "../../lib/api";

export default function LoginScreen() {
  const theme = useTheme();
  const router = useRouter();
  const auth = useAuth();

  const apiBaseUrl = useMemo(() => getApiBaseUrl(), []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [diag, setDiag] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  // On app launch, keep the user on the login screen.
  // If there's a saved session (refresh token), unlock via biometrics first
  // (when enabled) and then continue into the app.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (auth.status === "boot") return;
      if (auth.status !== "signedIn") return;

      setDiag(null);
      setError(null);
      setLoading(true);
      try {
        const token = await auth.refreshSession();
        if (!token) return;
        if (cancelled) return;
        router.replace("/(app)");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.status]);

  const isProbablyWrongForPhone =
    apiBaseUrl.includes("10.0.2.2") || apiBaseUrl.includes("localhost") || apiBaseUrl.includes("127.0.0.1");

  async function testConnection() {
    setDiag(null);
    setTesting(true);
    try {
      const net = await NetInfo.fetch();
      if (!net.isConnected) {
        setDiag("No internet connection detected.");
        return;
      }

      const res = await apiFetch<{ ok: boolean }>("/api/health");
      if (!res.ok) {
        setDiag(`API unreachable: ${res.error}`);
        return;
      }
      setDiag("✅ Backend reachable");
    } finally {
      setTesting(false);
    }
  }

  async function onSubmit() {
    setError(null);
    setDiag(null);

    if (!email.trim() || !password) {
      setError("Email and password are required");
      return;
    }

    setLoading(true);
    try {
      const res = await auth.signIn(email.trim(), password);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.replace("/(app)");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <LinearGradient
        colors={["#0B1220", "#111827", "#0B1220"]}
        style={{ flex: 1, paddingHorizontal: 20, paddingTop: 72 }}
      >
        <Text variant="headlineMedium" style={{ color: "white", fontWeight: "700" }}>
          Taqam
        </Text>
        <Text style={{ color: "rgba(255,255,255,0.75)", marginTop: 8 }}>
          Sign in to your account
        </Text>

        <View
          style={{
            marginTop: 24,
            backgroundColor: "rgba(255,255,255,0.06)",
            borderColor: "rgba(255,255,255,0.12)",
            borderWidth: 1,
            borderRadius: 16,
            padding: 16,
          }}
        >
          <TextInput
            mode="outlined"
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            textColor="white"
            outlineColor="rgba(255,255,255,0.25)"
            activeOutlineColor={theme.colors.primary}
            style={{ backgroundColor: "transparent" }}
          />

          <View style={{ height: 12 }} />

          <TextInput
            mode="outlined"
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textColor="white"
            outlineColor="rgba(255,255,255,0.25)"
            activeOutlineColor={theme.colors.primary}
            style={{ backgroundColor: "transparent" }}
          />

          {error ? (
            <Text style={{ color: theme.colors.error, marginTop: 10 }}>{error}</Text>
          ) : null}

          {diag ? (
            <Text style={{ color: "rgba(255,255,255,0.8)", marginTop: 10 }}>{diag}</Text>
          ) : null}

          <Divider style={{ marginTop: 16, backgroundColor: "rgba(255,255,255,0.12)" }} />

          <Text style={{ color: "rgba(255,255,255,0.65)", marginTop: 12, fontSize: 12 }}>
            API: {apiBaseUrl}
          </Text>
          {isProbablyWrongForPhone ? (
            <Text style={{ color: "rgba(255,255,255,0.65)", marginTop: 6, fontSize: 12 }}>
              Hint: this URL works for Android emulator only. For a real phone, use your Render HTTPS domain.
            </Text>
          ) : null}

          <View style={{ height: 16 }} />

          <Button
            mode="contained"
            onPress={onSubmit}
            loading={loading}
            disabled={loading}
            contentStyle={{ height: 48 }}
            style={{ borderRadius: 12 }}
          >
            Sign in
          </Button>

          <View style={{ height: 10 }} />

          <Button
            mode="outlined"
            onPress={testConnection}
            loading={testing}
            disabled={testing}
            textColor="white"
            style={{ borderRadius: 12, borderColor: "rgba(255,255,255,0.25)" }}
          >
            Test connection
          </Button>
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}
