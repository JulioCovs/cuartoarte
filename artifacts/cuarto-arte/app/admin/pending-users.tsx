import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator, Alert, FlatList, Pressable, RefreshControl,
  StyleSheet, Text, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import Colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";

const BASE_URL = process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : "";

export default function PendingUsersScreen() {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { token } = useAuth();
  const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

  const { data: pending = [], isLoading, refetch } = useQuery({
    queryKey: ["pendingUsers"],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/api/auth/pending-users`, { headers: authHeader as any });
      if (!res.ok) throw new Error("Error al cargar pendientes");
      return res.json() as Promise<any[]>;
    },
    refetchInterval: 20000,
  });

  const handleAction = (pendingUser: any, action: "approve" | "reject") => {
    Alert.alert(
      action === "approve" ? "Aprobar músico" : "Rechazar solicitud",
      action === "approve"
        ? `¿Apruebas la cuenta de ${pendingUser.name}? Podrá iniciar sesión inmediatamente.`
        : `¿Rechazas la solicitud de ${pendingUser.name}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: action === "approve" ? "Aprobar" : "Rechazar",
          style: action === "reject" ? "destructive" : "default",
          onPress: async () => {
            const res = await fetch(`${BASE_URL}/api/auth/approve/${pendingUser.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json", ...authHeader },
              body: JSON.stringify({ action }),
            });
            if (res.ok) {
              qc.invalidateQueries({ queryKey: ["pendingUsers"] });
              Alert.alert(action === "approve" ? "✓ Aprobado" : "Rechazado", action === "approve" ? `${pendingUser.name} ya puede iniciar sesión.` : `Se rechazó la solicitud de ${pendingUser.name}.`);
            } else {
              Alert.alert("Error", "No se pudo procesar la solicitud");
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {isLoading ? (
        <View style={styles.center}><ActivityIndicator color={Colors.primary} size="large" /></View>
      ) : (
        <FlatList
          data={pending}
          keyExtractor={u => String(u.id)}
          refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={Colors.primary} />}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="check-circle" size={40} color={Colors.border} />
              <Text style={styles.emptyText}>No hay solicitudes pendientes</Text>
              <Text style={styles.emptySubtext}>Aquí aparecerán los músicos que soliciten registrarse</Text>
            </View>
          }
          ListHeaderComponent={
            <View style={styles.headerInfo}>
              <Feather name="info" size={14} color={Colors.primary} />
              <Text style={styles.headerInfoText}>Los músicos requieren tu aprobación antes de poder iniciar sesión en la app.</Text>
            </View>
          }
          renderItem={({ item: pendingItem }) => (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.avatar}><Feather name="music" size={20} color={Colors.primary} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{pendingItem.name}</Text>
                  <Text style={styles.email}>{pendingItem.email}</Text>
                  <Text style={styles.meta}>Solicitó el {pendingItem.createdAt?.slice(0, 10)}</Text>
                </View>
              </View>
              <View style={styles.actions}>
                <Pressable style={styles.rejectBtn} onPress={() => handleAction(pendingItem, "reject")}>
                  <Feather name="x" size={15} color="#E53935" />
                  <Text style={styles.rejectText}>Rechazar</Text>
                </Pressable>
                <Pressable style={styles.approveBtn} onPress={() => handleAction(pendingItem, "approve")}>
                  <Feather name="check" size={15} color={Colors.dark} />
                  <Text style={styles.approveText}>Aprobar</Text>
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
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerInfo: { flexDirection: "row", alignItems: "flex-start", gap: 8, backgroundColor: Colors.primary + "15", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: Colors.primary + "40", marginBottom: 16 },
  headerInfoText: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.textSecondary, flex: 1 },
  empty: { alignItems: "center", paddingTop: 60, gap: 8 },
  emptyText: { fontFamily: "Inter_500Medium", fontSize: 15, color: Colors.textPrimary },
  emptySubtext: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.textSecondary, textAlign: "center" },
  card: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border, gap: 12 },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary + "20", alignItems: "center", justifyContent: "center" },
  name: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: Colors.textPrimary },
  email: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.textSecondary },
  meta: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  actions: { flexDirection: "row", gap: 10 },
  rejectBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 11, borderRadius: 12, borderWidth: 1, borderColor: "#E53935" },
  rejectText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: "#E53935" },
  approveBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 11, borderRadius: 12, backgroundColor: Colors.primary },
  approveText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.dark },
});
