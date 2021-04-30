export interface User {
  id: string,
  discord: {
    id: string,
    token?: string,
  },
  canvas: Partial<{
    id?: string,
    token?: string
    instanceID: string,
    lastAssignment: string
  }>,
  courses?: string[],
}
