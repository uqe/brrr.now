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
  apiError?: string;
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

interface BrrrNowSuccessResponseBody {
  success: true;
}

interface BrrrNowErrorResponseBody {
  success: false;
  error?: string;
}

type BrrrNowResponseBody = BrrrNowSuccessResponseBody | BrrrNowErrorResponseBody;

export const sendNotification = async (params: SendNotificationParams): Promise<Response> => {
  const response = await fetch(resolveWebhookUrl(params.webhook), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(createPayload(params)),
  });
  const body = await readResponseBody(response);
  const responseBody = parseResponseBody(body);

  if (!response.ok) {
    throw createBrrrNowError(response, body, responseBody?.success === false ? responseBody.error : undefined);
  }

  if (responseBody?.success === false) {
    throw createBrrrNowError(response, body, responseBody.error);
  }

  return response;
};

export const isBrrrNowError = (error: unknown): error is BrrrNowError => {
  return (
    error instanceof Error &&
    error.name === "BrrrNowError" &&
    typeof (error as Partial<BrrrNowError>).status === "number" &&
    typeof (error as Partial<BrrrNowError>).statusText === "string" &&
    typeof (error as Partial<BrrrNowError>).body === "string" &&
    (typeof (error as Partial<BrrrNowError>).apiError === "string" ||
      typeof (error as Partial<BrrrNowError>).apiError === "undefined")
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

const createBrrrNowError = (response: Response, body: string, apiError?: string): BrrrNowError => {
  const details = apiError ?? body;
  const statusDetails = response.statusText ? ` ${response.statusText}` : "";
  const message = response.ok
    ? `brrr.now API reported failure${details ? `: ${details}` : ""}`
    : `brrr.now request failed with ${response.status}${statusDetails}${details ? `: ${details}` : ""}`;
  const error = new Error(message);

  return Object.assign(error, {
    name: "BrrrNowError" as const,
    status: response.status,
    statusText: response.statusText,
    body,
    apiError,
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

const serializeExpirationDate = (expirationDate: SendNotificationParams["expirationDate"]): string | undefined => {
  if (expirationDate instanceof Date) {
    return expirationDate.toISOString();
  }

  return expirationDate;
};

const readResponseBody = async (response: Response): Promise<string> => {
  return await response.clone().text();
};

const parseResponseBody = (body: string): BrrrNowResponseBody | undefined => {
  if (!body) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(body) as unknown;

    if (isResponseBody(parsed)) {
      return parsed;
    }
  } catch {
    return undefined;
  }

  return undefined;
};

const isResponseBody = (value: unknown): value is BrrrNowResponseBody => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const success = (value as Partial<BrrrNowResponseBody>).success;

  if (success === true) {
    return true;
  }

  if (success === false) {
    const error = (value as Partial<BrrrNowErrorResponseBody>).error;

    return typeof error === "string" || typeof error === "undefined";
  }

  return false;
};
