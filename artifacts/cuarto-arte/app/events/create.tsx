import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  useCreateEvent,
  useUpdateEvent,
  useGetEvent,
  useGetClients,
  useGetMusicians,
} from "@workspace/api-client-react";
import Colors from "@/constants/colors";
import { useQueryClient } from "@tanstack/react-query";

const STATUS_OPTIONS = ["pendiente", "confirmado", "completado", "cancelado"];
const EVENT_TYPES = ["Boda", "Quinceañera", "Cumpleaños", "Corporativo", "Festival", "Concierto", "Graduación", "Otro"];

function OptionPicker({
  label, options, value, onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 2 }}>
        {options.map((opt) => (
          <Pressable
            key={opt}
            style={[styles.chip, value === opt && styles.chipActive]}
            onPress={() => onChange(opt)}
          >
            <Text style={[styles.chipText, value === opt && styles.chipTextActive]}>{opt}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

function Input({
  value, onChangeText, placeholder, keyboardType, multiline,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: any;
  multiline?: boolean;
}) {
  return (
    <TextInput
      style={[styles.input, multiline && { height: 80, textAlignVertical: "top" }]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={Colors.textSecondary}
      keyboardType={keyboardType}
      multiline={multiline}
    />
  );
}

export default function CreateEventScreen() {
  const { editId, eventId: prefillEventId } = useLocalSearchParams<{ editId?: string; eventId?: string }>();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const isEditing = !!editId;

  const { data: existingEvent } = useGetEvent(editId ? parseInt(editId) : 0, {
    query: { enabled: isEditing },
  });
  const { data: clients } = useGetClients();
  const { data: musicians } = useGetMusicians();

  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [venue, setVenue] = useState("");
  const [eventType, setEventType] = useState("Boda");
  const [status, setStatus] = useState("pendiente");
  const [totalAmount, setTotalAmount] = useState("");
  const [advanceAmount, setAdvanceAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [selectedMusicianIds, setSelectedMusicianIds] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existingEvent && isEditing) {
      setTitle(existingEvent.title ?? "");
      setDate(existingEvent.date ?? "");
      setTime(existingEvent.time ?? "");
      setVenue(existingEvent.venue ?? "");
      setEventType(existingEvent.eventType ?? "Boda");
      setStatus(existingEvent.status ?? "pendiente");
      setTotalAmount(String(existingEvent.totalAmount ?? ""));
      setAdvanceAmount(String(existingEvent.advanceAmount ?? ""));
      setNotes(existingEvent.notes ?? "");
      setSelectedClientId(existingEvent.clientId ?? null);
      setSelectedMusicianIds((existingEvent.musicians ?? []).map((m: any) => m.musicianId));
    }
  }, [existingEvent, isEditing]);

  const toggleMusician = (id: number) => {
    setSelectedMusicianIds((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (!title.trim() || !date.trim() || !time.trim() || !venue.trim()) {
      Alert.alert("Error", "Completa los campos obligatorios: nombre, fecha, hora y lugar");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        clientId: selectedClientId,
        date: date.trim(),
        time: time.trim(),
        venue: venue.trim(),
        eventType,
        status,
        totalAmount: parseFloat(totalAmount) || 0,
        advanceAmount: parseFloat(advanceAmount) || 0,
        notes: notes.trim() || null,
        musicianIds: selectedMusicianIds,
      };
      if (isEditing) {
        await updateEvent.mutateAsync({ id: parseInt(editId!), data: payload });
      } else {
        await createEvent.mutateAsync({ data: payload });
      }
      queryClient.invalidateQueries({ queryKey: ["getEvents"] });
      queryClient.invalidateQueries({ queryKey: ["getReportSummary"] });
      router.back();
    } catch (err) {
      Alert.alert("Error", "No se pudo guardar el evento");
    } finally {
      setSaving(false);
    }
  };

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 16;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 16, paddingBottom: bottomPad + 80 }}
      keyboardShouldPersistTaps="handled"
    >
      <Field label="Nombre del evento *">
        <Input value={title} onChangeText={setTitle} placeholder="Boda García-López" />
      </Field>

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Field label="Fecha *">
            <Input value={date} onChangeText={setDate} placeholder="2025-06-15" />
          </Field>
        </View>
        <View style={{ flex: 1 }}>
          <Field label="Hora *">
            <Input value={time} onChangeText={setTime} placeholder="19:00" />
          </Field>
        </View>
      </View>

      <Field label="Lugar *">
        <Input value={venue} onChangeText={setVenue} placeholder="Salón Versalles, CDMX" />
      </Field>

      <OptionPicker label="Tipo de evento" options={EVENT_TYPES} value={eventType} onChange={setEventType} />
      <OptionPicker label="Estado" options={STATUS_OPTIONS} value={status} onChange={setStatus} />

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Field label="Total ($)">
            <Input value={totalAmount} onChangeText={setTotalAmount} placeholder="0.00" keyboardType="decimal-pad" />
          </Field>
        </View>
        <View style={{ flex: 1 }}>
          <Field label="Anticipo ($)">
            <Input value={advanceAmount} onChangeText={setAdvanceAmount} placeholder="0.00" keyboardType="decimal-pad" />
          </Field>
        </View>
      </View>

      {/* Client selector */}
      <View style={styles.field}>
        <Text style={styles.label}>Cliente</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 2 }}>
          <Pressable
            style={[styles.chip, selectedClientId === null && styles.chipActive]}
            onPress={() => setSelectedClientId(null)}
          >
            <Text style={[styles.chipText, selectedClientId === null && styles.chipTextActive]}>Ninguno</Text>
          </Pressable>
          {(clients ?? []).map((c) => (
            <Pressable
              key={c.id}
              style={[styles.chip, selectedClientId === c.id && styles.chipActive]}
              onPress={() => setSelectedClientId(c.id)}
            >
              <Text style={[styles.chipText, selectedClientId === c.id && styles.chipTextActive]}>
                {c.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Musicians selector */}
      <View style={styles.field}>
        <Text style={styles.label}>Músicos ({selectedMusicianIds.length} seleccionados)</Text>
        <View style={styles.musicianGrid}>
          {(musicians ?? []).map((m) => {
            const selected = selectedMusicianIds.includes(m.id);
            return (
              <Pressable
                key={m.id}
                style={[styles.musicianChip, selected && styles.musicianChipActive]}
                onPress={() => toggleMusician(m.id)}
              >
                <Feather name="music" size={12} color={selected ? Colors.dark : Colors.textSecondary} />
                <Text style={[styles.musicianChipText, selected && styles.musicianChipTextActive]}>
                  {m.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Field label="Notas">
        <Input value={notes} onChangeText={setNotes} placeholder="Notas adicionales..." multiline />
      </Field>

      <Pressable
        style={[styles.saveBtn, saving && { opacity: 0.6 }]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color={Colors.dark} />
        ) : (
          <>
            <Feather name="check" size={18} color={Colors.dark} />
            <Text style={styles.saveBtnText}>{isEditing ? "Guardar Cambios" : "Crear Evento"}</Text>
          </>
        )}
      </Pressable>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark,
  },
  field: {
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  label: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.textSecondary,
    textTransform: "capitalize",
  },
  chipTextActive: {
    color: Colors.dark,
  },
  musicianGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  musicianChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  musicianChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  musicianChipText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.textSecondary,
  },
  musicianChipTextActive: {
    color: Colors.dark,
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 8,
  },
  saveBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.dark,
  },
});
