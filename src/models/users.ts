export interface User {
  id: string,
  discord: {
    id: string,
    token?: UserHash,
  },
  canvas: Partial<{
    id: string,
    token: UserHash,
    tokenType: 'access' | 'refresh',
    instanceID: string,
    lastAssignment: string
  }>,
  courses?: number[],
}

export interface UserHash {
  iv: string,
  content: string,
}
