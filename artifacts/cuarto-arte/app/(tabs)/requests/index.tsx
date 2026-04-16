import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  ActivityIndicator, Alert, FlatList, Pressable, RefreshControl,
  StyleSheet, Text, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import Colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";

export default function MusicianRequestsScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  const baseUrl = domain ? `https://${domain}` : "";

  const { data: requests = [], isLoading, refetch } = useQuery({
    queryKey: ["musicianRequests", user?.musicianId],
    enabled: !!user?.musicianId,
    queryFn: async () => {
      const res = await fetch(`${baseUrl}/api/bookings?musicianId=${user!.musicianId}&status=pending`);
      if (!res.ok) throw new Error("Error al cargar solicitudes");
      return res.json() as Promise<any[]>;
    },
    refetchInterval: 20000,
  });

  const respond = async (id: number, action: "accept" | "reject") => {
    try {
      const res = await fetch(`${baseUrl}/api/bookings/${id}/respond`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error("Error al responder");
      qc.invalidateQueries({ queryKey: ["musicianRequests"] });
      Alert.alert(
        action === "accept" ? "✓ Solicitud aceptada" : "Solicitud rechazada",
        action === "accept" ? "El administrador será notificado para confirmar el evento." : "El cliente será notificado."
      );
    } catch {
      Alert.alert("Error", "No se pudo procesar la respuesta");
    }
  };

  const confirmAction = (id: number, action: "accept" | "reject") => {
    Alert.alert(
      action === "accept" ? "Aceptar solicitud" : "Rechazar solicitud",
      action === "accept"
        ? "¿Confirmas que puedes asistir a este evento?"
        : "¿Confirmas que rechazas esta solicitud?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: action === "accept" ? "Aceptar" : "Rechazar", style: action === "accept" ? "default" : "destructive", onPress: () => respond(id, action) },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Solicitudes Pendientes</Text>
        <Text style={styles.subtitle}>Clientes que quieren contratarte</Text>
      </View>

      {isLoading ? (
        <View style={styles.center}><ActivityIndicator color={Colors.primary} size="large" /></View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(r) => String(r.id)}
          refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={Colors.primary} />}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 100 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="inbox" size={40} color={Colors.border} />
              <Text style={styles.emptyText}>No tienes solicitudes pendientes</Text>
              <Text style={styles.emptySubtext}>Cuando un cliente solicite tu contratación aparecerá aquí</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.clientRow}>
                <View style={styles.clientAvatar}><Feather name="user" size={18} color={Colors.primary} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.clientName}>{item.clientName}</Text>
                  <Text style={styles.clientPhone}>{item.clientPhone}</Text>
                </View>
                <Text style={styles.reqDate}>{item.createdAt?.slice(0, 10)}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.detailRow}><Feather name="tag" size={13} color={Colors.textSecondary} /><Text style={styles.detailText}>{item.eventType}</Text></View>
              <View style={styles.detailRow}><Feather name="calendar" size={13} color={Colors.textSecondary} /><Text style={styles.detailText}>{item.requestedDate} a las {item.requestedTime}</Text></View>
              <View style={styles.detailRow}><Feather name="map-pin" size={13} color={Colors.textSecondary} /><Text style={styles.detailText}>{item.venue}</Text></View>
              {item.notes ? <View style={styles.detailRow}><Feather name="message-square" size={13} color={Colors.textSecondary} /><Text style={styles.detailText}>{item.notes}</Text></View> : null}

              <View style={styles.actions}>
                <Pressable style={styles.rejectBtn} onPress={() => confirmAction(item.id, "reject")}>
                  <Feather name="x" size={16} color="#E53935" />
                  <Text style={styles.rejectText}>Rechazar</Text>
                </Pressable>
                <Pressable style={styles.acceptBtn} onPress={() => confirmAction(item.id, "accept")}>
                  <Feather name="check" size={16} color={Colors.dark} />
                  <Text style={styles.acceptText}>Aceptar</Text>
                </Pressable>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark },
  header: { paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title: { fontFamily: "Inter_700Bold", fontSize: 22, color: Colors.textPrimary },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  empty: { alignItems: "center", paddingTop: 60, gap: 8 },
  emptyText: { fontFamily: "Inter_500Medium", fontSize: 15, color: Colors.textPrimary },
  emptySubtext: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.textSecondary, textAlign: "center" },
  card: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: Colors.border, gap: 8 },
  clientRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  clientAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary + "20", alignItems: "center", justifyContent: "center" },
  clientName: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: Colors.textPrimary },
  clientPhone: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textSecondary },
  reqDate: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.textSecondary },
  divider: { height: 1, backgroundColor: Colors.border },
  detailRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  detailText: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.textSecondary, flex: 1 },
  actions: { flexDirection: "row", gap: 10, marginTop: 4 },
  rejectBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 11, borderRadius: 12, borderWidth: 1, borderColor: "#E53935" },
  rejectText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: "#E53935" },
  acceptBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 11, borderRadius: 12, backgroundColor: "#4CAF50" },
  acceptText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.dark },
});
