"use client";

import {
  Camera,
  CheckCircle2,
  ChevronDown,
  Loader2,
  Monitor,
  Settings2,
  Video,
  Wifi,
  WifiOff,
} from "lucide-react";
import * as React from "react";

import { Button, Input } from "@/shared/components/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import { cn } from "@/shared/lib/utils";

const DEFAULT_CAMERAS = [
  { id: "gate", name: "Въездные ворота", description: "Контроль въезда на территорию" },
  { id: "site", name: "Строительная площадка", description: "Обзор основной зоны работ" },
  { id: "facade", name: "Фасад комплекса", description: "Мониторинг фасадных работ" },
  { id: "webcam", name: "Веб-камера (тест)", description: "Подключение через браузер для проверки" },
] as const;

type CameraConfig = {
  id: string;
  name: string;
  description: string;
  ip: string;
};

function isValidIp(value: string): boolean {
  if (!value.trim()) return false;
  const parts = value.trim().split(".");
  if (parts.length !== 4) return false;
  return parts.every(
    (p) => /^\d+$/.test(p) && Number.parseInt(p, 10) >= 0 && Number.parseInt(p, 10) <= 255,
  );
}

type ProjectCamerasDialogProps = {
  projectId: number;
  projectName: string;
  trigger: React.ReactNode;
};

const STORAGE_KEY = "project-cameras-ip";

function getStoredIps(projectId: number): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}-${projectId}`);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function setStoredIps(projectId: number, ips: Record<string, string>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${STORAGE_KEY}-${projectId}`, JSON.stringify(ips));
  } catch {
    // ignore
  }
}

