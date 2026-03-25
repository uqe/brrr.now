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

await sendNotification({
	webhook: process.env.BRRR_WEBHOOK!,
	title: "Coffee Machine Offline",
	message: "The coffee machine is currently unreachable.",
	sound: "upbeat_bells",
	openUrl: "https://status.example.com/coffee-machine",
});
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

### `SendNotificationParams`

- `title`
- `subtitle`
- `message`
- `sound`: `NotificationSound`
- `openUrl`
- `imageUrl`
- `expirationDate`: `string | Date`
- `filterCriteria`
- `interruptionLevel`: `NotificationInterruptionLevel`

### Error handling

On non-`2xx` responses, `sendNotification` throws an `Error` object with extra fields:

- `name: "BrrrNowError"`
- `status`
- `statusText`
- `body`

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
		console.error(error.status, error.body);
	}
}
```

The supported sound values follow the official brrr.now documentation.

## Contributing

Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines.

## License

MIT
