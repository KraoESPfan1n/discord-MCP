import { Client, GatewayIntentBits, ChannelType, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Colors } from 'discord.js';
import { env } from '../config/environment';
import { logger } from '../utils/logger';
import { isValidDiscordId } from '../utils/security';

export class DiscordService {
  private client: Client;
  private isReady: boolean = false;

  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildWebhooks
      ]
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.client.once('ready', () => {
      this.isReady = true;
      logger.info(`Discord bot logged in as ${this.client.user?.tag}`);
    });

    this.client.on('error', (error) => {
      logger.error('Discord client error:', error);
    });

    this.client.on('warn', (warning) => {
      logger.warn('Discord client warning:', warning);
    });
  }

  async login(): Promise<void> {
    try {
      await this.client.login(env.DISCORD_TOKEN);
      // Wait for ready event
      await new Promise<void>((resolve) => {
        if (this.isReady) {
          resolve();
        } else {
          this.client.once('ready', () => resolve());
        }
      });
    } catch (error) {
      logger.error('Failed to login to Discord:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await this.client.destroy();
      this.isReady = false;
      logger.info('Discord client logged out');
    } catch (error) {
      logger.error('Failed to logout from Discord:', error);
      throw error;
    }
  }

  isConnected(): boolean {
    return this.isReady && this.client.isReady();
  }

  // Channel Management
  async createChannel(guildId: string, channelData: {
    name: string;
    type?: ChannelType;
    parentId?: string;
    topic?: string;
    permissionOverwrites?: any[];
  }) {
    if (!this.isConnected()) {
      throw new Error('Discord client not connected');
    }

    if (!isValidDiscordId(guildId)) {
      throw new Error('Invalid guild ID');
    }

    const guild = await this.client.guilds.fetch(guildId);
    if (!guild) {
      throw new Error('Guild not found');
    }

    try {
      const channel = await guild.channels.create({
        name: channelData.name,
        type: channelData.type || ChannelType.GuildText,
        parent: channelData.parentId,
        topic: channelData.topic,
        permissionOverwrites: channelData.permissionOverwrites
      });

      logger.info(`Created channel ${channel.name} in guild ${guild.name}`);
      return channel;
    } catch (error) {
      logger.error('Failed to create channel:', error);
      throw error;
    }
  }

  async createCategory(guildId: string, categoryData: {
    name: string;
    permissionOverwrites?: any[];
  }) {
    if (!this.isConnected()) {
      throw new Error('Discord client not connected');
    }

    if (!isValidDiscordId(guildId)) {
      throw new Error('Invalid guild ID');
    }

    const guild = await this.client.guilds.fetch(guildId);
    if (!guild) {
      throw new Error('Guild not found');
    }

    try {
      const category = await guild.channels.create({
        name: categoryData.name,
        type: ChannelType.GuildCategory,
        permissionOverwrites: categoryData.permissionOverwrites
      });

      logger.info(`Created category ${category.name} in guild ${guild.name}`);
      return category;
    } catch (error) {
      logger.error('Failed to create category:', error);
      throw error;
    }
  }

  async deleteChannel(channelId: string) {
    if (!this.isConnected()) {
      throw new Error('Discord client not connected');
    }

    if (!isValidDiscordId(channelId)) {
      throw new Error('Invalid channel ID');
    }

    try {
      const channel = await this.client.channels.fetch(channelId);
      if (!channel) {
        throw new Error('Channel not found');
      }

      await channel.delete();
      logger.info(`Deleted channel ${channelId}`);
    } catch (error) {
      logger.error('Failed to delete channel:', error);
      throw error;
    }
  }

  // Role Management
  async createRole(guildId: string, roleData: {
    name: string;
    color?: number;
    permissions?: bigint;
    mentionable?: boolean;
    hoist?: boolean;
  }) {
    if (!this.isConnected()) {
      throw new Error('Discord client not connected');
    }

    if (!isValidDiscordId(guildId)) {
      throw new Error('Invalid guild ID');
    }

    const guild = await this.client.guilds.fetch(guildId);
    if (!guild) {
      throw new Error('Guild not found');
    }

    try {
      const role = await guild.roles.create({
        name: roleData.name,
        color: roleData.color || Colors.Blurple,
        permissions: roleData.permissions || PermissionFlagsBits.ViewChannel,
        mentionable: roleData.mentionable || false,
        hoist: roleData.hoist || false
      });

      logger.info(`Created role ${role.name} in guild ${guild.name}`);
      return role;
    } catch (error) {
      logger.error('Failed to create role:', error);
      throw error;
    }
  }

  async deleteRole(guildId: string, roleId: string) {
    if (!this.isConnected()) {
      throw new Error('Discord client not connected');
    }

    if (!isValidDiscordId(guildId) || !isValidDiscordId(roleId)) {
      throw new Error('Invalid guild or role ID');
    }

    try {
      const guild = await this.client.guilds.fetch(guildId);
      if (!guild) {
        throw new Error('Guild not found');
      }

      const role = await guild.roles.fetch(roleId);
      if (!role) {
        throw new Error('Role not found');
      }

      await role.delete();
      logger.info(`Deleted role ${role.name} from guild ${guild.name}`);
    } catch (error) {
      logger.error('Failed to delete role:', error);
      throw error;
    }
  }

  // Webhook Management
  async createWebhook(channelId: string, webhookData: {
    name: string;
    avatar?: string;
  }) {
    if (!this.isConnected()) {
      throw new Error('Discord client not connected');
    }

    if (!isValidDiscordId(channelId)) {
      throw new Error('Invalid channel ID');
    }

    try {
      const channel = await this.client.channels.fetch(channelId);
      if (!channel || !channel.isTextBased()) {
        throw new Error('Channel not found or not text-based');
      }

      const webhook = await channel.createWebhook({
        name: webhookData.name,
        avatar: webhookData.avatar
      });

      logger.info(`Created webhook ${webhook.name} in channel ${channelId}`);
      return webhook;
    } catch (error) {
      logger.error('Failed to create webhook:', error);
      throw error;
    }
  }

  async sendWebhookMessage(webhookUrl: string, messageData: {
    content?: string;
    username?: string;
    avatar_url?: string;
    embeds?: any[];
    components?: any[];
  }) {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData)
      });

      if (!response.ok) {
        throw new Error(`Webhook request failed: ${response.statusText}`);
      }

      logger.info('Webhook message sent successfully');
      return response;
    } catch (error) {
      logger.error('Failed to send webhook message:', error);
      throw error;
    }
  }

  // Server Configuration
  async getGuildInfo(guildId: string) {
    if (!this.isConnected()) {
      throw new Error('Discord client not connected');
    }

    if (!isValidDiscordId(guildId)) {
      throw new Error('Invalid guild ID');
    }

    try {
      const guild = await this.client.guilds.fetch(guildId);
      if (!guild) {
        throw new Error('Guild not found');
      }

      return {
        id: guild.id,
        name: guild.name,
        description: guild.description,
        memberCount: guild.memberCount,
        ownerId: guild.ownerId,
        createdAt: guild.createdAt,
        channels: guild.channels.cache.map(channel => ({
          id: channel.id,
          name: channel.name,
          type: channel.type
        })),
        roles: guild.roles.cache.map(role => ({
          id: role.id,
          name: role.name,
          color: role.color,
          permissions: role.permissions.bitfield.toString()
        }))
      };
    } catch (error) {
      logger.error('Failed to get guild info:', error);
      throw error;
    }
  }

  // Utility Methods
  async getChannel(channelId: string) {
    if (!this.isConnected()) {
      throw new Error('Discord client not connected');
    }

    if (!isValidDiscordId(channelId)) {
      throw new Error('Invalid channel ID');
    }

    try {
      return await this.client.channels.fetch(channelId);
    } catch (error) {
      logger.error('Failed to get channel:', error);
      throw error;
    }
  }

  async getGuild(guildId: string) {
    if (!this.isConnected()) {
      throw new Error('Discord client not connected');
    }

    if (!isValidDiscordId(guildId)) {
      throw new Error('Invalid guild ID');
    }

    try {
      return await this.client.guilds.fetch(guildId);
    } catch (error) {
      logger.error('Failed to get guild:', error);
      throw error;
    }
  }
}
