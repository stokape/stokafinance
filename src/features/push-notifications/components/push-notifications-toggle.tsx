"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { savePushSubscriptionAction, deletePushSubscriptionAction } from "@/features/push-notifications/actions/push-subscriptions.actions";

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) output[i] = rawData.charCodeAt(i);
  return output;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return window.btoa(binary);
}

type Status = "unsupported" | "checking" | "off" | "on" | "pending";

/**
 * Activa/desactiva Web Push para este dispositivo/navegador. La clave
 * pública VAPID es pública por diseño (así funciona el protocolo — sólo la
 * privada, que nunca sale del server, firma los envíos), por eso vive en
 * NEXT_PUBLIC_VAPID_PUBLIC_KEY sin problema.
 */
export function PushNotificationsToggle() {
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    let cancelled = false;

    async function checkStatus() {
      if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
        if (!cancelled) setStatus("unsupported");
        return;
      }
      const registration = await navigator.serviceWorker.getRegistration("/sw.js");
      const subscription = await registration?.pushManager.getSubscription();
      if (!cancelled) setStatus(subscription ? "on" : "off");
    }

    checkStatus();
    return () => {
      cancelled = true;
    };
  }, []);

  // Sin startTransition a propósito: Notification.requestPermission() exige
  // la activación de usuario del click real, igual que WebAuthn en
  // app-lock.ts — envolverlo en una transición puede retrasarlo lo
  // suficiente como para que el navegador ya no lo cuente como gesto directo.
  async function handleEnable() {
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      toast.error("Las notificaciones no están configuradas todavía.");
      return;
    }

    setStatus("pending");
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error("No diste permiso para notificaciones.");
        setStatus("off");
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      const p256dhKey = subscription.getKey("p256dh");
      const authKey = subscription.getKey("auth");
      if (!p256dhKey || !authKey) {
        toast.error("Tu navegador no entregó las claves de la suscripción.");
        setStatus("off");
        return;
      }

      const result = await savePushSubscriptionAction({
        endpoint: subscription.endpoint,
        keys: { p256dh: arrayBufferToBase64(p256dhKey), auth: arrayBufferToBase64(authKey) },
      });
      if (!result.ok) {
        toast.error(result.error);
        setStatus("off");
        return;
      }

      setStatus("on");
      toast.success("Notificaciones activadas en este dispositivo");
    } catch {
      toast.error("No pudimos activar las notificaciones en este dispositivo.");
      setStatus("off");
    }
  }

  async function handleDisable() {
    setStatus("pending");
    const registration = await navigator.serviceWorker.getRegistration("/sw.js");
    const subscription = await registration?.pushManager.getSubscription();
    if (subscription) {
      await deletePushSubscriptionAction(subscription.endpoint);
      await subscription.unsubscribe();
    }
    setStatus("off");
    toast.success("Notificaciones desactivadas en este dispositivo");
  }

  if (status === "unsupported") {
    return <p className="text-sm text-muted-foreground">Tu navegador no soporta notificaciones push.</p>;
  }
  if (status === "checking") return null;
  if (status === "pending") {
    return (
      <Button variant="outline" disabled isLoading>
        Un momento...
      </Button>
    );
  }

  return status === "on" ? (
    <Button variant="outline" onClick={handleDisable}>
      <BellOff className="h-4 w-4" /> Desactivar notificaciones en este dispositivo
    </Button>
  ) : (
    <Button variant="outline" onClick={handleEnable}>
      <Bell className="h-4 w-4" /> Activar notificaciones en este dispositivo
    </Button>
  );
}
