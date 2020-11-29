export interface Embed {
  color: string,
  title: string,
  url: string,
  author: {
    name: string,
    image?: string,
    url?: string,
  },
  description: string,
  thumbnail: string,
  fields: {
    name: string,
    value: string,
    inline?: boolean,
  },
  image: string,
  timestamp: boolean,
  footer: {
    value: string,
    image?: string,
  }
}

export interface Command {
  name: string,
  aliases: string[],
  response: string | Partial<Embed>
}
