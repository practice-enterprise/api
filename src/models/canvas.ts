export interface CanvasInstance {
  _id: string,
  endpoint: string,
  /**CourseID key + last announcement ID*/
  lastAnnounce: Record<string, string>,
}
