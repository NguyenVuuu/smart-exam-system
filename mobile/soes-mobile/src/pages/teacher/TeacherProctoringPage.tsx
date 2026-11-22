import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ArrowLeft, RefreshCw, ShieldAlert, X } from "lucide-react-native";
import { router } from "expo-router";
import { File, Paths } from "expo-file-system";
import { API_BASE_URL } from "../../api/client";
import { tokenStorage } from "../../auth/tokenStorage";
import { listLiveProctoringViolations } from "../../api/teacher-proctoring.api";
import { getTeacherSocket } from "../../api/teacher-proctoring.socket";
import type { ProctoringViolation } from "../../types/teacher-proctoring.types";

const typeLabels: Record<string, string> = {
  RIGHT_CLICK: "Nhấp chuột phải",
  COPY_PASTE: "Sao chép / dán",
  TAB_SWITCH: "Chuyển tab",
  FULLSCREEN_EXIT: "Thoát toàn màn hình",
  NO_FACE: "Không thấy khuôn mặt",
  MULTIPLE_FACES: "Phát hiện nhiều khuôn mặt",
  LOOKING_AWAY: "Nhìn ra ngoài màn hình",
  PHONE_DETECTED: "Phát hiện điện thoại",
  CAMERA_BLOCKED: "Camera bị che",
  CAMERA_DISCONNECTED: "Camera bị ngắt kết nối",
  CAMERA_PERMISSION_DENIED: "Từ chối quyền camera",
  SCREEN_SHARE_STOPPED: "Dừng chia sẻ màn hình",
  SCREEN_PERMISSION_DENIED: "Từ chối chia sẻ màn hình",
  IP_CHANGED: "Thay đổi địa chỉ IP",
  HEARTBEAT_MISSED: "Mất tín hiệu hoạt động",
  MULTIPLE_ACTIVE_SESSIONS: "Nhiều phiên hoạt động",
  INACTIVITY: "Không hoạt động",
  PROCTOR_WEBCAM_CAPTURE: "Ảnh camera",
  PROCTOR_SCREEN_CAPTURE: "Ảnh màn hình",
};

function resolveImageUrl(value?: string) {
  if (!value) return null;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  const origin = API_BASE_URL.replace(/\/api\/?$/, "");
  return value.startsWith("/") ? `${origin}${value}` : `${origin}/${value}`;
}

function normalizeViolation(
  value: Partial<ProctoringViolation>,
): ProctoringViolation | null {
  if (
    !value.id ||
    !value.attemptId ||
    !value.studentName ||
    !value.type ||
    !value.timestamp
  )
    return null;
  return {
    ...value,
    scheduleId: value.scheduleId ?? "",
    studentId: value.studentId ?? "",
    studentCode: value.studentCode ?? "N/A",
    severity: value.severity ?? "MEDIUM",
    evidenceImageUrl: value.evidenceImageUrl ?? undefined,
  } as ProctoringViolation;
}

function EvidenceImage({
  id,
  url,
  onOpen,
}: {
  id: string;
  url: string;
  onOpen: (uri: string) => void;
}) {
  const [localUri, setLocalUri] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    setLocalUri(null);
    setFailed(false);

    void tokenStorage
      .getAccessToken()
      .then(async (token) => {
        const target = new File(Paths.cache, `proctoring-evidence-${id}.jpg`);
        const file = await File.downloadFileAsync(url, target, {
          idempotent: true,
          headers: token
            ? { Authorization: `Bearer ${token}` }
            : undefined,
        });
        if (active) setLocalUri(file.uri);
      })
      .catch(() => {
        if (active) setFailed(true);
      });

    return () => {
      active = false;
    };
  }, [id, url]);

  if (failed) {
    return (
      <View style={styles.imageError}>
        <Text style={styles.imageErrorText}>Không tải được ảnh bằng chứng.</Text>
      </View>
    );
  }

  if (!localUri) {
    return (
      <View style={styles.imageLoading}>
        <ActivityIndicator color="#2563eb" />
        <Text style={styles.imageLoadingText}>Đang tải ảnh bằng chứng...</Text>
      </View>
    );
  }

  return (
    <Pressable onPress={() => onOpen(localUri)}>
      <Image source={{ uri: localUri }} style={styles.image} />
      <Text style={styles.viewImage}>Bấm để xem ảnh đầy đủ</Text>
    </Pressable>
  );
}

