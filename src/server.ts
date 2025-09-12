import express from 'express';
import crypto from 'crypto';
import {
  ChannelType,
  Client,
  GatewayIntentBits,
  ColorResolvable,
} from 'discord.js';

const app = express();
app.use(express.json());
const port = process.env.PORT || 3000;

const token = process.env.DISCORD_TOKEN;
const defaultGuildId = process.env.DISCORD_GUILD_ID;

const encryptionKey =
  process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
if (!process.env.ENCRYPTION_KEY) {
  console.warn(`Generated encryption key: ${encryptionKey}`);
}

let client: Client | null = null;

if (token) {
  client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
  });
  client.once('ready', () => {
    console.log(`Logged in as ${client?.user?.tag}`);
  });
  client.login(token).catch((err: Error) => {
    console.error('Failed to login to Discord', err);
  });
} else {
  console.warn('DISCORD_TOKEN not provided, Discord features disabled');
}

async function resolveGuild(guildId?: string) {
  if (!client) throw new Error('Discord client not configured');
  const id = guildId ?? defaultGuildId;
  if (!id) throw new Error('guild id not provided');
  return client.guilds.fetch(id);
}

// Channel helpers
async function createChannel(params: {
  guildId?: string;
  name: string;
  type?: string;
  parentId?: string;
  position?: number;
}) {
  const guild = await resolveGuild(params.guildId);
  const channel = await guild.channels.create({
    name: params.name,
    type: params.type === 'voice' ? ChannelType.GuildVoice : ChannelType.GuildText,
    parent: params.parentId,
  });
  if (params.position !== undefined)
    await (channel as any).setPosition(params.position);
  return { id: channel.id, name: channel.name };
}

async function updateChannel(id: string, params: {
  guildId?: string;
  name?: string;
  parentId?: string;
  position?: number;
}) {
  const guild = await resolveGuild(params.guildId);
  const channel = await guild.channels.fetch(id);
  if (!channel) throw new Error('channel not found');
  await channel.edit({ name: params.name, parent: params.parentId });
  if (params.position !== undefined)
    await (channel as any).setPosition(params.position);
  return { id: channel.id, name: channel.name };
}

async function deleteChannel(id: string, params: { guildId?: string }) {
  const guild = await resolveGuild(params.guildId);
  const channel = await guild.channels.fetch(id);
  if (!channel) throw new Error('channel not found');
  await channel.delete();
  return { success: true };
}

// Category helpers
async function createCategory(params: {
  guildId?: string;
  name: string;
  position?: number;
}) {
  const guild = await resolveGuild(params.guildId);
  const category = await guild.channels.create({
    name: params.name,
    type: ChannelType.GuildCategory,
  });
  if (params.position !== undefined)
    await (category as any).setPosition(params.position);
  return { id: category.id, name: category.name };
}

async function updateCategory(id: string, params: {
  guildId?: string;
  name?: string;
  position?: number;
}) {
  const guild = await resolveGuild(params.guildId);
  const category = await guild.channels.fetch(id);
  if (!category || category.type !== ChannelType.GuildCategory)
    throw new Error('category not found');
  await category.edit({ name: params.name });
  if (params.position !== undefined)
    await (category as any).setPosition(params.position);
  return { id: category.id, name: category.name };
}

async function deleteCategory(id: string, params: { guildId?: string }) {
  const guild = await resolveGuild(params.guildId);
  const category = await guild.channels.fetch(id);
  if (!category || category.type !== ChannelType.GuildCategory)
    throw new Error('category not found');
  await category.delete();
  return { success: true };
}

// Role helpers
async function createRole(params: {
  guildId?: string;
  name: string;
  color?: ColorResolvable;
  position?: number;
}) {
  const guild = await resolveGuild(params.guildId);
  const role = await guild.roles.create({
    name: params.name,
    color: params.color,
  });
  if (params.position !== undefined) await role.setPosition(params.position);
  return { id: role.id, name: role.name };
}

async function updateRole(id: string, params: {
  guildId?: string;
  name?: string;
  position?: number;
}) {
  const guild = await resolveGuild(params.guildId);
  const role = await guild.roles.fetch(id);
  if (!role) throw new Error('role not found');
  await role.edit({ name: params.name });
  if (params.position !== undefined) await role.setPosition(params.position);
  return { id: role.id, name: role.name };
}

