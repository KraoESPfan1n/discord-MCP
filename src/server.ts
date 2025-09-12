import express from 'express';
import { ChannelType, Client, GatewayIntentBits } from 'discord.js';

const app = express();
app.use(express.json());
const port = process.env.PORT || 3000;

const token = process.env.DISCORD_TOKEN;
const guildId = process.env.DISCORD_GUILD_ID;

let client: Client | null = null;

if (token) {
  client = new Client({ intents: [GatewayIntentBits.Guilds] });
  client.once('ready', () => {
    console.log(`Logged in as ${client?.user?.tag}`);
  });
  client.login(token).catch((err) => {
    console.error('Failed to login to Discord', err);
  });
} else {
  console.warn('DISCORD_TOKEN not provided, Discord features disabled');
}

async function getGuild() {
  if (!client || !guildId) {
    throw new Error('Discord client not configured');
  }
  return client.guilds.fetch(guildId);
}

app.post('/channels', async (req, res) => {
  try {
    const { name, type = 'text', parentId } = req.body;
    if (!name) return res.status(400).send('name is required');
    const guild = await getGuild();
    const channel = await guild.channels.create({
      name,
      type: type === 'voice' ? ChannelType.GuildVoice : ChannelType.GuildText,
      parent: parentId,
    });
    res.json({ id: channel.id, name: channel.name });
  } catch (err) {
    console.error(err);
    res.status(500).send('failed to create channel');
  }
});

app.put('/channels/:id', async (req, res) => {
  try {
    const { name, parentId } = req.body;
    const guild = await getGuild();
    const channel = await guild.channels.fetch(req.params.id);
    if (!channel) return res.status(404).send('channel not found');
    await channel.edit({ name, parent: parentId });
    res.json({ id: channel.id, name: channel.name });
  } catch (err) {
    console.error(err);
    res.status(500).send('failed to update channel');
  }
});

app.delete('/channels/:id', async (req, res) => {
  try {
    const guild = await getGuild();
    const channel = await guild.channels.fetch(req.params.id);
    if (!channel) return res.status(404).send('channel not found');
    await channel.delete();
    res.sendStatus(204);
  } catch (err) {
    console.error(err);
    res.status(500).send('failed to delete channel');
  }
});

app.post('/categories', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).send('name is required');
    const guild = await getGuild();
    const category = await guild.channels.create({
      name,
      type: ChannelType.GuildCategory,
    });
    res.json({ id: category.id, name: category.name });
  } catch (err) {
    console.error(err);
    res.status(500).send('failed to create category');
  }
});

app.put('/categories/:id', async (req, res) => {
  try {
    const { name } = req.body;
    const guild = await getGuild();
    const category = await guild.channels.fetch(req.params.id);
    if (!category || category.type !== ChannelType.GuildCategory)
      return res.status(404).send('category not found');
    await category.edit({ name });
    res.json({ id: category.id, name: category.name });
  } catch (err) {
    console.error(err);
    res.status(500).send('failed to update category');
  }
});

app.delete('/categories/:id', async (req, res) => {
  try {
    const guild = await getGuild();
    const category = await guild.channels.fetch(req.params.id);
    if (!category || category.type !== ChannelType.GuildCategory)
      return res.status(404).send('category not found');
    await category.delete();
    res.sendStatus(204);
  } catch (err) {
    console.error(err);
    res.status(500).send('failed to delete category');
  }
});

app.get('/', (_req, res) => {
  res.send('MCP server is running');
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