export function TeacherProctoringPage({ scheduleId }: { scheduleId: string }) {
  const [items, setItems] = useState<ProctoringViolation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [realtime, setRealtime] = useState(false);

  async function load() {
    setLoading(true);
    setError(false);
    try {
      setItems(await listLiveProctoringViolations(scheduleId));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    let active = true;
    let socket: Awaited<ReturnType<typeof getTeacherSocket>> | null = null;
    const onViolation = (payload: Partial<ProctoringViolation>) => {
      const next = normalizeViolation(payload);
      if (!next || (next.scheduleId && next.scheduleId !== scheduleId)) return;
      setItems((current) =>
        current.some((item) => item.id === next.id)
          ? current
          : [next, ...current],
      );
    };
    const onEnded = (payload: {
      id?: string;
      endedAt?: string;
      durationSeconds?: number | null;
    }) => {
      if (!payload.id) return;
      setItems((current) =>
        current.map((item) =>
          item.id === payload.id
            ? {
                ...item,
                endedAt: payload.endedAt ?? item.endedAt,
                durationSeconds:
                  payload.durationSeconds ?? item.durationSeconds,
              }
            : item,
        ),
      );
    };
    void getTeacherSocket()
      .then((nextSocket) => {
        if (!active) return;
        socket = nextSocket;
        const join = () =>
          socket?.emit(
            "proctoring:join_schedule",
            { scheduleId },
            (response: { ok: boolean }) => {
              if (active) setRealtime(response.ok);
            },
          );
        socket.on("connect", join);
        socket.on("violation:created", onViolation);
        socket.on("violation:ended", onEnded);
        if (socket.connected) join();
      })
      .catch(() => undefined);
    return () => {
      active = false;
      socket?.emit("proctoring:leave_schedule", { scheduleId });
      socket?.off("connect");
      socket?.off("violation:created", onViolation);
      socket?.off("violation:ended", onEnded);
    };
  }, [scheduleId]);

  const evidenceCount = useMemo(
    () => items.filter((item) => Boolean(item.evidenceImageUrl)).length,
    [items],
  );
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Pressable onPress={() => router.back()} style={styles.back}>
        <ArrowLeft size={17} color="#64748b" />
        <Text style={styles.backText}>Quay lại lịch coi thi</Text>
      </Pressable>
      <View style={styles.header}>
        <ShieldAlert size={23} color="#dc2626" />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Giám sát ca thi</Text>
        </View>
      </View>
      <View style={styles.summary}>
        <Text style={styles.summaryNumber}>{items.length}</Text>
        <Text style={styles.summaryLabel}>vi phạm</Text>
        <Text style={styles.summaryDivider}>·</Text>
        <Text style={styles.summaryNumber}>{evidenceCount}</Text>
        <Text style={styles.summaryLabel}>ảnh bằng chứng</Text>
        <Pressable onPress={() => void load()} style={styles.refresh}>
          <RefreshCw size={15} color="#2563eb" />
        </Pressable>
      </View>
      {loading ? (
        <View style={styles.state}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.stateText}>Đang tải dữ liệu...</Text>
        </View>
      ) : error ? (
        <View style={styles.state}>
          <Text style={styles.error}>Không thể tải vi phạm.</Text>
          <Pressable onPress={() => void load()} style={styles.retry}>
            <Text style={styles.retryText}>Thử lại</Text>
          </Pressable>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.state}>
          <ShieldAlert size={34} color="#cbd5e1" />
          <Text style={styles.stateText}>Chưa có vi phạm trong ca thi.</Text>
        </View>
      ) : (
        items.map((item) => {
          const imageUrl = resolveImageUrl(item.evidenceImageUrl);
          return (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.student}>{item.studentName}</Text>
                  <Text style={styles.code}>{item.studentCode}</Text>
                </View>
                <View style={styles.severity}>
                  <Text style={styles.severityText}>{item.severity}</Text>
                </View>
              </View>
              <Text style={styles.type}>
                {typeLabels[item.type] ?? item.type}
              </Text>
              <Text style={styles.time}>
                {new Date(item.timestamp).toLocaleString("vi-VN")}
              </Text>
              {item.note || item.evidenceText ? (
                <Text style={styles.note}>
                  {item.note ?? item.evidenceText}
                </Text>
              ) : null}
              {imageUrl ? (
                <EvidenceImage
                  id={item.id}
                  url={imageUrl}
                  onOpen={setSelectedImage}
                />
              ) : (
                <Text style={styles.noImage}>
                  Vi phạm này không có ảnh bằng chứng.
                </Text>
              )}
            </View>
          );
        })
      )}
      <Modal
        visible={Boolean(selectedImage)}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <View style={styles.modal}>
          <Pressable
            style={styles.close}
            onPress={() => setSelectedImage(null)}
          >
            <X size={22} color="#fff" />
          </Pressable>
          {selectedImage ? (
            <Image
              source={{ uri: selectedImage }}
              style={styles.fullImage}
              resizeMode="contain"
            />
          ) : null}
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 36 },
  back: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 18,
  },
  backText: { color: "#64748b", fontSize: 13, fontWeight: "600" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  title: { color: "#0f172a", fontSize: 20, fontWeight: "800" },
  subtitle: { color: "#64748b", fontSize: 12, marginTop: 3 },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 10,
  },
  liveOn: { backgroundColor: "#dcfce7" },
  liveOff: { backgroundColor: "#f1f5f9" },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#16a34a" },
  liveText: { color: "#15803d", fontSize: 10, fontWeight: "700" },
  summary: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  summaryNumber: { color: "#dc2626", fontSize: 18, fontWeight: "800" },
  summaryLabel: { color: "#64748b", fontSize: 11, marginLeft: 4 },
  summaryDivider: { color: "#cbd5e1", marginHorizontal: 9 },
  refresh: { marginLeft: "auto", padding: 6 },
  state: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },
  stateText: { color: "#64748b", textAlign: "center" },
  error: { color: "#dc2626", marginBottom: 10 },
  retry: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 9,
    backgroundColor: "#eff6ff",
  },
  retryText: { color: "#2563eb", fontWeight: "700" },
  card: {
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#fecaca",
    marginBottom: 10,
  },
  cardTop: { flexDirection: "row", alignItems: "flex-start" },
  student: { color: "#0f172a", fontSize: 13, fontWeight: "800" },
  code: { color: "#64748b", fontSize: 11, marginTop: 2 },
  severity: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 7,
    backgroundColor: "#fff7ed",
  },
  severityText: { color: "#c2410c", fontSize: 10, fontWeight: "800" },
  type: { color: "#b91c1c", fontSize: 13, fontWeight: "800", marginTop: 10 },
  time: { color: "#64748b", fontSize: 10, marginTop: 4 },
  note: { color: "#475569", fontSize: 12, lineHeight: 18, marginTop: 8 },
  image: {
    width: "100%",
    height: 170,
    borderRadius: 9,
    backgroundColor: "#f1f5f9",
    marginTop: 10,
  },
  imageLoading: {
    height: 170,
    borderRadius: 9,
    backgroundColor: "#f1f5f9",
    marginTop: 10,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  imageLoadingText: { color: "#64748b", fontSize: 11 },
  imageError: {
    height: 170,
    borderRadius: 9,
    backgroundColor: "#fef2f2",
    marginTop: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  imageErrorText: { color: "#b91c1c", fontSize: 11, textAlign: "center" },
  viewImage: {
    color: "#2563eb",
    textAlign: "center",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 6,
  },
  noImage: {
    color: "#94a3b8",
    fontSize: 11,
    marginTop: 10,
    fontStyle: "italic",
  },
  modal: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.92)",
    justifyContent: "center",
    alignItems: "center",
  },
  close: { position: "absolute", top: 45, right: 18, padding: 10, zIndex: 2 },
  fullImage: { width: "100%", height: "80%" },
});
