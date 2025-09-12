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

Channel and category management requires a Discord bot token and guild ID available as environment variables:

```bash
export DISCORD_TOKEN="your-bot-token"
export DISCORD_GUILD_ID="target-guild-id"
```

The server exposes REST endpoints for creating, updating and deleting channels and categories:

- `POST /channels` – create a text or voice channel
- `PUT /channels/:id` – rename or move an existing channel
- `DELETE /channels/:id` – remove a channel
- `POST /categories` – create a channel category
- `PUT /categories/:id` – rename a category
- `DELETE /categories/:id` – remove a category

## Testing

The project currently has no tests but the placeholder script can be executed:

```bash
npm test
```
