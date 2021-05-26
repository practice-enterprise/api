/**https://discord.com/developers/docs/topics/oauth2#authorization-code-grant-access-token-response */
export interface DiscordTokenResponse {
  access_token: string,
  token_type: string,
  expires_in: number,
  refresh_token: string, // always returned also when refreshing (new refresh token)
  scope: string
}

/**https://canvas.instructure.com/doc/api/file.oauth_endpoints.html */
export interface CanvasTokenResponse {
  access_token: string,
  token_type: string,
  user: { id: number | string, name: string, global_id: string, effective_locale: string },
  refresh_token?: string, // Not returned if asking for a refresh token
  expires_in: number
}
