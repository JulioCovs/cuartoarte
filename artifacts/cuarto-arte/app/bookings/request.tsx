import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable,
  ScrollView, StyleSheet, Text, TextInput, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";

import Colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";

const EVENT_TYPES = ["Boda", "Quinceañera", "Cumpleaños", "Graduación", "Evento corporativo", "Concierto", "Aniversario", "Otro"];

export default function BookingRequestScreen() {
  const { musicianId, musicianName, instruments, clientId } = useLocalSearchParams<{
    musicianId: string; musicianName: string; instruments: string; clientId: string;
  }>();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  const baseUrl = domain ? `https://${domain}` : "";

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [venue, setVenue] = useState("");
  const [eventType, setEventType] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!date || !time || !venue || !eventType) {
      Alert.alert("Error", "Por favor completa todos los campos requeridos");
      return;
    }
    const effClientId = user?.clientId ?? parseInt(clientId ?? "0");
    if (!effClientId) {
      Alert.alert("Error", "No se pudo identificar tu cuenta de cliente");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${baseUrl}/api/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: effClientId,
          musicianId: parseInt(musicianId),
          requestedDate: date,
          requestedTime: time,
          venue,
          eventType,
          notes: notes.trim() || null,
        }),
      });
      if (!res.ok) throw new Error("Error al enviar solicitud");
      qc.invalidateQueries({ queryKey: ["myRequests"] });
      Alert.alert("✓ Solicitud enviada", "Tu solicitud fue enviada al músico. Te notificaremos cuando responda.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert("Error", "No se pudo enviar la solicitud");
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Musician card */}
        <View style={styles.musicianCard}>
          <View style={styles.musicianAvatar}><Feather name="music" size={24} color={Colors.primary} /></View>
          <View>
            <Text style={styles.musicianName}>{musicianName}</Text>
            <Text style={styles.musicianInstruments}>{instruments}</Text>
          </View>
        </View>

        <Text style={styles.formTitle}>Detalles del evento</Text>

        {/* Event type */}
        <View style={styles.field}>
          <Text style={styles.label}>Tipo de evento *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -4 }}>
            <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 4 }}>
              {EVENT_TYPES.map((t) => (
                <Pressable key={t} style={[styles.typeChip, eventType === t && styles.typeChipActive]} onPress={() => setEventType(t)}>
                  <Text style={[styles.typeChipText, eventType === t && styles.typeChipTextActive]}>{t}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Date */}
        <View style={styles.field}>
          <Text style={styles.label}>Fecha del evento *</Text>
          <View style={styles.inputRow}>
            <Feather name="calendar" size={16} color={Colors.textSecondary} />
            <TextInput
              style={styles.input} value={date} onChangeText={setDate}
              placeholder="YYYY-MM-DD" placeholderTextColor={Colors.textSecondary}
            />
          </View>
        </View>

        {/* Time */}
        <View style={styles.field}>
          <Text style={styles.label}>Hora *</Text>
          <View style={styles.inputRow}>
            <Feather name="clock" size={16} color={Colors.textSecondary} />
            <TextInput
              style={styles.input} value={time} onChangeText={setTime}
              placeholder="HH:MM (ej. 19:00)" placeholderTextColor={Colors.textSecondary}
            />
          </View>
        </View>

        {/* Venue */}
        <View style={styles.field}>
          <Text style={styles.label}>Lugar del evento *</Text>
          <View style={styles.inputRow}>
            <Feather name="map-pin" size={16} color={Colors.textSecondary} />
            <TextInput
              style={styles.input} value={venue} onChangeText={setVenue}
              placeholder="Dirección o nombre del lugar" placeholderTextColor={Colors.textSecondary}
            />
          </View>
        </View>

        {/* Notes */}
        <View style={styles.field}>
          <Text style={styles.label}>Notas adicionales</Text>
          <TextInput
            style={[styles.inputBox, { height: 80 }]} value={notes} onChangeText={setNotes}
            placeholder="Detalles del repertorio, dress code, etc." placeholderTextColor={Colors.textSecondary}
            multiline textAlignVertical="top"
          />
        </View>

        <Pressable style={[styles.submitBtn, saving && { opacity: 0.6 }]} onPress={handleSubmit} disabled={saving}>
          {saving ? <ActivityIndicator color={Colors.dark} /> : (
            <><Feather name="send" size={16} color={Colors.dark} /><Text style={styles.submitText}>Enviar Solicitud</Text></>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark },
  musicianCard: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: Colors.primary + "50" },
  musicianAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: Colors.primary + "20", alignItems: "center", justifyContent: "center" },
  musicianName: { fontFamily: "Inter_600SemiBold", fontSize: 17, color: Colors.textPrimary },
  musicianInstruments: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.primary, marginTop: 2 },
  formTitle: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: Colors.textPrimary, marginBottom: 16 },
  field: { marginBottom: 16 },
  label: { fontFamily: "Inter_500Medium", fontSize: 12, color: Colors.textSecondary, marginBottom: 8 },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: Colors.surface, borderRadius: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: Colors.border },
  input: { flex: 1, paddingVertical: 12, fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.textPrimary },
  inputBox: { backgroundColor: Colors.surface, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.border },
  typeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface },
  typeChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  typeChipText: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.textSecondary },
  typeChipTextActive: { color: Colors.dark },
  submitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 16, marginTop: 8 },
  submitText: { fontFamily: "Inter_700Bold", fontSize: 16, color: Colors.dark },
});
