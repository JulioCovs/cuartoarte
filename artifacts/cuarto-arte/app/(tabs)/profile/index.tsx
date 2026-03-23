import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";

const ROLE_LABELS = {
  admin: "Administrador",
  client: "Cliente",
  musician: "Músico",
};

const ROLE_ICONS = {
  admin: "shield",
  client: "user",
  musician: "music",
};

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();

  const handleLogout = () => {
    Alert.alert("Cerrar sesión", "¿Deseas cerrar tu sesión?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Cerrar sesión", style: "destructive", onPress: logout },
    ]);
  };

  const role = (user?.role ?? "client") as "admin" | "client" | "musician";

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 }}
    >
      <View style={styles.avatarSection}>
        <View style={styles.avatarRing}>
          <Feather name={ROLE_ICONS[role] as any} size={36} color={Colors.primary} />
        </View>
        <Text style={styles.userName}>{user?.name}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>{ROLE_LABELS[role]}</Text>
        </View>
        <Text style={styles.userEmail}>{user?.email}</Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoCardTitle}>
          {role === "admin" ? "Información de cuenta" : role === "musician" ? "Mi Perfil de Músico" : "Mi Información"}
        </Text>
        <InfoRow icon="user" label="Nombre" value={user?.name ?? "-"} />
        <InfoRow icon="mail" label="Correo" value={user?.email ?? "-"} />
        {role === "client" && (
          <InfoRow icon="hash" label="ID de cliente" value={String(user?.clientId ?? "-")} />
        )}
        {role === "musician" && (
          <InfoRow icon="hash" label="ID de músico" value={String(user?.musicianId ?? "-")} />
        )}
        {role === "admin" && (
          <InfoRow icon="shield" label="Acceso" value="Sistema completo" />
        )}
      </View>

      <View style={styles.actionsCard}>
        <Text style={styles.actionsTitle}>Cuenta</Text>
        <Pressable style={styles.actionRow} onPress={handleLogout}>
          <View style={[styles.actionIconWrap, { backgroundColor: "#E5393510" }]}>
            <Feather name="log-out" size={16} color="#E53935" />
          </View>
          <Text style={[styles.actionLabel, { color: "#E53935" }]}>Cerrar sesión</Text>
          <Feather name="chevron-right" size={16} color="#E53935" />
        </Pressable>
      </View>

      <Text style={styles.versionText}>Cuarto Arte v1.0</Text>
    </ScrollView>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Feather name={icon as any} size={15} color={Colors.textSecondary} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark },
  avatarSection: { alignItems: "center", paddingBottom: 24 },
  avatarRing: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surface,
    marginBottom: 14,
  },
  userName: { fontFamily: "Inter_700Bold", fontSize: 22, color: Colors.textPrimary },
  roleBadge: {
    marginTop: 8,
    backgroundColor: Colors.primary + "20",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  roleBadgeText: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.primary },
  userEmail: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 6,
  },
  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoCardTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  infoLabel: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.textSecondary, flex: 1 },
  infoValue: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.textPrimary },
  actionsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionsTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 14,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },
  actionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: { fontFamily: "Inter_500Medium", fontSize: 14, flex: 1 },
  versionText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.border,
    textAlign: "center",
    paddingTop: 8,
  },
});
