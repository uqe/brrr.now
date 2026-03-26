import { isBrrrNowError, sendNotification } from "../src";
import { afterEach, expect, test } from "bun:test";

const originalFetch = globalThis.fetch;

afterEach(() => {
  Object.defineProperty(globalThis, "fetch", {
    value: originalFetch,
    writable: true,
    configurable: true,
  });
});

test("sends a JSON notification payload to the provided webhook URL", async () => {
  let requestInput: RequestInfo | URL | undefined;
  let requestInit: RequestInit | undefined;

  setFetch(async (input, init) => {
    requestInput = input;
    requestInit = init;

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      statusText: "OK",
      headers: {
        "Content-Type": "application/json",
      },
    });
  });

  const response = await sendNotification({
    webhook: "https://api.brrr.now/v1/br_usr_test",
    title: "Coffee Machine Offline",
    subtitle: "Kitchen",
    message: "The coffee machine is currently unreachable.",
    sound: "upbeat_bells",
    openUrl: "https://status.example.com/coffee-machine",
    imageUrl: "https://status.example.com/coffee-machine.png",
    expirationDate: new Date("2026-04-23T09:00:00.000Z"),
    filterCriteria: "ops",
    interruptionLevel: "time-sensitive",
  });

  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toEqual({ success: true });
  expect(requestInput).toBe("https://api.brrr.now/v1/br_usr_test");
  expect(requestInit).toEqual({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: "Coffee Machine Offline",
      subtitle: "Kitchen",
      message: "The coffee machine is currently unreachable.",
      sound: "upbeat_bells",
      open_url: "https://status.example.com/coffee-machine",
      image_url: "https://status.example.com/coffee-machine.png",
      expiration_date: "2026-04-23T09:00:00.000Z",
      "filter-criteria": "ops",
      "interruption-level": "time-sensitive",
    }),
  });
});

test("builds a webhook URL when only the secret is provided", async () => {
  let requestInput: RequestInfo | URL | undefined;

  setFetch(async (input) => {
    requestInput = input;

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  });

  await sendNotification({
    webhook: "br_usr_secret",
    message: "Hello world!",
  });

  expect(requestInput).toBe("https://api.brrr.now/v1/br_usr_secret");
});

test("trims whitespace around a webhook secret before building the URL", async () => {
  let requestInput: RequestInfo | URL | undefined;

  setFetch(async (input) => {
    requestInput = input;

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  });

  await sendNotification({
    webhook: "  br_usr_secret  ",
    message: "Hello world!",
  });

  expect(requestInput).toBe("https://api.brrr.now/v1/br_usr_secret");
});

test("passes string expirationDate through without modification", async () => {
  let requestInit: RequestInit | undefined;

  setFetch(async (_, init) => {
    requestInit = init;

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  });

  await sendNotification({
    webhook: "br_usr_secret",
    message: "Hello world!",
    expirationDate: "2026-04-23T09:00:00.000Z",
  });

  expect(requestInit).toMatchObject({
    body: JSON.stringify({
      message: "Hello world!",
      expiration_date: "2026-04-23T09:00:00.000Z",
    }),
  });
});

test("throws when webhook is empty after trimming", async () => {
  let fetchCalled = false;

  setFetch(async () => {
    fetchCalled = true;

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  });

  const result = sendNotification({
    webhook: "   ",
    message: "Hello world!",
  });

  await expect(result).rejects.toThrow("webhook must not be empty");
  expect(fetchCalled).toBe(false);
});

test("throws a BrrrNowError for non-success HTTP responses", async () => {
  setFetch(async () => {
    return new Response(JSON.stringify({ success: false, error: "Not found" }), {
      status: 404,
      statusText: "Not Found",
    });
  });

  const result = sendNotification({
    webhook: "br_usr_secret",
    message: "Hello world!",
  });

  try {
    await result;
    throw new Error("Expected sendNotification to throw");
  } catch (error) {
    expect(isBrrrNowError(error)).toBe(true);
    expect(error).toMatchObject({
      name: "BrrrNowError",
      status: 404,
      statusText: "Not Found",
      body: JSON.stringify({ success: false, error: "Not found" }),
      apiError: "Not found",
    });
  }
});

test("throws a BrrrNowError when the API responds with success false", async () => {
  setFetch(async () => {
    return new Response(JSON.stringify({ success: false, error: "Not found" }), {
      status: 200,
      statusText: "OK",
      headers: {
        "Content-Type": "application/json",
      },
    });
  });

  const result = sendNotification({
    webhook: "br_usr_secret",
    message: "Hello world!",
  });

  try {
    await result;
    throw new Error("Expected sendNotification to throw");
  } catch (error) {
    expect(isBrrrNowError(error)).toBe(true);
    expect(error).toMatchObject({
      name: "BrrrNowError",
      status: 200,
      statusText: "OK",
      body: JSON.stringify({ success: false, error: "Not found" }),
      apiError: "Not found",
    });
  }
});

test("isBrrrNowError returns false for regular errors", () => {
  expect(isBrrrNowError(new Error("boom"))).toBe(false);
  expect(
    isBrrrNowError({
      name: "BrrrNowError",
      status: 400,
      statusText: "Bad Request",
      body: "invalid request",
    })
  ).toBe(false);
});

function setFetch(fetchImplementation: (...args: Parameters<typeof fetch>) => ReturnType<typeof fetch>): void {
  Object.defineProperty(globalThis, "fetch", {
    value: fetchImplementation as typeof fetch,
    writable: true,
    configurable: true,
  });
}
