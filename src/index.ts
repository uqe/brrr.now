const API_BASE_URL = "https://api.brrr.now/v1/";

export type NotificationSound =
  | "default"
  | "system"
  | "brrr"
  | "bell_ringing"
  | "bubble_ding"
  | "bubbly_success_ding"
  | "cat_meow"
  | "calm1"
  | "calm2"
  | "cha_ching"
  | "dog_barking"
  | "door_bell"
  | "duck_quack"
  | "short_triple_blink"
  | "upbeat_bells"
  | "warm_soft_error";

export type NotificationInterruptionLevel = "passive" | "active" | "time-sensitive";

export interface SendNotificationParams {
  webhook: string;
  title?: string;
  subtitle?: string;
  message?: string;
  sound?: NotificationSound;
  openUrl?: string;
  imageUrl?: string;
  expirationDate?: string | Date;
  filterCriteria?: string;
  interruptionLevel?: NotificationInterruptionLevel;
}

export type BrrrNowError = Error & {
  name: "BrrrNowError";
  status: number;
  statusText: string;
  body: string;
};

interface NotificationPayload {
  title?: string;
  subtitle?: string;
  message?: string;
  sound?: NotificationSound;
  open_url?: string;
  image_url?: string;
  expiration_date?: string;
  "filter-criteria"?: string;
  "interruption-level"?: NotificationInterruptionLevel;
}

export const sendNotification = async (params: SendNotificationParams): Promise<Response> => {
  const response = await fetch(resolveWebhookUrl(params.webhook), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(createPayload(params)),
  });

  if (!response.ok) {
    throw createBrrrNowError(response, await response.text());
  }

  return response;
};

export const isBrrrNowError = (error: unknown): error is BrrrNowError => {
  return (
    error instanceof Error &&
    error.name === "BrrrNowError" &&
    typeof (error as Partial<BrrrNowError>).status === "number" &&
    typeof (error as Partial<BrrrNowError>).statusText === "string" &&
    typeof (error as Partial<BrrrNowError>).body === "string"
  );
};

const createPayload = (params: SendNotificationParams): NotificationPayload => {
  return {
    title: params.title,
    subtitle: params.subtitle,
    message: params.message,
    sound: params.sound,
    open_url: params.openUrl,
    image_url: params.imageUrl,
    expiration_date: serializeExpirationDate(params.expirationDate),
    "filter-criteria": params.filterCriteria,
    "interruption-level": params.interruptionLevel,
  };
};

const createBrrrNowError = (response: Response, body: string): BrrrNowError => {
  const error = new Error(
    `brrr.now request failed with ${response.status} ${response.statusText}${
      body ? `: ${body}` : ""
    }`,
  );

  return Object.assign(error, {
    name: "BrrrNowError" as const,
    status: response.status,
    statusText: response.statusText,
    body,
  });
};

const resolveWebhookUrl = (webhook: string): string => {
  const trimmedWebhook = webhook.trim();

  if (!trimmedWebhook) {
    throw new TypeError("webhook must not be empty");
  }

  if (trimmedWebhook.startsWith("https://") || trimmedWebhook.startsWith("http://")) {
    return trimmedWebhook;
  }

  return new URL(trimmedWebhook, API_BASE_URL).toString();
};

const serializeExpirationDate = (
  expirationDate: SendNotificationParams["expirationDate"],
): string | undefined => {
  if (expirationDate instanceof Date) {
    return expirationDate.toISOString();
  }

  return expirationDate;
};
