export function getEpoch(): number {
  return Math.round(new Date().valueOf() / 1000);
}

export function getShardId(guild: string, shards: number): number {
  const id = Number(guild);
  return (id >>> 22) % shards;
}