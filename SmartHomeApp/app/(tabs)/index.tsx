// File: app/index.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  Switch,
  ScrollView,
  Alert,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";

// =================================================================
// ⚠️ QUAN TRỌNG: Dán link Backend Render của bạn vào đây
// =================================================================
const BASE_URL = "https://smarthome-backend.onrender.com";

export default function App() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [sensors, setSensors] = useState({
    temperature: "--",
    humidity: "--",
    light: "--",
    led_status: 0,
    fan_status: 0,
  });

  const [aiData, setAiData] = useState({
    temp_predict: null,
    humi_predict: null,
  });
  const [ledOn, setLedOn] = useState(false);
  const [fanOn, setFanOn] = useState(false);

  const fetchData = async () => {
    try {
      const [sensorRes, aiRes] = await Promise.all([
        fetch(`${BASE_URL}/api/sensors`),
        fetch(`${BASE_URL}/api/predict/all`),
      ]);

      const sensorJson = await sensorRes.json();
      const aiJson = await aiRes.json();

      setSensors(sensorJson);
      setLedOn(sensorJson.led_status == 1);
      setFanOn(sensorJson.fan_status == 1);
      setAiData(aiJson);
    } catch (error) {
      console.log("Lỗi kết nối:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const toggleDevice = async (type, value) => {
    if (type === "led") setLedOn(value);
    if (type === "fan") setFanOn(value);

    try {
      await fetch(`${BASE_URL}/api/device/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: type, isOn: value }),
      });
      setTimeout(fetchData, 500);
    } catch (error) {
      Alert.alert("Lỗi", "Không gửi được lệnh điều khiển!");
      if (type === "led") setLedOn(!value);
      if (type === "fan") setFanOn(!value);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, []);

  return (
    <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.container}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#fff"
          />
        }
      >
        <Text style={styles.headerTitle}>🏠 Smart Home AIoT</Text>
        <Text style={styles.subTitle}>
          {loading ? "Đang kết nối..." : "Hệ thống đang hoạt động"}
        </Text>

        {/* --- KHỐI 1: CẢM BIẾN --- */}
        <View style={styles.row}>
          <View style={[styles.card, styles.tempBorder]}>
            <Text style={styles.cardLabel}>🌡️ Nhiệt độ</Text>
            <Text style={[styles.cardValue, { color: "#ff6b6b" }]}>
              {sensors.temperature}°C
            </Text>
            {aiData.temp_predict && (
              <View style={styles.aiBadge}>
                <Text style={styles.aiText}>AI: {aiData.temp_predict}°</Text>
              </View>
            )}
          </View>

          <View style={[styles.card, styles.humiBorder]}>
            <Text style={styles.cardLabel}>💧 Độ ẩm</Text>
            <Text style={[styles.cardValue, { color: "#4ecdc4" }]}>
              {sensors.humidity}%
            </Text>
            {aiData.humi_predict && (
              <View style={styles.aiBadge}>
                <Text style={styles.aiText}>AI: {aiData.humi_predict}%</Text>
              </View>
            )}
          </View>

          <View style={[styles.card, styles.lightBorder]}>
            <Text style={styles.cardLabel}>☀️ Ánh sáng</Text>
            <Text style={[styles.cardValue, { color: "#feca57" }]}>
              {sensors.light}
            </Text>
            <Text style={styles.unit}>lux</Text>
          </View>
        </View>

        {/* --- KHỐI 2: ĐIỀU KHIỂN --- */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>🎛️ Bảng Điều Khiển</Text>

          <View style={styles.controlRow}>
            <View>
              <Text style={styles.controlName}>💡 Đèn LED</Text>
              <Text style={styles.controlStatus}>
                {ledOn ? "Đang BẬT" : "Đang TẮT"}
              </Text>
            </View>
            <Switch
              trackColor={{ false: "#767577", true: "#4ecdc4" }}
              thumbColor={ledOn ? "#fff" : "#f4f3f4"}
              onValueChange={(val) => toggleDevice("led", val)}
              value={ledOn}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.controlRow}>
            <View>
              <Text style={styles.controlName}>💨 Quạt Gió</Text>
              <Text style={styles.controlStatus}>
                {fanOn ? "Đang BẬT" : "Đang TẮT"}
              </Text>
            </View>
            <Switch
              trackColor={{ false: "#767577", true: "#ff6b6b" }}
              thumbColor={fanOn ? "#fff" : "#f4f3f4"}
              onValueChange={(val) => toggleDevice("fan", val)}
              value={fanOn}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.refreshBtn} onPress={fetchData}>
          <Text style={styles.refreshText}>🔄 Cập nhật ngay</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 5,
  },
  subTitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    marginBottom: 30,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 25,
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.95)",
    width: "31%",
    padding: 10,
    borderRadius: 15,
    alignItems: "center",
    elevation: 5,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#555",
    marginBottom: 5,
  },
  cardValue: { fontSize: 22, fontWeight: "bold" },
  unit: { fontSize: 12, color: "#888" },
  tempBorder: { borderBottomWidth: 4, borderBottomColor: "#ff6b6b" },
  humiBorder: { borderBottomWidth: 4, borderBottomColor: "#4ecdc4" },
  lightBorder: { borderBottomWidth: 4, borderBottomColor: "#feca57" },
  aiBadge: {
    marginTop: 5,
    backgroundColor: "#333",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  aiText: { color: "#ffd700", fontSize: 10, fontWeight: "bold" },
  sectionContainer: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    elevation: 5,
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
  },
  controlRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  controlName: { fontSize: 18, fontWeight: "600", color: "#333" },
  controlStatus: { fontSize: 14, color: "#888", marginTop: 2 },
  divider: { height: 1, backgroundColor: "#eee", marginVertical: 10 },
  refreshBtn: {
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 15,
    borderRadius: 30,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
  },
  refreshText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
