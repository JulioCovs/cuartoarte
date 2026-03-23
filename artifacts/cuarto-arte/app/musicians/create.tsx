import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  useCreateMusician,
  useUpdateMusician,
  useGetMusician,
} from "@workspace/api-client-react";
import Colors from "@/constants/colors";
import { useQueryClient } from "@tanstack/react-query";

const INSTRUMENT_OPTIONS = [
  "Piano", "Guitarra", "Violín", "Viola", "Cello", "Contrabajo",
  "Trompeta", "Trombón", "Saxofón", "Flauta", "Clarinete", "Oboe",
  "Batería", "Percusión", "Voz", "Coro", "DJ", "Acordeón", "Arpa", "Otro",
];

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

export default function CreateMusicianScreen() {
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const isEditing = !!editId;

  const { data: existingMusician } = useGetMusician(editId ? parseInt(editId) : 0, {
    query: { enabled: isEditing },
  });

  const createMusician = useCreateMusician();
  const updateMusician = useUpdateMusician();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [instruments, setInstruments] = useState("");
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>([]);
  const [specialty, setSpecialty] = useState("");
  const [rate, setRate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existingMusician && isEditing) {
      setName(existingMusician.name ?? "");
      setPhone(existingMusician.phone ?? "");
      setEmail(existingMusician.email ?? "");
      setInstruments(existingMusician.instruments ?? "");
      setSpecialty(existingMusician.specialty ?? "");
      setRate(existingMusician.rate != null ? String(existingMusician.rate) : "");
      setNotes(existingMusician.notes ?? "");
      const instList = existingMusician.instruments.split(", ").filter((i) => INSTRUMENT_OPTIONS.includes(i));
      setSelectedInstruments(instList);
    }
  }, [existingMusician, isEditing]);

  const toggleInstrument = (inst: string) => {
    const updated = selectedInstruments.includes(inst)
      ? selectedInstruments.filter((i) => i !== inst)
      : [...selectedInstruments, inst];
    setSelectedInstruments(updated);
    setInstruments(updated.join(", "));
  };

  const handleSave = async () => {
    if (!name.trim() || !phone.trim() || !instruments.trim()) {
      Alert.alert("Error", "Nombre, teléfono e instrumentos son obligatorios");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || null,
        instruments: instruments.trim(),
        specialty: specialty.trim() || null,
        rate: rate.trim() ? parseFloat(rate) : null,
        notes: notes.trim() || null,
      };
      if (isEditing) {
        await updateMusician.mutateAsync({ id: parseInt(editId!), data: payload });
      } else {
        await createMusician.mutateAsync({ data: payload });
      }
      queryClient.invalidateQueries({ queryKey: ["getMusicians"] });
      router.back();
    } catch (err) {
      Alert.alert("Error", "No se pudo guardar el músico");
    } finally {
      setSaving(false);
    }
  };

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 16;

  return (
    <KeyboardAwareScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 16, paddingBottom: bottomPad + 60 }}
      keyboardShouldPersistTaps="handled"
      bottomOffset={60}
    >
      <Field label="Nombre *">
        <Input value={name} onChangeText={setName} placeholder="Carlos Ramírez" />
      </Field>
      <Field label="Teléfono *">
        <Input value={phone} onChangeText={setPhone} placeholder="+52 55 9876 5432" keyboardType="phone-pad" />
      </Field>
      <Field label="Email">
        <Input value={email} onChangeText={setEmail} placeholder="carlos@email.com" keyboardType="email-address" />
      </Field>

      <View style={styles.field}>
        <Text style={styles.label}>Instrumentos * ({selectedInstruments.length} seleccionados)</Text>
        <View style={styles.instrumentGrid}>
          {INSTRUMENT_OPTIONS.map((inst) => {
            const selected = selectedInstruments.includes(inst);
            return (
              <Pressable
                key={inst}
                style={[styles.chip, selected && styles.chipActive]}
                onPress={() => toggleInstrument(inst)}
              >
                <Text style={[styles.chipText, selected && styles.chipTextActive]}>{inst}</Text>
              </Pressable>
            );
          })}
        </View>
        {/* Manual override */}
        <TextInput
          style={[styles.input, { marginTop: 8 }]}
          value={instruments}
          onChangeText={(v) => {
            setInstruments(v);
            setSelectedInstruments([]);
          }}
          placeholder="O escribe manualmente..."
          placeholderTextColor={Colors.textSecondary}
        />
      </View>

      <Field label="Especialidad">
        <Input value={specialty} onChangeText={setSpecialty} placeholder="Música clásica, Jazz, etc." />
      </Field>
      <Field label="Tarifa por evento ($)">
        <Input value={rate} onChangeText={setRate} placeholder="0.00" keyboardType="decimal-pad" />
      </Field>
      <Field label="Notas">
        <Input value={notes} onChangeText={setNotes} placeholder="Información adicional..." multiline />
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
            <Text style={styles.saveBtnText}>{isEditing ? "Guardar Cambios" : "Agregar Músico"}</Text>
          </>
        )}
      </Pressable>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark },
  field: { marginBottom: 16 },
  label: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.textSecondary, marginBottom: 8 },
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
  instrumentGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.textSecondary },
  chipTextActive: { color: Colors.dark },
  saveBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, backgroundColor: Colors.primary, borderRadius: 14,
    paddingVertical: 16, marginTop: 8,
  },
  saveBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: Colors.dark },
});
