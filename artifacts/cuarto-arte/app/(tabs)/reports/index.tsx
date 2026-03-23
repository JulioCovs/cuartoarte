import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useGetIncomeReport, useGetReportSummary, useGetPayments } from "@workspace/api-client-react";
import Colors from "@/constants/colors";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CHART_WIDTH = SCREEN_WIDTH - 32;
const CHART_HEIGHT = 160;

const GROUP_OPTIONS = [
  { key: "day", label: "Diario" },
  { key: "week", label: "Semanal" },
  { key: "month", label: "Mensual" },
] as const;
type GroupBy = "day" | "week" | "month";

function BarChart({ data }: { data: Array<{ label: string; amount: number }> }) {
  if (!data || data.length === 0) {
    return (
      <View style={styles.chartEmpty}>
        <Text style={styles.chartEmptyText}>Sin datos para mostrar</Text>
      </View>
    );
  }
  const max = Math.max(...data.map((d) => d.amount), 1);
  const barWidth = Math.max(16, Math.min(40, (CHART_WIDTH - 32) / data.length - 6));

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chart}>
      {data.map((item, idx) => {
        const height = Math.max(4, (item.amount / max) * CHART_HEIGHT);
        return (
          <View key={idx} style={styles.barCol}>
            <Text style={styles.barAmount}>
              {item.amount >= 1000 ? `$${(item.amount / 1000).toFixed(1)}k` : `$${item.amount.toFixed(0)}`}
            </Text>
            <View style={styles.barBg}>
              <View style={[styles.bar, { height, width: barWidth }]} />
            </View>
            <Text style={styles.barLabel} numberOfLines={1}>
              {item.label.length > 6 ? item.label.slice(5) : item.label}
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

function PaymentRow({ payment }: { payment: any }) {
  const typeColor = {
    anticipo: Colors.warning,
    pago_total: Colors.success,
    pago_parcial: Colors.info,
  }[payment.type as string] ?? Colors.textSecondary;

  const methodIcon = {
    efectivo: "dollar-sign",
    transferencia: "credit-card",
    cheque: "file-text",
    otro: "help-circle",
  }[payment.method as string] ?? "circle";

  return (
    <View style={styles.paymentRow}>
      <View style={[styles.paymentIcon, { backgroundColor: typeColor + "22" }]}>
        <Feather name={methodIcon as any} size={14} color={typeColor} />
      </View>
      <View style={styles.paymentInfo}>
        <Text style={styles.paymentTitle} numberOfLines={1}>
          {payment.eventTitle ?? "Evento"}
        </Text>
        <Text style={styles.paymentMeta}>
          {payment.date} · {payment.type.replace("_", " ")}
        </Text>
      </View>
      <Text style={[styles.paymentAmount, { color: typeColor }]}>
        +${payment.amount.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
      </Text>
    </View>
  );
}

export default function ReportsScreen() {
  const insets = useSafeAreaInsets();
  const [groupBy, setGroupBy] = useState<GroupBy>("month");
  const { data: summary, isLoading: summaryLoading } = useGetReportSummary();
  const { data: incomeData, isLoading: incomeLoading } = useGetIncomeReport({ groupBy });
  const { data: payments, isLoading: paymentsLoading } = useGetPayments({});

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom + 80;

  const recentPayments = (payments ?? []).slice().reverse().slice(0, 10);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: topPadding + 4, paddingBottom: bottomPadding }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Reportes</Text>

      {/* Summary Stats */}
      {summaryLoading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginVertical: 20 }} />
      ) : summary ? (
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryAmount}>
              ${(summary.totalIncome ?? 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
            </Text>
            <Text style={styles.summaryLabel}>Ingresos Totales</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryAmount, { color: Colors.incomeMonth }]}>
              ${(summary.incomeThisMonth ?? 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
            </Text>
            <Text style={styles.summaryLabel}>Este Mes</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryAmount, { color: Colors.warning }]}>
              ${(summary.pendingPayments ?? 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
            </Text>
            <Text style={styles.summaryLabel}>Por Cobrar</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryAmount, { color: Colors.info }]}>
              {summary.eventsThisMonth ?? 0}
            </Text>
            <Text style={styles.summaryLabel}>Eventos Mes</Text>
          </View>
        </View>
      ) : null}

      {/* Income Chart */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Ingresos</Text>
          <View style={styles.groupSelector}>
            {GROUP_OPTIONS.map((opt) => (
              <Pressable
                key={opt.key}
                style={[styles.groupOption, groupBy === opt.key && styles.groupOptionActive]}
                onPress={() => setGroupBy(opt.key)}
              >
                <Text style={[styles.groupText, groupBy === opt.key && styles.groupTextActive]}>
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
        {incomeLoading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginVertical: 30 }} />
        ) : (
          <>
            <Text style={styles.chartTotal}>
              Total: ${(incomeData?.total ?? 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
            </Text>
            <BarChart data={incomeData?.data ?? []} />
          </>
        )}
      </View>

      {/* Recent Payments */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pagos Recientes</Text>
        {paymentsLoading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginVertical: 20 }} />
        ) : recentPayments.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="dollar-sign" size={36} color={Colors.border} />
            <Text style={styles.emptyText}>Sin pagos registrados</Text>
          </View>
        ) : (
          recentPayments.map((p) => <PaymentRow key={p.id} payment={p} />)
        )}
      </View>
    </ScrollView>
  );
}

// Augment Colors for this file
const Colors2 = { ...Colors, incomeMonth: "#4CAF7D" };

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    color: Colors.textPrimary,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
  },
  summaryAmount: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: Colors.primary,
    textAlign: "center",
  },
  summaryLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: "center",
  },
  section: {
    marginHorizontal: 16,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  groupSelector: {
    flexDirection: "row",
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 8,
    padding: 3,
    gap: 2,
  },
  groupOption: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  groupOptionActive: {
    backgroundColor: Colors.primary,
  },
  groupText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.textSecondary,
  },
  groupTextActive: {
    color: Colors.dark,
  },
  chartTotal: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  chart: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
    minHeight: CHART_HEIGHT + 40,
    paddingBottom: 4,
  },
  chartEmpty: {
    height: CHART_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  chartEmptyText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.textSecondary,
  },
  barCol: {
    alignItems: "center",
    gap: 4,
  },
  barAmount: {
    fontFamily: "Inter_400Regular",
    fontSize: 9,
    color: Colors.textSecondary,
  },
  barBg: {
    justifyContent: "flex-end",
    height: CHART_HEIGHT,
  },
  bar: {
    backgroundColor: Colors.primary,
    borderRadius: 4,
    minHeight: 4,
  },
  barLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    color: Colors.textSecondary,
    maxWidth: 40,
    textAlign: "center",
  },
  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  paymentIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentTitle: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.textPrimary,
  },
  paymentMeta: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
    textTransform: "capitalize",
  },
  paymentAmount: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
  },
  empty: {
    alignItems: "center",
    paddingVertical: 30,
    gap: 8,
  },
  emptyText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
