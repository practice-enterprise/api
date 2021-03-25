export interface User {
  _id: string,
  discord: {
    id: string,
    token: string | null,
  }
  canvas: {
    id: string | null,
    token: string | null,
  }
}
