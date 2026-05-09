/**
 * Diagram 51 — Notifications (Sound/Vibrate)
 * Web Notification + Vibration API for mobile.
 */

export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const perm = await Notification.requestPermission();
  return perm === "granted";
}

export function sendNotification(title: string, body?: string): void {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  if (document.hasFocus()) return;
  try {
    new Notification(title, {
      body,
      icon: "/favicon.svg",
      tag: "ave-ai-response",
    });
  } catch {
    // ignore
  }
}

export function vibrateDevice(pattern: number | number[] = [50, 30, 50]): void {
  if ("vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}

export function notifyResponse(personaName = "Ave AI"): void {
  sendNotification(`${personaName} replied`, "Your response is ready.");
  vibrateDevice([40, 20, 40]);
}
