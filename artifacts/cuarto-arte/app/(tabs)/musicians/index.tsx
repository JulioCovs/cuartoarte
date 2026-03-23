import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useGetMusicians } from "@workspace/api-client-react";
import Colors from "@/constants/colors";

function MusicianCard({ musician }: { musician: any }) {
  const initials = musician.name
    .split(" ")
    .slice(0, 2)
    .map((w: string) => w[0])
    .join("")
    .toUpperCase();

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.7 }]}
      onPress={() => router.push({ pathname: "/musicians/[id]", params: { id: musician.id } })}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardName}>{musician.name}</Text>
        <View style={styles.instrumentBadge}>
          <Feather name="music" size={11} color={Colors.primary} />
          <Text style={styles.instrumentText} numberOfLines={1}>
            {musician.instruments}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <Feather name="phone" size={12} color={Colors.textSecondary} />
          <Text style={styles.metaText}>{musician.phone}</Text>
          {musician.rate != null && (
            <>
              <Text style={styles.metaSep}>·</Text>
              <Text style={[styles.metaText, { color: Colors.success }]}>
                ${musician.rate.toLocaleString("es-MX")}
              </Text>
            </>
          )}
        </View>
      </View>
      <Feather name="chevron-right" size={18} color={Colors.border} />
    </Pressable>
  );
}

export default function MusiciansScreen() {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const { data: musicians, isLoading, refetch } = useGetMusicians();

  const filtered = (musicians ?? []).filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.instruments.toLowerCase().includes(search.toLowerCase())
  );

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom + 80;

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Músicos</Text>
        <Pressable style={styles.addBtn} onPress={() => router.push("/musicians/create")}>
          <Feather name="plus" size={20} color={Colors.dark} />
        </Pressable>
      </View>

      <View style={styles.searchBar}>
        <Feather name="search" size={16} color={Colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nombre o instrumento..."
          placeholderTextColor={Colors.textSecondary}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch("")}>
            <Feather name="x" size={16} color={Colors.textSecondary} />
          </Pressable>
        )}
      </View>

      {isLoading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <MusicianCard musician={item} />}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: bottomPadding }}
          onRefresh={refetch}
          refreshing={isLoading}
          scrollEnabled={!!(filtered.length > 0)}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="music" size={48} color={Colors.border} />
              <Text style={styles.emptyTitle}>{search ? "Sin resultados" : "Sin músicos"}</Text>
              <Text style={styles.emptyText}>
                {search ? "Prueba con otra búsqueda" : "Toca + para agregar un músico"}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    color: Colors.textPrimary,
  },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.textPrimary,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary + "33",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarText: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.primary,
  },
  cardContent: {
    flex: 1,
    gap: 4,
  },
  cardName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.textPrimary,
  },
  instrumentBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  instrumentText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.primary,
    flex: 1,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  metaText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textSecondary,
  },
  metaSep: {
    color: Colors.border,
    fontSize: 12,
  },
  empty: {
    alignItems: "center",
    paddingTop: 60,
    gap: 8,
  },
  emptyTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  emptyText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
