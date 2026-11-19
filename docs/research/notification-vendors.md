# In-app notification vendors for Cadence

Research for [issue #3](https://github.com/dbx-aloiseau/cohort-005-project/issues/3), part of [map #2](https://github.com/dbx-aloiseau/cohort-005-project/issues/2).
All facts come from vendor docs, vendor pricing pages, vendor GitHub repos or the npm registry. **Pricing and versions were checked on 2026-11-19.** Facts marked _unverified_ could not be confirmed from a primary source.

Requirements (from the map): React Router 8, React 19 and Tailwind 4 app; Node server; a free tier is mandatory; in-app only for v1; adding email later must not need a migration; hosted SaaS preferred.

## Shortlist

1. **Novu** (recommended).
   - **Free tier:** 10k workflow runs/mo with unlimited subscribers.
   - **UI:** `@novu/react` `<Inbox/>` declares React 19 in its peer range. Its `appearance.elements` takes **Tailwind class strings**, which makes it the best Tailwind fit found.
   - **Features:** HMAC client auth is optional in dev. Topics handle fan-out. It has a digest step. Email is just another step in the same workflow.
   - **Bonus:** open-source and self-hostable.
   - **Cheap paid tier:** $30/mo.
   - **Limits:** 5 workflows on free, which is enough for a v1 catalogue only if it stays small. Activity-log retention is 24h.
2. **Knock** (most polished SaaS).
   - **Free tier:** 10k messages/mo, unlimited feed retention, and batching and preferences included.
   - **UI:** `@knocklabs/react` declares React 19 in its peer range, and its headless hooks are mature.
   - **Features:** object subscriptions give clean fan-out with dedupe and actor exclusion. JWT enhanced security is optional in dev.
   - **Drawbacks:** theming is via `--rnf-*` CSS vars or custom renderers, not Tailwind classes. The next tier is a $250/mo cliff, and there is no self-host option.
3. **MagicBell** (simplest inbox, if preferences UI matters).
   - **UI:** prebuilt `FloatingInbox` and `UserPreferences` components, with CSS vars plus an `unstyled` prop.
   - **Drawbacks:**
     - The free tier is only **1,000 deliveries/mo**, and fan-out counts once per recipient.
     - No digests.
     - A server-signed JWT is required from day one.
     - React 19 support is not stated.

**Not shortlisted:**
- **Courier:** 10k free and a prebuilt preferences component. But a JWT is mandatory even in dev, theming uses JS theme objects with no Tailwind hooks, and once you leave free every send is billed.
- **SuprSend:** 10k free. But preferences and digests need the $250 Business plan, and theming uses inline style objects.
- **Stream:** hooks only, no inbox UI, and no email channel.
- **OneSignal:** no web inbox at all.
- **Engagespot:** the website returns 404 and the code looks inactive.

## Comparison

| Vendor | Free tier (2026-11-19) | React inbox / hooks | Tailwind theming | Realtime | Preferences | Node SDK | Group fan-out | Batch / digest | Email later | Client auth | Self-host | Past free |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Novu** | 10k runs/mo, unlimited subscribers, 5 workflows, 3 seats, 24h activity retention | `@novu/react` 3.20 `<Inbox/>`, `<Preferences/>`, hooks + headless mode; React ^18\|\|^19 | `appearance.elements` accepts Tailwind classes; best | WebSocket | Built-in UI + API | `@novu/api` | Topics (≤100k subs); 1 run per recipient | Digest step (free-tier limits _unverified_) | Add email step in same workflow | HMAC `subscriberHash`, optional toggle | Yes, MIT open core (`/enterprise` proprietary) | Pro $30/mo (30k runs), Team $250 |
| **Knock** | 10k messages/mo, unlimited seats, unlimited feed retention; batching + prefs included | `@knocklabs/react` 0.15.2 feed/popover/bell + hooks; React 17–19 | `--rnf-*` CSS vars, or skip CSS and use renderers/hooks | Real-time service (Phoenix channels, inferred) | API + hooks; build your own UI | `@knocklabs/node` | Objects + subscriptions, dedupe, actor exclusion | Batch function, on free | Add email step in same workflow | RS256 JWT (`signUserToken`), optional | No | Starter $250/mo (50k), then $0.005/msg |
| **MagicBell** | 1,000 deliveries/mo (per channel), 1 project, unlimited users | `@magicbell/react` 1.14 `FloatingInbox`, `Inbox`, `UserPreferences`; headless pkg; React 19 _unverified_ | CSS vars + `unstyled` prop | WebSocket | Prebuilt `UserPreferences` | `magicbell-js` | Broadcasts to topics, ≤1,000 recipients | None documented | Add email provider in same project | HS256 JWT, required | No | Startup $249/mo (50k) |
| **Courier** | 10k sends/mo; inbox/digest on free _unverified_ | `@trycourier/courier-react` 9.3.5 `<CourierInbox/>`, `<CourierPreferences/>`, `useCourier`; React >=18 | JS theme objects; weakest | WebSocket (after `listenForUpdates()`) | Prebuilt `<CourierPreferences/>` | `@trycourier/courier` | Lists / audiences | Journeys batch & digest nodes | Multi-channel routing per send | Backend-minted JWT, **required** | No | $0.005/send incl. first 10k |
| **SuprSend** | 10k notifs/mo, 30-day logs, branded inbox; **no prefs, no digest** | `@suprsend/react` 1.6 `Inbox` + hooks; React >=16.8 | `theme` inline-style objects; no CSS vars | "Feed socket" (protocol _unverified_) | API + hooks; **Business plan only** | `@suprsend/node-sdk` | Lists + trigger-on-list, broadcasts (free) | Batch/digest **Business $250 only** | Email step in same workflow | ES256 JWT (enhanced security) | No (BYOC enterprise beta) | Essentials $100, Business $250 |
| **Stream Feeds v3** | 125k API calls, 5k activities/mo | `@stream-io/feeds-react-sdk` **hooks only**, no inbox UI; React 17–19 | Full control (you build it) | WebSocket | None found | `@stream-io/node-sdk` | Follows / multi-feed add | Aggregation only, no digest | **None**: needs another vendor | Server-signed user token | No | $499–599/mo |
| **OneSignal** | Free; in-app msgs unlimited ≤1k MAU | **No web inbox**: in-app messages are mobile-only, and it doesn't store history | n/a | n/a | n/a | n/a | n/a | n/a | Has email, but no inbox | Identity verification not on Web SDK | No | Growth from $19/mo |
| **Engagespot** | Vendor site 404; third-party only says 10k triggers | `@engagespot/react-component` 3.0.1 (May 2025) | `theme` object | _unverified_ | Hook (_unverified_) | `@engagespot/node` 1.7.0 (Nov 2024) | Topics (_unverified_) | Batching (_unverified_) | _unverified_ | HMAC `userSignature`, optional | _unverified_ | Looks inactive |

**Newcomers checked:** NotificationAPI has rebranded to Pingram. Its pricing page lists a free allowance for SMS, email and voice, and mentions no in-app inbox, so it was not a contender ([pricing](https://www.pingram.io/pricing)). No other newcomer with a mature React inbox and a free tier turned up.

## Gotchas for Cadence

- **Fan-out is billed per recipient** on Novu, Knock and MagicBell. Notifying "all Platform Admins" with N admins costs N runs, messages or deliveries.
- **Client auth vs the DevUI login:**
  - Novu and Knock work with only a public key or app ID in dev. You add HMAC or JWT signing later as a server loader keyed on the session user.
  - Courier, MagicBell and SuprSend need that signing endpoint from day one.
- **Novu's 5-workflow free cap:** each Notification type is usually its own workflow. Keep the v1 catalogue at 5 types or fewer, or put several types in one workflow and branch on the payload.
- **Not verified for any vendor:** what free-tier inbox *item* retention is (as opposed to log retention).

## Sources

**Novu**
- Pricing: https://novu.co/pricing
- React package: https://raw.githubusercontent.com/novuhq/novu/next/packages/react/package.json
- Styling: https://docs.novu.co/platform/inbox/configuration/styling
- Headless mode: https://docs.novu.co/platform/inbox/headless-mode
- Inbox overview: https://docs.novu.co/platform/inbox/overview
- Prepare for production (HMAC, socket): https://docs.novu.co/platform/inbox/prepare-for-production
- Topics: https://docs.novu.co/platform/concepts/topics
- Digest: https://docs.novu.co/platform/workflow/add-and-configure-steps/configure-action-steps/digest
- Node SDK: https://registry.npmjs.org/@novu/api/latest
- License: https://github.com/novuhq/novu

**Knock**
- Pricing: https://knock.app/pricing
- React package: https://raw.githubusercontent.com/knocklabs/javascript/main/packages/react/package.json
- Feed: https://docs.knock.app/in-app-ui/react/feed
- React overview: https://docs.knock.app/in-app-ui/react/overview
- Feeds overview: https://docs.knock.app/in-app-ui/feeds/overview
- Security and authentication: https://docs.knock.app/in-app-ui/security-and-authentication
- Subscriptions: https://docs.knock.app/concepts/subscriptions
- Batch function: https://docs.knock.app/designing-workflows/batch-function
- Node SDK: https://registry.npmjs.org/@knocklabs/node/latest

**MagicBell**
- Pricing: https://www.magicbell.com/pricing
- React library: https://www.magicbell.com/docs/libraries/magicbell-react
- JS library: https://www.magicbell.com/docs/libraries/magicbell-js
- Broadcast: https://www.magicbell.com/docs/primitive/broadcast
- User authentication: https://www.magicbell.com/docs/api/authentication/user

**Courier**
- Pricing: https://www.courier.com/pricing
- React web SDK: https://www.courier.com/docs/sdk-libraries/courier-react-web
- Lists: https://www.courier.com/docs/platform/users/lists
- Digest: https://www.courier.com/docs/platform/automations/digest
- React package: https://registry.npmjs.org/@trycourier/courier-react/latest

**SuprSend**
- Pricing: https://www.suprsend.com/pricing
- React inbox: https://docs.suprsend.com/docs/react-inbox-integration.md
- Customisation: https://docs.suprsend.com/docs/web-components-customisations.md
- In-app feed: https://docs.suprsend.com/docs/react-in-app-feed.md
- Preferences: https://docs.suprsend.com/docs/preference-react-sdk.md
- Lists: https://docs.suprsend.com/docs/lists.md
- Digest: https://docs.suprsend.com/docs/digest.md
- Client authentication: https://docs.suprsend.com/docs/client-authentication.md

**Stream**
- Pricing: https://getstream.io/activity-feeds/pricing/
- React installation: https://getstream.io/activity-feeds/docs/react/installation/
- Notification feeds: https://getstream.io/activity-feeds/docs/react/notification-feeds/
- Node docs: https://getstream.io/activity-feeds/docs/node/
- Follows: https://getstream.io/activity-feeds/docs/node/follows/

**OneSignal**
- Pricing: https://onesignal.com/pricing
- In-app messages setup: https://documentation.onesignal.com/docs/en/in-app-messages-setup
- Activity feed guide: https://documentation.onesignal.com/docs/en/create-an-activity-feed.md
- Identity verification: https://documentation.onesignal.com/docs/en/identity-verification

**Engagespot**
- HMAC authentication: https://docs.engagespot.co/docs/1.0.0/user/enabling-hmac-authentication/
- Site status: engagespot.co returned 404 when checked on 2026-11-19.
