import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Linking, Platform,
  Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";

const WHATSAPP_NUMBER = "528114845398";

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  const baseUrl = domain ? `https://${domain}` : "";

  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleVerifyEmail = () => {
    if (!email.trim()) { Alert.alert("Error", "Ingresa tu correo electrónico"); return; }
    setStep(2);
  };

  const handleReset = async () => {
    if (!newPassword || !confirmPass) {
      Alert.alert("Error", "Completa los campos de contraseña"); return;
    }
    if (newPassword !== confirmPass) {
      Alert.alert("Error", "Las contraseñas no coinciden"); return;
    }
    if (newPassword.length < 6) {
      Alert.alert("Error", "La contraseña debe tener al menos 6 caracteres"); return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        Alert.alert("Error", data.error ?? "No se pudo restablecer la contraseña"); return;
      }
      Alert.alert("✓ Contraseña restablecida", "Ya puedes iniciar sesión con tu nueva contraseña.", [
        { text: "Iniciar sesión", onPress: () => router.replace("/login") },
      ]);
    } catch {
      Alert.alert("Error", "No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  const openWhatsApp = () => {
    const msg = encodeURIComponent("Hola, olvidé mi contraseña de Cuarto Arte y necesito ayuda.");
    Linking.openURL(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`);
  };

  return (
    <LinearGradient colors={["#0D0D0D", "#1A1209"]} style={{ flex: 1 }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView
          contentContainerStyle={[styles.container, { paddingTop: insets.top + 30, paddingBottom: insets.bottom + 40 }]}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={20} color={Colors.textPrimary} />
            <Text style={styles.backText}>Regresar</Text>
          </Pressable>

          <View style={styles.iconWrap}>
            <Feather name="lock" size={32} color={Colors.primary} />
          </View>
          <Text style={styles.title}>Restablecer Contraseña</Text>
          <Text style={styles.subtitle}>Ingresa tu correo registrado y una nueva contraseña</Text>

          <View style={styles.card}>
            {/* Step 1: Email */}
            <View style={styles.field}>
              <Text style={styles.label}>Correo electrónico</Text>
              <View style={[styles.inputRow, step === 2 && styles.inputRowDone]}>
                <Feather name="mail" size={15} color={step === 2 ? Colors.primary : Colors.textSecondary} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={email} onChangeText={setEmail}
                  placeholder="correo@ejemplo.com"
                  placeholderTextColor={Colors.textSecondary}
                  keyboardType="email-address" autoCapitalize="none"
                  editable={step === 1}
                />
                {step === 2 && <Feather name="check-circle" size={16} color={Colors.primary} />}
              </View>
            </View>

            {step === 1 && (
              <Pressable style={styles.nextBtn} onPress={handleVerifyEmail}>
                <Text style={styles.nextBtnText}>Continuar</Text>
                <Feather name="arrow-right" size={16} color={Colors.dark} />
              </Pressable>
            )}

            {/* Step 2: New password */}
            {step === 2 && (
              <>
                <View style={styles.field}>
                  <Text style={styles.label}>Nueva contraseña</Text>
                  <View style={styles.inputRow}>
                    <Feather name="lock" size={15} color={Colors.textSecondary} />
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      value={newPassword} onChangeText={setNewPassword}
                      placeholder="Mínimo 6 caracteres"
                      placeholderTextColor={Colors.textSecondary}
                      secureTextEntry={!showPass} autoCapitalize="none" autoFocus
                    />
                    <Pressable onPress={() => setShowPass(v => !v)} style={{ padding: 4 }}>
                      <Feather name={showPass ? "eye-off" : "eye"} size={15} color={Colors.textSecondary} />
                    </Pressable>
                  </View>
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Confirmar contraseña</Text>
                  <View style={styles.inputRow}>
                    <Feather name="lock" size={15} color={Colors.textSecondary} />
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      value={confirmPass} onChangeText={setConfirmPass}
                      placeholder="Repite tu contraseña"
                      placeholderTextColor={Colors.textSecondary}
                      secureTextEntry={!showPass} autoCapitalize="none"
                    />
                  </View>
                </View>

                <Pressable style={[styles.nextBtn, loading && { opacity: 0.7 }]} onPress={handleReset} disabled={loading}>
                  {loading ? <ActivityIndicator color={Colors.dark} /> : (
                    <>
                      <Feather name="check" size={16} color={Colors.dark} />
                      <Text style={styles.nextBtnText}>Restablecer Contraseña</Text>
                    </>
                  )}
                </Pressable>
              </>
            )}
          </View>

          {/* WhatsApp help */}
          <View style={styles.helpSection}>
            <Text style={styles.helpTitle}>¿Necesitas ayuda adicional?</Text>
            <Text style={styles.helpSubtitle}>Contacta al administrador por WhatsApp</Text>
            <Pressable style={styles.whatsappBtn} onPress={openWhatsApp}>
              <Feather name="message-circle" size={18} color="#25D366" />
              <Text style={styles.whatsappText}>Escribir a WhatsApp</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 24 },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 32 },
  backText: { fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.textPrimary },
  iconWrap: { width: 70, height: 70, borderRadius: 35, backgroundColor: Colors.surface, borderWidth: 2, borderColor: Colors.primary, alignItems: "center", justifyContent: "center", alignSelf: "center", marginBottom: 16 },
  title: { fontFamily: "Inter_700Bold", fontSize: 26, color: Colors.textPrimary, textAlign: "center" },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.textSecondary, textAlign: "center", marginTop: 8, marginBottom: 28, lineHeight: 20 },
  card: { backgroundColor: Colors.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: Colors.border, marginBottom: 24 },
  field: { marginBottom: 16 },
  label: { fontFamily: "Inter_500Medium", fontSize: 12, color: Colors.textSecondary, marginBottom: 8 },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: Colors.dark, borderRadius: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: Colors.border },
  inputRowDone: { borderColor: Colors.primary + "60" },
  input: { paddingVertical: 13, fontFamily: "Inter_400Regular", fontSize: 15, color: Colors.textPrimary },
  nextBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 15, marginTop: 4 },
  nextBtnText: { fontFamily: "Inter_700Bold", fontSize: 15, color: Colors.dark },
  helpSection: { alignItems: "center", gap: 8 },
  helpTitle: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.textPrimary },
  helpSubtitle: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.textSecondary },
  whatsappBtn: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#25D36620", borderRadius: 14, paddingHorizontal: 20, paddingVertical: 14, borderWidth: 1, borderColor: "#25D36650", marginTop: 4 },
  whatsappText: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: "#25D366" },
});
