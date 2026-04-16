import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator, FlatList, Pressable, StyleSheet,
  Text, TextInput, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";

import Colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";

function useMusicians() {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  const baseUrl = domain ? `https://${domain}` : "";
  return useQuery({
    queryKey: ["musiciansForClient"],
    queryFn: async () => {
      const res = await fetch(`${baseUrl}/api/musicians`);
      if (!res.ok) throw new Error("Error al cargar músicos");
      return res.json() as Promise<any[]>;
    },
  });
}

export default function CatalogScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const { data: musicians = [], isLoading } = useMusicians();

  const filtered = musicians.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.instruments.toLowerCase().includes(search.toLowerCase()) ||
    (m.specialty ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Catálogo de Músicos</Text>
        <Text style={styles.subtitle}>Selecciona un músico para solicitar contratación</Text>
      </View>

      <View style={styles.searchWrap}>
        <Feather name="search" size={16} color={Colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar por nombre o instrumento..."
          placeholderTextColor={Colors.textSecondary}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch("")}><Feather name="x" size={16} color={Colors.textSecondary} /></Pressable>
        )}
      </View>

      {isLoading ? (
        <View style={styles.center}><ActivityIndicator color={Colors.primary} size="large" /></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(m) => String(m.id)}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 100 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="music" size={40} color={Colors.border} />
              <Text style={styles.emptyText}>No se encontraron músicos</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.avatar}>
                  <Feather name="music" size={22} color={Colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.instruments}>{item.instruments}</Text>
                  {item.specialty ? <Text style={styles.specialty}>{item.specialty}</Text> : null}
                </View>
                {item.rate && (
                  <View style={styles.rateBadge}>
                    <Text style={styles.rateText}>${parseFloat(item.rate).toLocaleString("es-MX")}</Text>
                    <Text style={styles.rateLabel}>/evento</Text>
                  </View>
                )}
              </View>
              <Pressable
                style={styles.requestBtn}
                onPress={() => router.push({
                  pathname: "/bookings/request",
                  params: { musicianId: item.id, musicianName: item.name, instruments: item.instruments, clientId: user?.clientId },
                })}
              >
                <Feather name="send" size={15} color={Colors.dark} />
                <Text style={styles.requestBtnText}>Solicitar Contratación</Text>
              </Pressable>
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
  searchWrap: {
    flexDirection: "row", alignItems: "center", gap: 10,
    margin: 16, backgroundColor: Colors.surface, borderRadius: 12,
    paddingHorizontal: 14, borderWidth: 1, borderColor: Colors.border,
  },
  searchInput: { flex: 1, paddingVertical: 12, fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.textPrimary },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.textSecondary },
  card: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border, gap: 12 },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.primary + "20", alignItems: "center", justifyContent: "center" },
  name: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: Colors.textPrimary },
  instruments: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.primary },
  specialty: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  rateBadge: { alignItems: "flex-end" },
  rateText: { fontFamily: "Inter_700Bold", fontSize: 16, color: Colors.primary },
  rateLabel: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.textSecondary },
  requestBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 12,
  },
  requestBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.dark },
});
