import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";

const DEMO_USERS = [
  { email: "admin@cuartoarte.com", password: "admin123", label: "Administrador", icon: "shield" as const },
  { email: "cliente@ejemplo.com", password: "cliente123", label: "Cliente", icon: "user" as const },
  { email: "musico@ejemplo.com", password: "musico123", label: "Músico", icon: "music" as const },
];

export default function LoginScreen() {
  const { login } = useAuth();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Ingresa tu correo y contraseña");
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err: any) {
      Alert.alert("Error", err.message ?? "No se pudo iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (u: (typeof DEMO_USERS)[0]) => {
    setEmail(u.email);
    setPassword(u.password);
  };

  return (
    <LinearGradient colors={["#0D0D0D", "#1A1209"]} style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={[styles.container, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}>
          <View style={styles.header}>
            <View style={styles.logoRing}>
              <Feather name="music" size={36} color={Colors.primary} />
            </View>
            <Text style={styles.title}>Cuarto Arte</Text>
            <Text style={styles.subtitle}>Gestión de eventos musicales</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Iniciar sesión</Text>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Correo electrónico</Text>
              <View style={styles.inputRow}>
                <Feather name="mail" size={16} color={Colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="correo@ejemplo.com"
                  placeholderTextColor={Colors.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Contraseña</Text>
              <View style={styles.inputRow}>
                <Feather name="lock" size={16} color={Colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.textSecondary}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <Pressable onPress={() => setShowPassword((v) => !v)} style={styles.eyeBtn}>
                  <Feather name={showPassword ? "eye-off" : "eye"} size={16} color={Colors.textSecondary} />
                </Pressable>
              </View>
            </View>

            <Pressable
              style={[styles.loginBtn, loading && { opacity: 0.7 }]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.dark} />
              ) : (
                <>
                  <Text style={styles.loginBtnText}>Entrar</Text>
                  <Feather name="arrow-right" size={18} color={Colors.dark} />
                </>
              )}
            </Pressable>
          </View>

          <View style={styles.demoSection}>
            <Text style={styles.demoTitle}>Acceso de prueba</Text>
            <View style={styles.demoRow}>
              {DEMO_USERS.map((u) => (
                <Pressable key={u.email} style={styles.demoBtn} onPress={() => fillDemo(u)}>
                  <View style={styles.demoBtnIconWrap}>
                    <Feather name={u.icon} size={16} color={Colors.primary} />
                  </View>
                  <Text style={styles.demoBtnLabel}>{u.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, justifyContent: "center" },
  header: { alignItems: "center", marginBottom: 36 },
  logoRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    backgroundColor: Colors.surface,
  },
  title: { fontFamily: "Inter_700Bold", fontSize: 32, color: Colors.textPrimary, letterSpacing: 1 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 24,
  },
  cardTitle: { fontFamily: "Inter_600SemiBold", fontSize: 20, color: Colors.textPrimary, marginBottom: 20 },
  field: { marginBottom: 16 },
  fieldLabel: { fontFamily: "Inter_500Medium", fontSize: 12, color: Colors.textSecondary, marginBottom: 8 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
  },
  inputIcon: { marginRight: 8 },
  input: {
    flex: 1,
    paddingVertical: 13,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.textPrimary,
  },
  eyeBtn: { padding: 8 },
  loginBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 4,
  },
  loginBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: Colors.dark },
  demoSection: { alignItems: "center" },
  demoTitle: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textSecondary, marginBottom: 12 },
  demoRow: { flexDirection: "row", gap: 12 },
  demoBtn: {
    flex: 1,
    alignItems: "center",
    gap: 6,
    padding: 12,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  demoBtnIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  demoBtnLabel: { fontFamily: "Inter_500Medium", fontSize: 11, color: Colors.textPrimary },
});
