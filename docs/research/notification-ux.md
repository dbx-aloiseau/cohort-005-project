# In-app Notification UI/UX: best practices for Cadence

Research for issue #4 (map: #2). Question: what are current, vendor-independent best practices for in-app Notification UI/UX in a web app, and what should Cadence do?

Sources are primary: design systems (Apple HIG, Atlassian, Carbon, GitHub Primer and GitHub Docs), Nielsen Norman Group, W3C (WAI-ARIA APG, WCAG 2.2), MDN. Knock docs are cited only where they describe vendor mechanics, because the README already names Knock as the course's notification vendor. Material 3's badge page is rendered client-side and could not be read, so no Material claim is made below.

## Cadence today (repo facts)

- `app/routes/layout.app.tsx` has **no top header**. The shell is a fixed left `Sidebar` (`app/components/sidebar.tsx`, `w-56`, logo row `h-14` at top, user avatar and theme toggle at the bottom) plus `<main>`.
- Toasts already exist: `sonner` `<Toaster position="bottom-right" richColors closeButton />`, used for action feedback in about ten routes and components.
- The sidebar is not responsive (no collapse or breakpoint classes), so there is no mobile layout to slot into yet.

## Findings

### 1. What a Notification is, and when it may interrupt

- NN/g separates **indicators** (passive, contextual), **validations** (tied to user input), and **notifications** (system events the user did not directly trigger). "Action-required notifications are often urgent and should be intrusive"; "Passive notifications are typically not urgent and should be less intrusive." A notification that ignores the current user goal "would likely be ignored." [NN/g, Indicators, Validations, and Notifications](https://www.nngroup.com/articles/indicators-validations-notifications/)
- Carbon ranks types by disruptiveness: inline, toast, actionable, banner, **notification panel**, modal. "Only use a modal when the message is critical and needs the user's immediate attention or action." The panel lets users review system-generated messages "without cluttering the screen." [Carbon, Notification pattern](https://carbondesignsystem.com/patterns/notification-pattern/)
- Primer: "If the user can leave the page during the action, we should utilize GitHub's notification system." Success messaging should be used "sparingly". [Primer, Notification messaging](https://primer.style/product/ui-patterns/notification-messaging/)

**Implication:** Notifications about events other people cause (refund approved, new comment, enrolment) go to a persistent inbox. Feedback on the user's own action stays inline or as the existing sonner toast. A toast is never the only place a Notification lives.

### 2. Toast vs inbox

- Primer: "Toasts pose significant accessibility concerns and are not recommended for use," citing WCAG 2.2.1 Timing Adjustable, 1.3.2 Meaningful Sequence, 2.1.1 Keyboard, and 4.1.3 Status Messages. Long-running tasks should use "banners, plus email, notifications, or push notifications." [Primer, Accessible notifications and messages](https://primer.style/accessibility/toasts/)
- Atlassian flags: "Never use auto dismiss flags for any critical warning or error messages." Stack them newest on top, and "Never use dismissible and non-dismissible flags in a stack." [Atlassian, Flag](https://atlassian.design/components/flag/usage)
- Carbon: "Don't use notifications that dismiss on a timer for critical or emergency messages." Toasts with actions persist until dismissed. [Carbon](https://carbondesignsystem.com/patterns/notification-pattern/)
- WAI-ARIA APG: "avoid designing alerts that disappear automatically"; alerts "do not affect keyboard focus." [APG, Alert pattern](https://www.w3.org/WAI/ARIA/apg/patterns/alert/)
- NN/g: error messages should never rely on a brief toast. [NN/g](https://www.nngroup.com/articles/indicators-validations-notifications/)

### 3. Bell and badge: placement and counting

- Apple HIG: "Use a badge only to show people how many unread notifications they have." "Keep badges up to date." "Update your app's badge as soon as people open the corresponding notifications." "Make sure badging isn't the only method you use to communicate essential information." [Apple HIG, Notifications](https://developer.apple.com/design/human-interface-guidelines/notifications)
- Count cap: no primary design-system page was readable to confirm a number. Implementations vary between 99+ and 999+ (Flutter's Material `Badge` uses 999+). Treat the cap as a product choice. 9+ or 99+ is enough for a course app.
- Unseen vs unread are different counters. Knock defines `seen` as "retrieved for display in the recipient's in-app feed at least once", separate from read and interacted. [Knock, Message statuses](https://docs.knock.app/send-notifications/message-statuses) Its React feed "will mark all items as seen when the feed popover opens" by default, and the badge can switch to `badgeCountType="unread"`. [Knock, React feed](https://docs.knock.app/in-app-ui/react/feed)
- Placement: the convention is a bell beside the user's identity in persistent chrome. Cadence has no header, so the equivalent spot is the sidebar's top row (next to the logo) or the bottom row by the avatar.

### 4. States: unseen / seen / read / archived (done)

- GitHub's inbox supports read and unread, **Done** ("Remove a notification from the inbox with Done"), and **Saved**, and it shows "the reason you're receiving a notification as a label." [GitHub Docs, About notifications](https://docs.github.com/en/subscriptions-and-notifications/concepts/about-notifications)
- Knock's model is the same: seen, read, interacted, archived. Its feed component does not show archived items out of the box. [Knock](https://docs.knock.app/send-notifications/message-statuses)
- Practical mapping: **unseen** drives the badge; **unread** drives per-item styling (dot plus bold, never colour alone, per Atlassian's "Don't rely on color alone"); **archived** removes the item from the list.

### 5. Mark-all-read

- GitHub and Knock both offer bulk read and done actions (Knock exposes `markAllAsRead` in its SDKs). [Knock, React feed](https://docs.knock.app/in-app-ui/react/feed) Opening the popover clears the badge (seen) but should **not** mark everything read. Clicking an item marks that item read; "Mark all as read" is an explicit button in the popover header.

### 6. Grouping and batching

- Apple: "Avoid sending multiple notifications for the same thing, even if someone hasn't responded." [Apple HIG](https://developer.apple.com/design/human-interface-guidelines/notifications)
- NN/g: "If you have more than five notifications that you need to send at once, combine them into a single message." [NN/g, Push notifications](https://www.nngroup.com/articles/push-notification/)
- Carbon: panel items are chronological and "can be grouped by source or urgency." [Carbon](https://carbondesignsystem.com/patterns/notification-pattern/)
- Knock's batch function "collects notifications that have to do with the same subject" in a batch window, and exposes `total_activities` for copy like "left 8 comments." [Knock, Batch function](https://docs.knock.app/designing-workflows/batch-function) Knock also advises: if a message is out of date, archive it and send a new one. [Knock, Feeds overview](https://docs.knock.app/in-app-ui/feeds/overview)

### 7. Deep-linking to the subject

- Each item should open its subject (the Refund Request, lesson comment, course). Knock's provider "will attach a redirect handler if `action_url` is not empty," and the components take `onNotificationClick`. [Knock, React feed](https://docs.knock.app/in-app-ui/react/feed) In a React Router app, use `onNotificationClick` with client-side `navigate()` rather than a full reload, and mark the item read on click.
- Atlassian: "Ensure that links accurately describe the destination." [Atlassian](https://atlassian.design/components/flag/usage)

### 8. Accessibility

- WCAG 4.1.3: status messages must be programmatically determinable "so that they can be presented to the user by assistive technologies without receiving focus." [WCAG 2.2, Understanding 4.1.3](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html)
- MDN: "Normally, only `aria-live="polite"` is used"; assertive "should only be used for time-sensitive/critical notifications." "The most reliable way to ensure that live regions are registered is to include them in the initial markup." Pair `role="status"` with a redundant `aria-live="polite"`. [MDN, ARIA live regions](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions)
- The bell is a disclosure button: Enter and Space toggle it, `aria-expanded` is true or false, and `aria-controls` optionally points at the panel. [APG, Disclosure](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/) The accessible name must carry the count (for example, `aria-label="Notifications, 3 unread"`), because the badge is visual only.
- Toasts must be keyboard-dismissable and not time out critical content (Primer's WCAG list above).

### 9. Empty, loading, and error states

- None of the readable primary sources gives notification-specific empty-state rules. General practice: an empty state that says what will appear here ("You're all caught up. Updates about your courses and refunds will appear here."), a skeleton or spinner while loading, and an inline error with a retry action rather than a toast (Primer recommends banners for failures).

### 10. Narrow and mobile layouts

- Primer lists WCAG 1.4.10 Reflow and 1.4.4 Resize text as toast concerns. [Primer](https://primer.style/accessibility/toasts/) A fixed-width popover must not cause horizontal scroll at 320 CSS px. On narrow screens, the conventional pattern is a full-screen sheet or a dedicated `/notifications` route instead of an anchored popover.

### 11. Preferences

- NN/g: "apps should allow users more control over both the frequency and relevancy of notifications," and "Allow users to edit their notification preferences within the app." [NN/g](https://www.nngroup.com/articles/push-notification/)
- Carbon: "Users should be able to manage or limit noncritical notifications." [Carbon](https://carbondesignsystem.com/patterns/notification-pattern/)
- GitHub combines subscriptions per thread with reason labels and filters. [GitHub Docs](https://docs.github.com/en/subscriptions-and-notifications/concepts/about-notifications)

### 12. Anti-patterns

- **Noise:** notifying "for every little thing" ([NN/g](https://www.nngroup.com/articles/push-notification/)); repeat notifications for the same thing ([Apple](https://developer.apple.com/design/human-interface-guidelines/notifications)).
- **Badge inflation:** counting things that are not unread notifications, or a badge that never clears ([Apple](https://developer.apple.com/design/human-interface-guidelines/notifications)). Badges on every nav item cause the banner-blindness effect Primer warns about for overused toasts.
- **Stale items:** a Notification whose subject has changed (refund already processed, course deleted). Archive or update it rather than leave it misleading ([Knock](https://docs.knock.app/in-app-ui/feeds/overview)). Deep links to deleted subjects need a graceful "no longer available" page.
- **Toast-only delivery** and **auto-dismissing errors** ([Primer](https://primer.style/accessibility/toasts/), [Atlassian](https://atlassian.design/components/flag/usage), [Carbon](https://carbondesignsystem.com/patterns/notification-pattern/)).
- **Stealing focus** when a Notification arrives ([APG](https://www.w3.org/WAI/ARIA/apg/patterns/alert/)).
- **Colour-only state** for unread or severity ([Atlassian](https://atlassian.design/components/flag/usage)).

## Recommendations for Cadence (v1)

1. **One surface: a bell plus popover inbox.** Put the bell in the sidebar's top row, right of the "Cadence" logo, so it is always visible to all four roles. A full `/notifications` page is optional in v1. Add it, or a full-screen sheet, when the shell becomes responsive.
2. **Badge = unseen count**, capped at `9+`, cleared when the popover opens (Knock's default). The bell's accessible name carries the count. If nothing is unseen, show no badge (no empty dot).
3. **Item state:** unread dot plus bold title (not colour alone); click marks read and navigates via `onNotificationClick` → React Router `navigate(action_url)`. An archive "x" per item; a "Mark all as read" button in the popover header. No "Saved" in v1.
4. **No new toasts for Notifications in v1.** Keep sonner for action feedback only. If a live toast is ever added for a high-value event (for example, refund decided), it must persist until dismissed, never steal focus, and also exist in the inbox.
5. **Screen readers:** one polite live region (`role="status"`, `aria-live="polite"`), rendered in the initial layout markup, announcing "N new notifications" on real-time arrival. Never assertive.
6. **Batching:** batch same-subject events per recipient (for example, comments on one lesson within a window) with `total_activities` copy. One Notification per Refund Request state change, never repeats.
7. **Copy:** short title naming actor, verb, and subject ("Priya approved your refund for *Intro to SQL*"), relative timestamp, and the reason when it is not obvious (as GitHub's reason labels do).
8. **States:** an "all caught up" empty state, a skeleton while loading, and an inline error with retry inside the popover.
9. **Stale and deep links:** link targets must handle a deleted or forbidden subject gracefully. Archive superseded Notifications server-side when the subject's state changes.
10. **Preferences:** defer the UI to the "Preferences / opt-out" grilling ticket. The research supports per-type mute for noncritical types as soon as volume grows. Transactional ones (refund decisions) stay on.
11. **Theming:** override the vendor's CSS variables (Knock: `--rnf-*`) to Tailwind tokens, or use headless hooks if the prebuilt popover cannot meet the a11y points above.

## Open points

- Material 3 badge guidance (count cap, placement) could not be read (JS-rendered page). The `9+` cap is a product choice, not a cited rule.
- Whether the vendor's prebuilt popover meets the disclosure and focus-return requirements needs a hands-on check in the prototype ticket.
