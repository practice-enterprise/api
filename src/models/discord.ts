export interface DiscordPartialGuild {
  id: string,
  name: string,
  icon: string,
  owner: boolean,
  permissions: string,
  features: string[]
}

export interface DiscordUser {
  id: string,
  username: string,
  discriminator: string,
  avatar: string,
  bot?: boolean,
  system?: boolean,
  mfa_enabled?: boolean,
  locale?: string,
  verified?: boolean,
  email?: string,
  flags?: number,
  premium_type?: number,
  public_flags?: number
}

export interface DiscordTeam {
  icon: string,
  id: string,
  members: DiscordTeamMember,
  owner_user_id: string
}

export interface DiscordTeamMember {
  membership_state: DiscordMembershipState,
  permissions: string[],
  team_id: string,
  user: DiscordUser
}

export enum DiscordMembershipState {
  Invited = 1,
  Accepted
}

export interface DiscordApplication {
  id: string,
  name: string,
  icon: string,
  description: string,
  rpc_origins?: string[],
  bot_public: boolean,
  bot_require_code_grant: boolean,
  terms_of_service_url?: string,
  privacy_policy_url?: string,
  owner: DiscordUser,
  summary: string,
  verify_key: string,
  team: DiscordTeam,
  guild_id?: string,
  primary_sku_id?: string,
  slug?: string,
  cover_image?: string,
  flags: number
}

export interface DiscordAuthInfo {
  application: DiscordApplication,
  scopes: string[],
  expires: number,
  user?: DiscordUser
}