async function deleteRole(id: string, params: { guildId?: string }) {
  const guild = await resolveGuild(params.guildId);
  const role = await guild.roles.fetch(id);
  if (!role) throw new Error('role not found');
  await role.delete();
  return { success: true };
}

async function listRoles(params: { guildId?: string }) {
  const guild = await resolveGuild(params.guildId);
  await guild.members.fetch();
  const roles = await guild.roles.fetch();
  return roles.map((r: any) => ({ id: r.id, name: r.name, members: r.members.size }));
}

// Webhook helper
async function editWebhook(id: string, params: { name?: string; channelId?: string }) {
  if (!client) throw new Error('Discord client not configured');
  const webhook = await client.fetchWebhook(id);
  await webhook.edit({ name: params.name, channel: params.channelId });
  return { id: webhook.id, name: webhook.name };
}

// Express routes

app.post('/channels', async (req, res) => {
  try {
    const result = await createChannel(req.body);
    res.json(result);
  } catch (err: any) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

app.put('/channels/:id', async (req, res) => {
  try {
    const result = await updateChannel(req.params.id, req.body);
    res.json(result);
  } catch (err: any) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

app.delete('/channels/:id', async (req, res) => {
  try {
    await deleteChannel(req.params.id, req.body);
    res.sendStatus(204);
  } catch (err: any) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

app.post('/categories', async (req, res) => {
  try {
    const result = await createCategory(req.body);
    res.json(result);
  } catch (err: any) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

app.put('/categories/:id', async (req, res) => {
  try {
    const result = await updateCategory(req.params.id, req.body);
    res.json(result);
  } catch (err: any) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

app.delete('/categories/:id', async (req, res) => {
  try {
    await deleteCategory(req.params.id, req.body);
    res.sendStatus(204);
  } catch (err: any) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

app.get('/roles', async (req, res) => {
  try {
    const roles = await listRoles({ guildId: req.query.guildId as string });
    res.json(roles);
  } catch (err: any) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

app.post('/roles', async (req, res) => {
  try {
    const result = await createRole(req.body);
    res.json(result);
  } catch (err: any) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

app.put('/roles/:id', async (req, res) => {
  try {
    const result = await updateRole(req.params.id, req.body);
    res.json(result);
  } catch (err: any) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

app.delete('/roles/:id', async (req, res) => {
  try {
    await deleteRole(req.params.id, req.body);
    res.sendStatus(204);
  } catch (err: any) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

app.put('/webhooks/:id', async (req, res) => {
  try {
    const result = await editWebhook(req.params.id, req.body);
    res.json(result);
  } catch (err: any) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

app.get('/guilds', async (_req, res) => {
  try {
    if (!client) throw new Error('Discord client not configured');
    const guilds = await client.guilds.fetch();
    const result = guilds.map((g: any) => ({ id: g.id, name: g.name }));
    res.json(result);
  } catch (err: any) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

app.post('/bulk', async (req, res) => {
  const { operations } = req.body;
  const results: any[] = [];
  for (const op of operations || []) {
    try {
      switch (op.action) {
        case 'createChannel':
          results.push(await createChannel(op.params));
          break;
        case 'updateChannel':
          results.push(await updateChannel(op.params.id, op.params));
          break;
        case 'deleteChannel':
          results.push(await deleteChannel(op.params.id, op.params));
          break;
        case 'createCategory':
          results.push(await createCategory(op.params));
          break;
        case 'updateCategory':
          results.push(await updateCategory(op.params.id, op.params));
          break;
        case 'deleteCategory':
          results.push(await deleteCategory(op.params.id, op.params));
          break;
        case 'createRole':
          results.push(await createRole(op.params));
          break;
        case 'updateRole':
          results.push(await updateRole(op.params.id, op.params));
          break;
        case 'deleteRole':
          results.push(await deleteRole(op.params.id, op.params));
          break;
        case 'editWebhook':
          results.push(await editWebhook(op.params.id, op.params));
          break;
        default:
          results.push({ error: `unknown action ${op.action}` });
      }
    } catch (err: any) {
      results.push({ error: err.message });
    }
  }
  res.json(results);
});

app.get('/', (_req, res) => {
  res.send('MCP server is running');
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
