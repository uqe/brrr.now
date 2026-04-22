# brrr.now

Minimal TypeScript client for the [brrr.now](https://brrr.now/docs/) notification service.

## Installation

```bash
bun add brrr.now
```

```bash
npm install brrr.now
```

## Usage

```typescript
import { sendNotification } from "brrr.now";

const response = await sendNotification({
  webhook: process.env.BRRR_WEBHOOK!,
  title: "Coffee Machine Offline",
  message: "The coffee machine is currently unreachable.",
  threadId: "ops-coffee",
  sound: "upbeat_bells",
  openUrl: "https://status.example.com/coffee-machine",
  interruptionLevel: "time-sensitive",
});

console.log(await response.json()); // { success: true }
```

`webhook` can be either:

- the full webhook URL from the brrr.now app
- only the secret part, for example `br_usr_a1b2c3`

## API

```typescript
import type {
  NotificationInterruptionLevel,
  NotificationSound,
  SendNotificationParams,
} from "brrr.now";
import { isBrrrNowError, sendNotification } from "brrr.now";
```

`sendNotification(params)` sends a `POST` request with a JSON payload and returns the native `Response`.
On success, the API body is `{"success":true}`.

### `SendNotificationParams`

- `title`
- `subtitle`
- `message`
- `threadId`
- `sound`: `NotificationSound`
- `openUrl`
- `imageUrl`
- `expirationDate`: `string | Date`
- `filterCriteria`
- `interruptionLevel`: `NotificationInterruptionLevel`
- `volume`: `number`

### Error handling

On non-`2xx` responses, or when the API returns `{"success":false,...}`, `sendNotification` throws an `Error` object with extra fields:

- `name: "BrrrNowError"`
- `status`
- `statusText`
- `body`
- `apiError?`

Use `isBrrrNowError` to narrow the error type:

```typescript
import { isBrrrNowError, sendNotification } from "brrr.now";

try {
  await sendNotification({
    webhook: process.env.BRRR_WEBHOOK!,
    message: "Hello world!",
  });
} catch (error) {
  if (isBrrrNowError(error)) {
    console.error(error.status, error.apiError ?? error.body);
  }
}
```

`NotificationInterruptionLevel` supports `passive`, `active`, `time-sensitive`, and `critical`.
The supported sound values follow the official brrr.now documentation, including `emergency` for critical alerts.

## Contributing

Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines.

## License

MIT
