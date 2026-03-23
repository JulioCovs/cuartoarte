import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import React, { useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useGetMusician, useDeleteMusician, useGetEvents } from "@workspace/api-client-react";
import Colors from "@/constants/colors";
import { useQueryClient } from "@tanstack/react-query";

export default function MusicianDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const musicianId = parseInt(id!);

  const { data: musician, isLoading } = useGetMusician(musicianId);
  const { data: allEvents } = useGetEvents({});
  const deleteMusician = useDeleteMusician();

  const musicianEvents = (allEvents ?? []).filter(
    (e) => e.musicians?.some((m: any) => m.musicianId === musicianId)
  );

  useEffect(() => {
    if (musician) {
      navigation.setOptions({
        title: musician.name,
        headerRight: () => (
          <View style={{ flexDirection: "row", gap: 12, marginRight: 4 }}>
            <Pressable onPress={() => router.push({ pathname: "/musicians/create", params: { editId: id } })}>
              <Feather name="edit-2" size={20} color={Colors.primary} />
            </Pressable>
            <Pressable onPress={handleDelete}>
              <Feather name="trash-2" size={20} color={Colors.error} />
            </Pressable>
          </View>
        ),
      });
    }
  }, [musician]);

  const handleDelete = () => {
    Alert.alert("Eliminar Músico", "¿Estás seguro de eliminar este músico?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          await deleteMusician.mutateAsync(musicianId);
          queryClient.invalidateQueries({ queryKey: ["getMusicians"] });
          router.back();
        },
      },
    ]);
  };

  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator color={Colors.primary} /></View>;
  }
  if (!musician) {
    return <View style={styles.centered}><Text style={styles.errorText}>Músico no encontrado</Text></View>;
  }

  const initials = musician.name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>{musician.name}</Text>
        <View style={styles.instrumentBadge}>
          <Feather name="music" size={14} color={Colors.primary} />
          <Text style={styles.instruments}>{musician.instruments}</Text>
        </View>
        {musician.specialty ? (
          <Text style={styles.specialty}>{musician.specialty}</Text>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Información</Text>
        <View style={styles.infoRow}>
          <Feather name="phone" size={15} color={Colors.primary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Teléfono</Text>
            <Text style={styles.infoValue}>{musician.phone}</Text>
          </View>
        </View>
        {musician.email ? (
          <View style={styles.infoRow}>
            <Feather name="mail" size={15} color={Colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{musician.email}</Text>
            </View>
          </View>
        ) : null}
        {musician.rate != null ? (
          <View style={styles.infoRow}>
            <Feather name="dollar-sign" size={15} color={Colors.success} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Tarifa por evento</Text>
              <Text style={[styles.infoValue, { color: Colors.success }]}>
                ${musician.rate.toLocaleString("es-MX")}
              </Text>
            </View>
          </View>
        ) : null}
        {musician.notes ? (
          <View style={styles.infoRow}>
            <Feather name="file-text" size={15} color={Colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Notas</Text>
              <Text style={styles.infoValue}>{musician.notes}</Text>
            </View>
          </View>
        ) : null}
      </View>

      {musicianEvents.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Eventos ({musicianEvents.length})</Text>
          {musicianEvents.map((e) => (
            <Pressable
              key={e.id}
              style={styles.eventRow}
              onPress={() => router.push({ pathname: "/events/[id]", params: { id: e.id } })}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.eventTitle}>{e.title}</Text>
                <Text style={styles.eventMeta}>{e.date} · {e.venue}</Text>
              </View>
              <Feather name="chevron-right" size={16} color={Colors.border} />
            </Pressable>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.dark },
  errorText: { fontFamily: "Inter_400Regular", fontSize: 16, color: Colors.textSecondary },
  avatarSection: { alignItems: "center", paddingVertical: 24 },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: Colors.primary + "33",
    alignItems: "center", justifyContent: "center", marginBottom: 12,
  },
  avatarText: { fontFamily: "Inter_700Bold", fontSize: 28, color: Colors.primary },
  name: { fontFamily: "Inter_700Bold", fontSize: 22, color: Colors.textPrimary },
  instrumentBadge: {
    flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6,
  },
  instruments: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.primary },
  specialty: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  card: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16,
    marginHorizontal: 16, marginBottom: 12,
  },
  cardTitle: {
    fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.textSecondary,
    marginBottom: 14, textTransform: "uppercase", letterSpacing: 0.5,
  },
  infoRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 12 },
  infoContent: { flex: 1 },
  infoLabel: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.textSecondary },
  infoValue: { fontFamily: "Inter_500Medium", fontSize: 15, color: Colors.textPrimary, marginTop: 1 },
  eventRow: {
    flexDirection: "row", alignItems: "center", paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 10,
  },
  eventTitle: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.textPrimary },
  eventMeta: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textSecondary },
});
