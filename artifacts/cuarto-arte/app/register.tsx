import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
  Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";

const INSTRUMENT_OPTIONS = [
  "Piano", "Guitarra", "Violín", "Cello", "Trompeta",
  "Saxofón", "Flauta", "Batería", "Voz", "DJ", "Acordeón", "Otro",
];

export default function RegisterScreen() {
  const { setSession } = useAuth();
  const insets = useSafeAreaInsets();
  const { role: roleParam } = useLocalSearchParams<{ role?: string }>();
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  const baseUrl = domain ? `https://${domain}` : "";

  const [role, setRole] = useState<"client" | "musician">(roleParam === "musician" ? "musician" : "client");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [instruments, setInstruments] = useState<string[]>([]);
  const [specialty, setSpecialty] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggleInstrument = (inst: string) => {
    setInstruments(prev =>
      prev.includes(inst) ? prev.filter(i => i !== inst) : [...prev, inst]
    );
  };

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password || !phone.trim()) {
      Alert.alert("Error", "Completa todos los campos requeridos"); return;
    }
    if (password !== confirmPass) {
      Alert.alert("Error", "Las contraseñas no coinciden"); return;
    }
    if (password.length < 6) {
      Alert.alert("Error", "La contraseña debe tener al menos 6 caracteres"); return;
    }
    if (role === "musician" && instruments.length === 0) {
      Alert.alert("Error", "Selecciona al menos un instrumento"); return;
    }

    setLoading(true);
    try {
      const body: any = { name: name.trim(), email: email.trim().toLowerCase(), password, phone: phone.trim(), role };
      if (role === "musician") {
        body.instruments = instruments.join(", ");
        body.specialty = specialty.trim() || undefined;
      }

      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        Alert.alert("Error", data.error ?? "No se pudo crear la cuenta"); return;
      }

      if (role === "client") {
        // Use the token returned directly from registration — no second login call needed
        await setSession(data.token, data.user);
        router.replace("/(tabs)");
      } else {
        Alert.alert(
          "¡Solicitud enviada!",
          "Tu solicitud fue enviada al administrador. Recibirás una respuesta pronto.\n\nNúmero de WhatsApp: +528114845398",
          [{ text: "Entendido", onPress: () => router.replace("/login") }]
        );
      }
    } catch {
      Alert.alert("Error", "No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#0D0D0D", "#1A1209"]} style={{ flex: 1 }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView
          contentContainerStyle={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Feather name="arrow-left" size={20} color={Colors.textPrimary} />
            </Pressable>
            <View style={styles.logoWrap}>
              <Feather name="music" size={28} color={Colors.primary} />
            </View>
            <Text style={styles.title}>Crear Cuenta</Text>
            <Text style={styles.subtitle}>Únete a Cuarto Arte</Text>
          </View>

          {/* Role selector */}
          <View style={styles.roleRow}>
            <Pressable style={[styles.roleBtn, role === "client" && styles.roleBtnActive]} onPress={() => setRole("client")}>
              <Feather name="user" size={18} color={role === "client" ? Colors.dark : Colors.textSecondary} />
              <Text style={[styles.roleBtnText, role === "client" && styles.roleBtnTextActive]}>Soy Cliente</Text>
            </Pressable>
            <Pressable style={[styles.roleBtn, role === "musician" && styles.roleBtnActive]} onPress={() => setRole("musician")}>
              <Feather name="music" size={18} color={role === "musician" ? Colors.dark : Colors.textSecondary} />
              <Text style={[styles.roleBtnText, role === "musician" && styles.roleBtnTextActive]}>Soy Músico</Text>
            </Pressable>
          </View>

          {role === "musician" && (
            <View style={styles.infoBanner}>
              <Feather name="info" size={14} color={Colors.primary} />
              <Text style={styles.infoText}>Los músicos requieren aprobación del administrador antes de poder iniciar sesión.</Text>
            </View>
          )}

          {/* Form */}
          <View style={styles.card}>
            <FormInput label="Nombre completo *" value={name} onChangeText={setName} placeholder="Tu nombre" icon="user" />
            <FormInput label="Correo electrónico *" value={email} onChangeText={setEmail} placeholder="correo@ejemplo.com" icon="mail" keyboard="email-address" autoCapitalize="none" />
            <FormInput label="Teléfono *" value={phone} onChangeText={setPhone} placeholder="+52 55 1234 5678" icon="phone" keyboard="phone-pad" />

            {role === "musician" && (
              <>
                <View style={styles.field}>
                  <Text style={styles.label}>Instrumentos * ({instruments.length} seleccionados)</Text>
                  <View style={styles.instGrid}>
                    {INSTRUMENT_OPTIONS.map(inst => (
                      <Pressable key={inst} style={[styles.instChip, instruments.includes(inst) && styles.instChipActive]} onPress={() => toggleInstrument(inst)}>
                        <Text style={[styles.instChipText, instruments.includes(inst) && styles.instChipTextActive]}>{inst}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
                <FormInput label="Especialidad (opcional)" value={specialty} onChangeText={setSpecialty} placeholder="Jazz, Clásica, Pop..." icon="star" />
              </>
            )}

            <View style={[styles.field, { position: "relative" }]}>
              <Text style={styles.label}>Contraseña *</Text>
              <View style={styles.inputRow}>
                <Feather name="lock" size={15} color={Colors.textSecondary} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={password} onChangeText={setPassword}
                  placeholder="Mínimo 6 caracteres"
                  placeholderTextColor={Colors.textSecondary}
                  secureTextEntry={!showPass} autoCapitalize="none"
                />
                <Pressable onPress={() => setShowPass(v => !v)} style={{ padding: 4 }}>
                  <Feather name={showPass ? "eye-off" : "eye"} size={15} color={Colors.textSecondary} />
                </Pressable>
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Confirmar contraseña *</Text>
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

            <Pressable style={[styles.submitBtn, loading && { opacity: 0.7 }]} onPress={handleRegister} disabled={loading}>
              {loading ? <ActivityIndicator color={Colors.dark} /> : (
                <>
                  <Feather name={role === "client" ? "user-check" : "send"} size={18} color={Colors.dark} />
                  <Text style={styles.submitBtnText}>
                    {role === "client" ? "Crear Cuenta" : "Enviar Solicitud"}
                  </Text>
                </>
              )}
            </Pressable>
          </View>

          <Pressable style={styles.loginLink} onPress={() => router.replace("/login")}>
            <Text style={styles.loginLinkText}>¿Ya tienes cuenta? <Text style={{ color: Colors.primary }}>Inicia sesión</Text></Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

function FormInput({ label, value, onChangeText, placeholder, icon, keyboard, autoCapitalize }: {
  label: string; value: string; onChangeText: (v: string) => void;
  placeholder: string; icon: string; keyboard?: any; autoCapitalize?: any;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        <Feather name={icon as any} size={15} color={Colors.textSecondary} />
        <TextInput
          style={[styles.input, { flex: 1 }]}
          value={value} onChangeText={onChangeText}
          placeholder={placeholder} placeholderTextColor={Colors.textSecondary}
          keyboardType={keyboard} autoCapitalize={autoCapitalize ?? "words"}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 24 },
  header: { alignItems: "center", marginBottom: 24 },
  backBtn: { position: "absolute", left: -10, top: 0, padding: 10 },
  logoWrap: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: Colors.primary, alignItems: "center", justifyContent: "center", backgroundColor: Colors.surface, marginBottom: 12 },
  title: { fontFamily: "Inter_700Bold", fontSize: 26, color: Colors.textPrimary },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  roleRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  roleBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 14, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  roleBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  roleBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.textSecondary },
  roleBtnTextActive: { color: Colors.dark },
  infoBanner: { flexDirection: "row", alignItems: "flex-start", gap: 8, backgroundColor: Colors.primary + "15", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: Colors.primary + "40", marginBottom: 16 },
  infoText: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.textSecondary, flex: 1 },
  card: { backgroundColor: Colors.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: Colors.border, marginBottom: 16 },
  field: { marginBottom: 16 },
  label: { fontFamily: "Inter_500Medium", fontSize: 12, color: Colors.textSecondary, marginBottom: 8 },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: Colors.dark, borderRadius: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: Colors.border },
  input: { paddingVertical: 12, fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.textPrimary },
  instGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  instChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.dark, borderWidth: 1, borderColor: Colors.border },
  instChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  instChipText: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.textSecondary },
  instChipTextActive: { color: Colors.dark },
  submitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 16, marginTop: 4 },
  submitBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: Colors.dark },
  loginLink: { alignItems: "center", paddingVertical: 8 },
  loginLinkText: { fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.textSecondary },
});
