import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable,
  ScrollView, StyleSheet, Text, TextInput, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import Colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente — esperando al músico",
  accepted: "Aceptada — pendiente de confirmar",
  rejected: "Rechazada por el músico",
  confirmed: "Confirmada",
  cancelled: "Cancelada",
};
const STATUS_COLORS: Record<string, string> = {
  pending: "#F5A623", accepted: "#4CAF50", rejected: "#E53935",
  confirmed: Colors.primary, cancelled: "#9A9A9A",
};

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  const baseUrl = domain ? `https://${domain}` : "";

  const { data: booking, isLoading, refetch } = useQuery({
    queryKey: ["booking", id],
    queryFn: async () => {
      const res = await fetch(`${baseUrl}/api/bookings/${id}`);
      if (!res.ok) throw new Error("Error al cargar solicitud");
      return res.json() as Promise<any>;
    },
  });

  // Admin confirm form state
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [fee, setFee] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const handleConfirm = async () => {
    if (!title.trim() || !price.trim()) {
      Alert.alert("Error", "El título y precio son requeridos");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${baseUrl}/api/bookings/${id}/confirm`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          totalAmount: parseFloat(price),
          musicianFee: fee ? parseFloat(fee) : undefined,
          adminNotes: adminNotes.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error("Error al confirmar");
      qc.invalidateQueries({ queryKey: ["adminBookings"] });
      qc.invalidateQueries({ queryKey: ["getEvents"] });
      const clientMsg = encodeURIComponent(`Hola, confirmamos tu evento *${title.trim()}*. El pago total es de $${parseFloat(price).toLocaleString("es-MX")} MXN. Nos comunicaremos con más detalles pronto. — Cuarto Arte`);
      const waUrl = `https://wa.me/528114845398?text=${clientMsg}`;
      Alert.alert(
        "✓ Evento Confirmado",
        `El evento "${title.trim()}" ha sido creado exitosamente.\n\n¿Deseas enviar notificación de WhatsApp al equipo?`,
        [
          { text: "Ahora no", style: "cancel", onPress: () => router.back() },
          {
            text: "Abrir WhatsApp",
            onPress: async () => {
              const { Linking } = await import("react-native");
              Linking.openURL(waUrl);
              router.back();
            },
          },
        ]
      );
    } catch {
      Alert.alert("Error", "No se pudo confirmar la solicitud");
    } finally {
      setSaving(false);
    }
  };

  const handleRespond = async (action: "accept" | "reject") => {
    Alert.alert(
      action === "accept" ? "Aceptar solicitud" : "Rechazar solicitud",
      action === "accept" ? "¿Confirmas que puedes asistir?" : "¿Confirmas que rechazas esta solicitud?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: action === "accept" ? "Aceptar" : "Rechazar",
          style: action === "accept" ? "default" : "destructive",
          onPress: async () => {
            const res = await fetch(`${baseUrl}/api/bookings/${id}/respond`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action }),
            });
            if (res.ok) {
              refetch();
              qc.invalidateQueries({ queryKey: ["musicianRequests"] });
            }
          },
        },
      ]
    );
  };

  if (isLoading || !booking) {
    return <View style={[styles.container, styles.center]}><ActivityIndicator color={Colors.primary} size="large" /></View>;
  }

  const statusColor = STATUS_COLORS[booking.status] ?? Colors.border;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }}>
        {/* Status banner */}
        <View style={[styles.statusBanner, { borderColor: statusColor }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>{STATUS_LABELS[booking.status] ?? booking.status}</Text>
        </View>

        {/* Event info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalles del Evento</Text>
          <InfoRow icon="tag" label="Tipo" value={booking.eventType} />
          <InfoRow icon="calendar" label="Fecha" value={`${booking.requestedDate} a las ${booking.requestedTime}`} />
          <InfoRow icon="map-pin" label="Lugar" value={booking.venue} />
          {booking.notes ? <InfoRow icon="message-square" label="Notas" value={booking.notes} /> : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cliente</Text>
          <InfoRow icon="user" label="Nombre" value={booking.clientName ?? "-"} />
          <InfoRow icon="phone" label="Teléfono" value={booking.clientPhone ?? "-"} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Músico</Text>
          <InfoRow icon="music" label="Nombre" value={booking.musicianName ?? "-"} />
          <InfoRow icon="headphones" label="Instrumentos" value={booking.musicianInstruments ?? "-"} />
          {booking.musicianSpecialty ? <InfoRow icon="star" label="Especialidad" value={booking.musicianSpecialty} /> : null}
        </View>

        {booking.musicianResponse ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Respuesta del Músico</Text>
            <Text style={styles.responseText}>{booking.musicianResponse}</Text>
          </View>
        ) : null}

        {/* Musician actions */}
        {user?.role === "musician" && booking.status === "pending" && (
          <View style={styles.actions}>
            <Pressable style={styles.rejectBtn} onPress={() => handleRespond("reject")}>
              <Feather name="x" size={16} color="#E53935" />
              <Text style={styles.rejectText}>Rechazar</Text>
            </Pressable>
            <Pressable style={styles.acceptBtn} onPress={() => handleRespond("accept")}>
              <Feather name="check" size={16} color={Colors.dark} />
              <Text style={styles.acceptText}>Aceptar</Text>
            </Pressable>
          </View>
        )}

        {/* Admin confirm form */}
        {user?.role === "admin" && booking.status === "accepted" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Confirmar y Crear Evento</Text>
            <Field label="Título del evento *" value={title} onChangeText={setTitle} placeholder="Ej: Boda García" />
            <Field label="Precio total (MXN) *" value={price} onChangeText={setPrice} placeholder="0.00" keyboard="decimal-pad" />
            <Field label="Honorarios del músico (MXN)" value={fee} onChangeText={setFee} placeholder="0.00" keyboard="decimal-pad" />
            <Field label="Notas adicionales" value={adminNotes} onChangeText={setAdminNotes} placeholder="Instrucciones especiales..." multiline />
            <Pressable style={[styles.confirmBtn, saving && { opacity: 0.6 }]} onPress={handleConfirm} disabled={saving}>
              {saving ? <ActivityIndicator color={Colors.dark} /> : (
                <><Feather name="check-circle" size={16} color={Colors.dark} /><Text style={styles.confirmText}>Confirmar y Crear Evento</Text></>
              )}
            </Pressable>
          </View>
        )}

        {booking.eventId && (
          <Pressable style={styles.viewEventBtn} onPress={() => router.push({ pathname: "/events/[id]", params: { id: booking.eventId } })}>
            <Feather name="calendar" size={15} color={Colors.primary} />
            <Text style={styles.viewEventText}>Ver evento creado</Text>
          </Pressable>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Feather name={icon as any} size={14} color={Colors.textSecondary} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function Field({ label, value, onChangeText, placeholder, keyboard, multiline }: any) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && { height: 70, textAlignVertical: "top" }]}
        value={value} onChangeText={onChangeText} placeholder={placeholder}
        placeholderTextColor={Colors.textSecondary} keyboardType={keyboard ?? "default"} multiline={multiline}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark },
  center: { justifyContent: "center", alignItems: "center" },
  statusBanner: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 16 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  section: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: Colors.border, gap: 6 },
  sectionTitle: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: Colors.textPrimary, marginBottom: 8 },
  infoRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingVertical: 4 },
  infoLabel: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.textSecondary, width: 90 },
  infoValue: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.textPrimary, flex: 1 },
  responseText: { fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.textSecondary, fontStyle: "italic" },
  actions: { flexDirection: "row", gap: 12, marginBottom: 16 },
  rejectBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: "#E53935" },
  rejectText: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: "#E53935" },
  acceptBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 14, borderRadius: 14, backgroundColor: "#4CAF50" },
  acceptText: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: Colors.dark },
  fieldLabel: { fontFamily: "Inter_500Medium", fontSize: 12, color: Colors.textSecondary, marginBottom: 6 },
  input: { backgroundColor: Colors.dark, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.border },
  confirmBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 14, marginTop: 4 },
  confirmText: { fontFamily: "Inter_700Bold", fontSize: 15, color: Colors.dark },
  viewEventBtn: { flexDirection: "row", alignItems: "center", gap: 8, justifyContent: "center", paddingVertical: 12 },
  viewEventText: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.primary },
});
