export type ReminderTarget = {
  user: string
} | {
  guild: string,
  channel: string,
  user: string
};

export interface Reminder {
  id: string;
  date: string,
  content: string;
  target: ReminderTarget
}

export function isGuildTarget(target: ReminderTarget): target is ({ guild: string, channel: string, user: string }) {
  return (target as { guild: string, channel: string, user: string }).guild != null;
}
