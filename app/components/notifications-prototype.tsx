// PROTOTYPE — throwaway (wayfinder ticket "Prototype the notification bell and inbox
// in Cadence's sidebar"). Three variants of the Notification bell, switchable via
// ?variant=A|B|C, all live against Knock:
//   A — Knock's ready-made bell + popover, themed with --rnf-* CSS variables
//   B — Knock hooks rendered as our own bell + popover (Radix Popover)
//   C — Knock hooks rendered as a bell opening a full-height panel beside the sidebar
import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Popover, Dialog } from "radix-ui";
import { Bell, X, CheckCheck } from "lucide-react";
import {
  KnockProvider,
  KnockFeedProvider,
  NotificationIconButton,
  NotificationFeedPopover,
  useKnockFeed,

} from "@knocklabs/react";
import type { FeedItem } from "@knocklabs/client";
import "@knocklabs/react/dist/index.css";
import { cn } from "~/lib/utils";

export const NOTIFICATION_VARIANTS = [
  { key: "A", name: "Knock ready-made popover" },
  { key: "B", name: "Own popover on Knock hooks" },
  { key: "C", name: "Own side panel on Knock hooks" },
];

export interface KnockConfig {
  publicKey: string;
  feedChannelId: string;
}

type ItemData = { title?: string; body?: string; url?: string };

export function NotificationsPrototype({
  config,
  userId,
}: {
  config: KnockConfig | null;
  userId: number | null;
}) {
  const [searchParams] = useSearchParams();
  const variant = searchParams.get("variant") ?? "A";
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!config || !userId)
    return (
      <span className="text-xs text-red-500" title="Knock not configured">
        no knock
      </span>
    );
  if (!mounted) return <div className="size-8" />;

  return (
    <KnockProvider apiKey={config.publicKey} user={{ id: String(userId) }}>
      <KnockFeedProvider feedId={config.feedChannelId}>
        {variant === "A" && <VariantA />}
        {variant === "B" && <VariantB />}
        {variant === "C" && <VariantC />}
      </KnockFeedProvider>
    </KnockProvider>
  );
}

// ─── A: Knock ready-made ────────────────────────────────────────────────────
function VariantA() {
  const [isVisible, setIsVisible] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();
  return (
    <div
      style={
        {
          "--rnf-font-family-sanserif": "inherit",
          "--rnf-color-brand-500": "var(--primary)",
        } as React.CSSProperties
      }
    >
      <NotificationIconButton
        ref={buttonRef}
        onClick={() => setIsVisible(!isVisible)}
      />
      <NotificationFeedPopover
        buttonRef={buttonRef}
        isVisible={isVisible}
        onClose={() => setIsVisible(false)}
        placement="bottom-start"
        onNotificationClick={(item) => {
          const url = (item.data as ItemData | null)?.url;
          if (url) {
            setIsVisible(false);
            navigate(url);
          }
        }}
      />
    </div>
  );
}

// ─── Shared headless bits for B and C ───────────────────────────────────────
function useFeed() {
  const { feedClient, useFeedStore } = useKnockFeed();
  const items = useFeedStore((s) => s.items);
  const metadata = useFeedStore((s) => s.metadata);
  const loading = useFeedStore((s) => s.loading);
  useEffect(() => {
    feedClient.fetch();
  }, [feedClient]);
  return { feedClient, items, unseen: metadata.unseen_count, loading };
}

function badgeText(n: number) {
  return n > 9 ? "9+" : String(n);
}

function LiveRegion({ unseen }: { unseen: number }) {
  // Polite announcement when new Notifications arrive; region exists from first render.
  const prev = useRef(unseen);
  const [msg, setMsg] = useState("");
  useEffect(() => {
    if (unseen > prev.current)
      setMsg(
        `${unseen - prev.current} new notification${unseen - prev.current > 1 ? "s" : ""}`
      );
    prev.current = unseen;
  }, [unseen]);
  return (
    <div role="status" aria-live="polite" className="sr-only">
      {msg}
    </div>
  );
}

function BellButton({
  unseen,
  open,
  ...props
}: { unseen: number; open: boolean } & React.ComponentProps<"button">) {
  return (
    <button
      {...props}
      aria-label={
        unseen > 0 ? `Notifications, ${unseen} new` : "Notifications"
      }
      aria-expanded={open}
      className="relative rounded-md p-1.5 text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
    >
      <Bell className="size-5" />
      {unseen > 0 && (
        <span className="absolute -right-0.5 -top-0.5 min-w-4 rounded-full bg-red-600 px-1 text-center text-[10px] font-bold leading-4 text-white">
          {badgeText(unseen)}
        </span>
      )}
    </button>
  );
}

