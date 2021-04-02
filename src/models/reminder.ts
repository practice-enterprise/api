export interface Reminder {
  id: string,
  idType: 'channel' | 'user'
  guild?: string;
  date: Date,
  content: string;
}
