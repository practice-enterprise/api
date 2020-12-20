export function getEpoch(): number {
  return Math.round(new Date().valueOf() / 1000);
}