export function ProjectCamerasDialog({
  projectId,
  projectName,
  trigger,
}: ProjectCamerasDialogProps) {
  const [cameras, setCameras] = React.useState<CameraConfig[]>(() =>
    DEFAULT_CAMERAS.map((c) => ({
      ...c,
      ip: getStoredIps(projectId)[c.id] ?? "",
    })),
  );
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [previewStatus, setPreviewStatus] = React.useState<"idle" | "connecting" | "connected">(
    "idle",
  );
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [webcamStream, setWebcamStream] = React.useState<MediaStream | null>(null);
  const [webcamLoading, setWebcamLoading] = React.useState(false);
  const [webcamError, setWebcamError] = React.useState<string | null>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const selectedCamera = cameras.find((c) => c.id === selectedId);
  const isWebcam = selectedId === "webcam";
  const selectedHasIp = selectedCamera ? isValidIp(selectedCamera.ip) : false;
  const canShowStream = isWebcam || selectedHasIp;

  React.useEffect(() => {
    const ips: Record<string, string> = {};
    for (const c of cameras) {
      if (c.ip.trim()) ips[c.id] = c.ip;
    }
    setStoredIps(projectId, ips);
  }, [projectId, cameras]);

  React.useEffect(() => {
    if (!selectedId) {
      setPreviewStatus("idle");
      return;
    }
    if (isWebcam && webcamStream) {
      setPreviewStatus("connected");
      return;
    }
    if (isWebcam && !webcamStream) {
      setPreviewStatus("idle");
      return;
    }
    if (!selectedHasIp) {
      setPreviewStatus("idle");
      return;
    }
    setPreviewStatus("connecting");
    const t = setTimeout(() => setPreviewStatus("connected"), 1800);
    return () => clearTimeout(t);
  }, [selectedId, selectedHasIp, isWebcam, webcamStream]);

  const updateCameraIp = (id: string, ip: string) => {
    setCameras((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ip } : c)),
    );
  };

  const streamRef = React.useRef<MediaStream | null>(null);

  const stopWebcam = React.useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setWebcamStream(null);
    setWebcamError(null);
  }, []);

  const startWebcam = React.useCallback(async () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setWebcamError(null);
    setWebcamLoading(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: false,
      });
      streamRef.current = stream;
      setWebcamStream(stream);
    } catch (err) {
      setWebcamError(
        err instanceof Error ? err.message : "Не удалось получить доступ к камере",
      );
    } finally {
      setWebcamLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (videoRef.current && webcamStream) {
      videoRef.current.srcObject = webcamStream;
    }
  }, [webcamStream]);

  React.useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  return (
    <Dialog>
      <DialogTrigger className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#566a7f] shadow-[0_1px_0_rgba(34,48,62,0.04)] hover:bg-neutral-50 hover:text-[#6b7280] transition-colors">
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-5xl overflow-hidden p-0">
        <DialogHeader className="space-y-1 border-b border-neutral-100 bg-gradient-to-b from-neutral-50/80 to-white px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-[#696cff]/10">
                <Video className="size-5 text-[#696cff]" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold text-[#1f2933]">
                  Камеры проекта
                </DialogTitle>
                <DialogDescription className="sr-only">
                  Просмотр и настройка камер проекта, включая IP-адреса и тест веб-камеры.
                </DialogDescription>
                <p className="mt-0.5 text-sm text-[#6b7280]">
                  {projectName} · Мониторинг в реальном времени
                </p>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="grid min-h-[420px] grid-cols-1 lg:grid-cols-[320px_1fr]">
          {/* Список камер */}
          <aside className="border-r border-neutral-100 bg-neutral-50/30 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#9ca3af]">
              Камеры
            </p>
            <div className="space-y-2">
              {cameras.map((camera) => {
                const isWebcamCam = camera.id === "webcam";
                const hasIp = isWebcamCam ? !!webcamStream : isValidIp(camera.ip);
                const isSelected = selectedId === camera.id;
                const isExpanded = expandedId === camera.id;

                return (
                  <div
                    key={camera.id}
                    className={cn(
                      "overflow-hidden rounded-xl border transition-all duration-200",
                      isSelected
                        ? "border-[#696cff]/50 bg-white shadow-sm ring-1 ring-[#696cff]/20"
                        : "border-neutral-200/70 bg-white hover:border-neutral-300",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedId(camera.id)}
                      className="w-full px-4 py-3 text-left"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-3">
                          <div
                            className={cn(
                              "flex size-9 shrink-0 items-center justify-center rounded-lg",
                              hasIp ? "bg-emerald-500/10" : "bg-neutral-100",
                            )}
                          >
                            <Camera
                              className={cn(
                                "size-4",
                                hasIp ? "text-emerald-600" : "text-[#9ca3af]",
                              )}
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-[#111827]">
                              {camera.name}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-[#9ca3af]">
                              {camera.description}
                            </p>
                          </div>
                        </div>
                        <span
                          className={cn(
                            "shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                            hasIp
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-neutral-100 text-[#9ca3af]",
                          )}
                        >
                          {hasIp ? "Подключена" : "Не подключена"}
                        </span>
                      </div>
                    </button>

                    {/* Блок настройки IP / веб-камера */}
                    {!isWebcamCam && (
                      <div className="border-t border-neutral-100">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedId(isExpanded ? null : camera.id)
                          }
                          className="flex w-full items-center justify-between gap-2 px-4 py-2 text-left text-xs font-medium text-[#6b7280] hover:bg-neutral-50 hover:text-[#374151]"
                        >
                          <span className="inline-flex items-center gap-2">
                            <Settings2 className="size-3.5" />
                            {hasIp ? `IP: ${camera.ip}` : "Добавить IP-адрес"}
                          </span>
                          <ChevronDown
                            className={cn(
                              "size-4 transition-transform",
                              isExpanded && "rotate-180",
                            )}
                          />
                        </button>
                        {isExpanded && (
                          <div className="border-t border-neutral-100 bg-neutral-50/50 px-4 py-3">
                            <label className="mb-1.5 block text-xs font-medium text-[#6b7280]">
                              IP-адрес камеры
                            </label>
                            <div className="flex gap-2">
                              <Input
                                placeholder="192.168.1.100"
                                value={camera.ip}
                                onChange={(e) =>
                                  updateCameraIp(camera.id, e.target.value)
                                }
                                className="h-8 text-sm"
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                className="shrink-0"
                                onClick={() => setExpandedId(null)}
                              >
                                Готово
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </aside>

          {/* Превью видеопотока */}
          <div className="flex flex-col bg-white p-6">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-[#111827]">
                Просмотр видеопотока
              </p>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
                  previewStatus === "connected" || (isWebcam && webcamStream)
                    ? "bg-emerald-50 text-emerald-700"
                    : previewStatus === "connecting" || webcamLoading
                      ? "bg-amber-50 text-amber-700"
                      : "bg-neutral-100 text-[#9ca3af]",
                )}
              >
                {previewStatus === "connected" || (isWebcam && webcamStream) ? (
                  <>
                    <Wifi className="size-3.5" />
                    Подключено
                  </>
                ) : previewStatus === "connecting" || webcamLoading ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    Подключение…
                  </>
                ) : (
                  <>
                    <WifiOff className="size-3.5" />
                    Камера не подключена
                  </>
                )}
              </span>
            </div>

            <div className="mt-4 flex flex-1 flex-col overflow-hidden rounded-xl border border-neutral-200/70 bg-neutral-50/50">
              <div className="relative flex aspect-video min-h-[240px] flex-col items-center justify-center gap-4 p-6">
                {/* Прямой эфир веб-камеры */}
                {isWebcam && webcamStream ? (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="absolute inset-0 h-full w-full rounded-lg object-cover"
                    />
                    <div className="absolute bottom-3 right-3 flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="bg-white/90 shadow-sm backdrop-blur"
                        onClick={stopWebcam}
                      >
                        Отключить
                      </Button>
                    </div>
                  </>
                ) : !selectedId ? (
                  <>
                    <div className="flex size-16 items-center justify-center rounded-2xl bg-neutral-200/60">
                      <Monitor className="size-8 text-[#9ca3af]" />
                    </div>
                    <p className="text-center text-sm font-medium text-[#9ca3af]">
                      Выберите камеру слева для просмотра
                    </p>
                    <p className="text-center text-xs text-[#9ca3af]">
                      Введите IP-адрес или используйте веб-камеру для теста
                    </p>
                  </>
                ) : isWebcam ? (
                  <>
                    {webcamLoading ? (
                      <>
                        <Loader2 className="size-10 animate-spin text-[#696cff]" />
                        <p className="text-sm font-semibold text-[#6b7280]">
                          Запрос доступа к камере…
                        </p>
                      </>
                    ) : webcamError ? (
                      <>
                        <div className="flex size-16 items-center justify-center rounded-2xl bg-rose-100/80">
                          <WifiOff className="size-8 text-rose-600" />
                        </div>
                        <p className="text-center text-sm font-medium text-rose-700">
                          {webcamError}
                        </p>
                        <Button size="sm" onClick={startWebcam}>
                          Повторить
                        </Button>
                      </>
                    ) : (
                      <>
                        <div className="flex size-16 items-center justify-center rounded-2xl bg-[#696cff]/10">
                          <Camera className="size-8 text-[#696cff]" />
                        </div>
                        <p className="text-center text-sm font-medium text-[#6b7280]">
                          Подключите веб-камеру для теста
                        </p>
                        <Button onClick={startWebcam}>Подключить веб-камеру</Button>
                      </>
                    )}
                  </>
                ) : !selectedHasIp ? (
                  <>
                    <div className="flex size-16 items-center justify-center rounded-2xl bg-amber-100/80">
                      <Settings2 className="size-8 text-amber-600" />
                    </div>
                    <p className="text-center text-sm font-medium text-[#6b7280]">
                      Укажите IP-адрес для камеры «{selectedCamera?.name}»
                    </p>
                    <p className="text-center text-xs text-[#9ca3af]">
                      Раскройте блок «Добавить IP-адрес» в карточке камеры
                    </p>
                  </>
                ) : previewStatus === "connecting" ? (
                  <>
                    <Loader2 className="size-10 animate-spin text-[#696cff]" />
                    <p className="text-sm font-semibold text-[#6b7280]">
                      Подключение к {selectedCamera?.ip}…
                    </p>
                    <p className="text-xs text-[#9ca3af]">
                      Загрузка видеопотока
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex size-16 items-center justify-center rounded-2xl bg-emerald-100/80">
                      <CheckCircle2 className="size-8 text-emerald-600" />
                    </div>
                    <p className="text-center text-sm font-medium text-[#374151]">
                      Камера «{selectedCamera?.name}» подключена
                    </p>
                    <p className="text-center text-xs text-[#9ca3af]">
                      {selectedCamera?.ip} — видеопоток будет отображаться здесь
                    </p>
                  </>
                )}
              </div>
            </div>

            <p className="mt-3 text-xs text-[#9ca3af]">
              {isWebcam && webcamStream
                ? "Видеопоток с веб-камеры в реальном времени."
                : previewStatus === "connecting" || webcamLoading
                  ? "Подключаем видеопоток…"
                  : previewStatus === "connected"
                    ? "Видеопоток готов к отображению."
                    : "Видеопоток пока недоступен. Добавьте IP-адрес или используйте веб-камеру."}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