function timeAgo(iso: string) {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

function FeedList({
  onNavigate,
  dense,
}: {
  onNavigate: () => void;
  dense?: boolean;
}) {
  const { feedClient, items, loading } = useFeed();
  const navigate = useNavigate();
  const visible = items.filter((i) => !i.archived_at);

  if (loading && visible.length === 0)
    return (
      <ul className="space-y-2 p-3" aria-busy="true">
        {[0, 1, 2].map((i) => (
          <li key={i} className="h-12 animate-pulse rounded-md bg-muted" />
        ))}
      </ul>
    );

  if (visible.length === 0)
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">
        <CheckCheck className="mx-auto mb-2 size-6" />
        You're all caught up.
      </div>
    );

  return (
    <ul className="divide-y divide-border">
      {visible.map((item: FeedItem) => {
        const data = (item.data ?? {}) as ItemData;
        const unread = !item.read_at;
        return (
          <li key={item.id} className="group relative flex">
            <button
              className={cn(
                "flex flex-1 gap-3 px-4 text-left hover:bg-accent",
                dense ? "py-2" : "py-3"
              )}
              onClick={() => {
                feedClient.markAsRead(item);
                onNavigate();
                if (data.url) navigate(data.url);
              }}
            >
              <span
                aria-hidden
                className={cn(
                  "mt-1.5 size-2 shrink-0 rounded-full",
                  unread ? "bg-blue-600" : "bg-transparent"
                )}
              />
              <span className="min-w-0 flex-1">
                <span
                  className={cn(
                    "block text-sm",
                    unread ? "font-semibold" : "font-normal text-muted-foreground"
                  )}
                >
                  {unread && <span className="sr-only">Unread: </span>}
                  {data.title ?? "Notification"}
                </span>
                {data.body && (
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {data.body}
                  </span>
                )}
                <span className="mt-1 block text-[11px] text-muted-foreground/70">
                  {timeAgo(item.inserted_at)}
                </span>
              </span>
            </button>
            <button
              aria-label={`Archive: ${data.title ?? "notification"}`}
              onClick={() => feedClient.markAsArchived(item)}
              className="absolute right-2 top-2 rounded p-1 text-muted-foreground opacity-0 hover:bg-muted focus:opacity-100 group-hover:opacity-100"
            >
              <X className="size-3.5" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function FeedHeader({ onClose }: { onClose?: () => void }) {
  const { feedClient } = useKnockFeed();
  return (
    <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
      <h2 className="text-sm font-semibold">Notifications</h2>
      <div className="flex items-center gap-1">
        <button
          onClick={() => feedClient.markAllAsRead()}
          className="rounded px-2 py-1 text-xs text-primary hover:bg-accent"
        >
          Mark all as read
        </button>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close notifications"
            className="rounded p-1 hover:bg-accent"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── B: own popover ─────────────────────────────────────────────────────────
function VariantB() {
  const { feedClient, unseen } = useFeed();
  const [open, setOpen] = useState(false);
  return (
    <>
      <LiveRegion unseen={unseen} />
      <Popover.Root
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (o) feedClient.markAllAsSeen();
        }}
      >
        <Popover.Trigger asChild>
          <BellButton unseen={unseen} open={open} />
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            side="right"
            align="start"
            sideOffset={8}
            className="z-50 w-96 overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-xl"
          >
            <FeedHeader />
            <div className="max-h-[28rem] overflow-y-auto">
              <FeedList onNavigate={() => setOpen(false)} />
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </>
  );
}

// ─── C: side panel ──────────────────────────────────────────────────────────
function VariantC() {
  const { feedClient, unseen } = useFeed();
  const [open, setOpen] = useState(false);
  return (
    <>
      <LiveRegion unseen={unseen} />
      <Dialog.Root
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (o) feedClient.markAllAsSeen();
        }}
      >
        <Dialog.Trigger asChild>
          <BellButton unseen={unseen} open={open} />
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 left-56 z-40 bg-black/20" />
          <Dialog.Content className="fixed bottom-0 left-56 top-0 z-50 flex w-[26rem] flex-col border-r border-border bg-background shadow-2xl">
            <Dialog.Title className="sr-only">Notifications</Dialog.Title>
            <Dialog.Description className="sr-only">
              Your recent notifications
            </Dialog.Description>
            <FeedHeader onClose={() => setOpen(false)} />
            <div className="flex-1 overflow-y-auto">
              <FeedList onNavigate={() => setOpen(false)} dense />
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
