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
  useCreateClient,
  useUpdateClient,
  useGetClient,
} from "@workspace/api-client-react";
import Colors from "@/constants/colors";
import { useQueryClient } from "@tanstack/react-query";

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

export default function CreateClientScreen() {
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const isEditing = !!editId;

  const { data: existingClient } = useGetClient(editId ? parseInt(editId) : 0, {
    query: { enabled: isEditing },
  });

  const createClient = useCreateClient();
  const updateClient = useUpdateClient();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existingClient && isEditing) {
      setName(existingClient.name ?? "");
      setPhone(existingClient.phone ?? "");
      setEmail(existingClient.email ?? "");
      setAddress(existingClient.address ?? "");
      setNotes(existingClient.notes ?? "");
    }
  }, [existingClient, isEditing]);

  const handleSave = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert("Error", "El nombre y teléfono son obligatorios");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || null,
        address: address.trim() || null,
        notes: notes.trim() || null,
      };
      if (isEditing) {
        await updateClient.mutateAsync({ id: parseInt(editId!), data: payload });
      } else {
        await createClient.mutateAsync({ data: payload });
      }
      queryClient.invalidateQueries({ queryKey: ["getClients"] });
      router.back();
    } catch (err) {
      Alert.alert("Error", "No se pudo guardar el cliente");
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
        <Input value={name} onChangeText={setName} placeholder="María García" />
      </Field>
      <Field label="Teléfono *">
        <Input value={phone} onChangeText={setPhone} placeholder="+52 55 1234 5678" keyboardType="phone-pad" />
      </Field>
      <Field label="Email">
        <Input value={email} onChangeText={setEmail} placeholder="maria@email.com" keyboardType="email-address" />
      </Field>
      <Field label="Dirección">
        <Input value={address} onChangeText={setAddress} placeholder="Calle, Colonia, Ciudad" />
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
            <Text style={styles.saveBtnText}>{isEditing ? "Guardar Cambios" : "Agregar Cliente"}</Text>
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
  saveBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: Colors.dark },
});
