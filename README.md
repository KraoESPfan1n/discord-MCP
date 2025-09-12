# discord-MCP

Base server implementing a minimal setup for a Model Context Protocol (MCP) service using Node.js and Express.

## Development

Install dependencies:

```bash
npm install
```

Run in development mode with automatic reload:

```bash
npm run dev
```

## Production build

Compile the TypeScript sources and start the server:

```bash
npm run build
npm start
```

### Discord integration

Channel, category and role management requires a Discord bot token and guild ID available as environment variables:

```bash
export DISCORD_TOKEN="your-bot-token"
export DISCORD_GUILD_ID="target-guild-id" # optional, can be overridden per request
```

An optional `ENCRYPTION_KEY` can be provided. If omitted, a random key is generated at runtime.

The server exposes REST endpoints for guild administration:

- `POST /channels` – create a text or voice channel
- `PUT /channels/:id` – rename or move an existing channel
- `DELETE /channels/:id` – remove a channel
- `POST /categories` – create a channel category
- `PUT /categories/:id` – rename or move a category
- `DELETE /categories/:id` – remove a category
- `GET /roles` – list roles with member counts
- `POST /roles` – create a role
- `PUT /roles/:id` – rename or move a role
- `DELETE /roles/:id` – remove a role
- `PUT /webhooks/:id` – edit a webhook
- `GET /guilds` – list guilds the bot is in
- `POST /bulk` – execute multiple actions in a single request

All creation and update routes accept an optional `guildId` field to target a specific guild.

### Components V2

Reference limits for Discord Components V2 are documented in [docs/components-v2.md](docs/components-v2.md) and exported as constants in `src/componentsV2.ts`.

## Testing

The project currently has no tests but the placeholder script can be executed:

```bash
npm test
```
