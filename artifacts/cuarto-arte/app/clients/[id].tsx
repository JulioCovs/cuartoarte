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

import { useGetClient, useDeleteClient, useGetEvents } from "@workspace/api-client-react";
import Colors from "@/constants/colors";
import { useQueryClient } from "@tanstack/react-query";

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Feather name={icon as any} size={15} color={Colors.primary} />
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const clientId = parseInt(id!);

  const { data: client, isLoading } = useGetClient(clientId);
  const { data: allEvents } = useGetEvents({});
  const deleteClient = useDeleteClient();

  const clientEvents = (allEvents ?? []).filter((e) => e.clientId === clientId);

  useEffect(() => {
    if (client) {
      navigation.setOptions({
        title: client.name,
        headerRight: () => (
          <View style={{ flexDirection: "row", gap: 12, marginRight: 4 }}>
            <Pressable onPress={() => router.push({ pathname: "/clients/create", params: { editId: id } })}>
              <Feather name="edit-2" size={20} color={Colors.primary} />
            </Pressable>
            <Pressable onPress={handleDelete}>
              <Feather name="trash-2" size={20} color={Colors.error} />
            </Pressable>
          </View>
        ),
      });
    }
  }, [client]);

  const handleDelete = () => {
    Alert.alert("Eliminar Cliente", "¿Estás seguro de eliminar este cliente?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          await deleteClient.mutateAsync(clientId);
          queryClient.invalidateQueries({ queryKey: ["getClients"] });
          router.back();
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  if (!client) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Cliente no encontrado</Text>
      </View>
    );
  }

  const initials = client.name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>{client.name}</Text>
        <Text style={styles.since}>
          Cliente desde {new Date(client.createdAt).toLocaleDateString("es-MX", { month: "long", year: "numeric" })}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Información de Contacto</Text>
        <InfoRow icon="phone" label="Teléfono" value={client.phone} />
        {client.email ? <InfoRow icon="mail" label="Email" value={client.email} /> : null}
        {client.address ? <InfoRow icon="map-pin" label="Dirección" value={client.address} /> : null}
        {client.notes ? <InfoRow icon="file-text" label="Notas" value={client.notes} /> : null}
      </View>

      {clientEvents.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Eventos ({clientEvents.length})</Text>
          {clientEvents.map((e) => (
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
  since: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
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
