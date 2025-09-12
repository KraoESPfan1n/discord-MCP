import { 
  Client, 
  GatewayIntentBits, 
  ChannelType, 
  PermissionFlagsBits, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  Colors,
  // Components v2 imports
  StringSelectMenuBuilder,
  UserSelectMenuBuilder,
  RoleSelectMenuBuilder,
  MentionableSelectMenuBuilder,
  ChannelSelectMenuBuilder,
  TextInputBuilder,
  TextInputStyle,
  ModalBuilder,
  // Interaction types
  InteractionType,
  ComponentType
} from 'discord.js';
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
        GatewayIntentBits.GuildWebhooks,
        // Additional intents for Components v2
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildVoiceStates
      ]
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.client.once('ready', () => {
      this.isReady = true;
      logger.info(`Discord bot logged in as ${this.client.user?.tag}`);
    });

    this.client.on('error', (error: Error) => {
      logger.error('Discord client error:', error);
    });

    this.client.on('warn', (warning: string) => {
      logger.warn('Discord client warning:', warning);
    });

    // Components v2 interaction handling
    this.client.on('interactionCreate', async (interaction: any) => {
      try {
        if (interaction.isButton()) {
          await this.handleButtonInteraction(interaction);
        } else if (interaction.isStringSelectMenu()) {
          await this.handleSelectMenuInteraction(interaction);
        } else if (interaction.isModalSubmit()) {
          await this.handleModalSubmitInteraction(interaction);
        } else if (interaction.isUserSelectMenu()) {
          await this.handleUserSelectMenuInteraction(interaction);
        } else if (interaction.isRoleSelectMenu()) {
          await this.handleRoleSelectMenuInteraction(interaction);
        } else if (interaction.isMentionableSelectMenu()) {
          await this.handleMentionableSelectMenuInteraction(interaction);
        } else if (interaction.isChannelSelectMenu()) {
          await this.handleChannelSelectMenuInteraction(interaction);
        }
      } catch (error) {
        logger.error('Error handling interaction:', error);
        if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
          await interaction.reply({ content: 'An error occurred while processing your interaction.', ephemeral: true });
        }
      }
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
      const channelOptions: any = {
        name: channelData.name,
        type: (channelData.type as any) || ChannelType.GuildText,
        permissionOverwrites: channelData.permissionOverwrites || []
      };
      
      if (channelData.parentId) {
        channelOptions.parent = channelData.parentId;
      }
      
      if (channelData.topic) {
        channelOptions.topic = channelData.topic;
      }
      
      const channel = await guild.channels.create(channelOptions);

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
        permissionOverwrites: categoryData.permissionOverwrites || []
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

      if (!channel.isTextBased()) {
        throw new Error('Channel does not support webhooks');
      }
      
      const webhook = await (channel as any).createWebhook({
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
        channels: guild.channels.cache.map((channel: any) => ({
          id: channel.id,
          name: channel.name,
          type: channel.type
        })),
        roles: guild.roles.cache.map((role: any) => ({
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

  // ===== COMPONENTS V2 METHODS =====

  /**
   * Create a Components v2 message with containers, separators, and enhanced components
   */
  async createComponentsV2Message(channelId: string, messageData: {
    content?: string;
    components?: any[];
    containers?: any[];
    separators?: any[];
    embeds?: any[];
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

      // Build Components v2 structure
      const messagePayload: any = {
        content: messageData.content,
        embeds: messageData.embeds || []
      };

      // Add Components v2 containers if provided
      if (messageData.containers && messageData.containers.length > 0) {
        messagePayload.components = messageData.containers.map(container => 
          this.buildContainer(container).toJSON()
        );
      }

      // Add traditional components if provided
      if (messageData.components && messageData.components.length > 0) {
        if (!messagePayload.components) messagePayload.components = [];
        messagePayload.components.push(...messageData.components);
      }

      // Add separators as embeds if provided
      if (messageData.separators && messageData.separators.length > 0) {
        if (!messagePayload.embeds) messagePayload.embeds = [];
        messagePayload.embeds.push(...messageData.separators.map(sep => 
          this.buildSeparator(sep).toJSON()
        ));
      }

      if (!channel.isTextBased()) {
        throw new Error('Channel does not support sending messages');
      }
      
      const message = await (channel as any).send(messagePayload);
      logger.info(`Components v2 message sent to channel ${channelId}`);
      return message;
    } catch (error) {
      logger.error('Failed to send Components v2 message:', error);
      throw error;
    }
  }

  /**
   * Build a Components v2 container (using ActionRow for compatibility)
   */
  buildContainer(containerData: {
    type: 'container';
    children: any[];
    style?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
    layout?: 'vertical' | 'horizontal';
  }) {
    const actionRow = new ActionRowBuilder();

    // Add children to action row
    containerData.children.forEach(child => {
      if (child.type === 'button') {
        actionRow.addComponents(this.buildButton(child));
      } else if (child.type === 'select') {
        actionRow.addComponents(this.buildSelectMenu(child));
      }
    });

    return actionRow;
  }

  /**
   * Build a Components v2 separator (using Embed for visual separation)
   */
  buildSeparator(separatorData: {
    type: 'separator';
    style?: 'solid' | 'dashed' | 'dotted';
    color?: string;
  }) {
    // Create a simple embed as separator
    const embed = new EmbedBuilder()
      .setDescription('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      .setColor(separatorData.color ? parseInt(separatorData.color.replace('#', ''), 16) : 0x7289da);
    
    return embed;
  }

  /**
   * Build a Components v2 text element (using Embed for text display)
   */
  buildText(textData: {
    type: 'text';
    content: string;
    style?: 'heading' | 'subheading' | 'body' | 'caption' | 'code';
    color?: string;
    weight?: 'normal' | 'bold' | 'italic';
  }) {
    const embed = new EmbedBuilder();
    
    // Apply text styling
    let content = textData.content;
    if (textData.weight === 'bold') {
      content = `**${content}**`;
    } else if (textData.weight === 'italic') {
      content = `*${content}*`;
    }
    
    if (textData.style === 'heading') {
      content = `# ${content}`;
    } else if (textData.style === 'subheading') {
      content = `## ${content}`;
    } else if (textData.style === 'code') {
      content = `\`\`\`\n${content}\n\`\`\``;
    }
    
    embed.setDescription(content);
    
    if (textData.color) {
      embed.setColor(parseInt(textData.color.replace('#', ''), 16));
    }
    
    return embed;
  }

  /**
   * Build a Components v2 image element (using Embed for image display)
   */
  buildImage(imageData: {
    type: 'image';
    url: string;
    alt?: string;
    width?: number;
    height?: number;
  }) {
    const embed = new EmbedBuilder()
      .setImage(imageData.url);
    
    if (imageData.alt) {
      embed.setDescription(imageData.alt);
    }
    
    return embed;
  }

  /**
   * Build a Components v2 button
   */
  buildButton(buttonData: {
    type: 'button';
    label: string;
    style?: 'primary' | 'secondary' | 'success' | 'danger' | 'link';
    customId?: string;
    url?: string;
    emoji?: string;
    disabled?: boolean;
  }) {
    const button = new ButtonBuilder()
      .setLabel(buttonData.label)
      .setDisabled(buttonData.disabled || false);

    // Map custom styles to Discord.js styles
    let style = ButtonStyle.Primary;
    if (buttonData.style === 'secondary') style = ButtonStyle.Secondary;
    else if (buttonData.style === 'success') style = ButtonStyle.Success;
    else if (buttonData.style === 'danger') style = ButtonStyle.Danger;
    else if (buttonData.style === 'link') style = ButtonStyle.Link;

    button.setStyle(style);

    if (buttonData.customId) {
      button.setCustomId(buttonData.customId);
    }
    if (buttonData.url) {
      button.setURL(buttonData.url);
    }
    if (buttonData.emoji) {
      button.setEmoji(buttonData.emoji);
    }

    return button;
  }

  /**
   * Build a Components v2 select menu
   */
  buildSelectMenu(selectData: {
    type: 'select';
    customId: string;
    placeholder?: string;
    minValues?: number;
    maxValues?: number;
    options?: any[];
    disabled?: boolean;
  }) {
    const select = new StringSelectMenuBuilder()
      .setCustomId(selectData.customId)
      .setPlaceholder(selectData.placeholder || 'Select an option...')
      .setMinValues(selectData.minValues || 1)
      .setMaxValues(selectData.maxValues || 1)
      .setDisabled(selectData.disabled || false);

    if (selectData.options) {
      selectData.options.forEach(option => {
        select.addOptions({
          label: option.label,
          value: option.value,
          description: option.description,
          emoji: option.emoji,
          default: option.default
        });
      });
    }

    return select;
  }

  /**
   * Create a modal with Components v2 support
   */
  async createModal(modalData: {
    title: string;
    customId: string;
    components: any[];
  }) {
    const modal = new ModalBuilder()
      .setTitle(modalData.title)
      .setCustomId(modalData.customId);

    modalData.components.forEach(component => {
      if (component.type === 'text_input') {
        const textInput = new TextInputBuilder()
          .setCustomId(component.customId)
          .setLabel(component.label)
          .setStyle(component.style || TextInputStyle.Short)
          .setRequired(component.required || false)
          .setMaxLength(component.maxLength || 4000)
          .setMinLength(component.minLength || 0)
          .setPlaceholder(component.placeholder);

        if (component.value) textInput.setValue(component.value);

        const actionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(textInput);
        modal.addComponents(actionRow);
      }
    });

    return modal;
  }

  // ===== INTERACTION HANDLERS =====

  private async handleButtonInteraction(interaction: any) {
    logger.info(`Button interaction received: ${interaction.customId}`);
    
    // Default response - can be customized based on customId
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ 
        content: `Button clicked: ${interaction.customId}`, 
        ephemeral: true 
      });
    }
  }

  private async handleSelectMenuInteraction(interaction: any) {
    logger.info(`Select menu interaction received: ${interaction.customId}`);
    
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ 
        content: `Selected: ${interaction.values.join(', ')}`, 
        ephemeral: true 
      });
    }
  }

  private async handleModalSubmitInteraction(interaction: any) {
    logger.info(`Modal submit interaction received: ${interaction.customId}`);
    
    if (!interaction.replied && !interaction.deferred) {
      const fields = interaction.fields.fields.map((field: any) => 
        `${field.customId}: ${field.value}`
      ).join('\n');
      
      await interaction.reply({ 
        content: `Modal submitted:\n${fields}`, 
        ephemeral: true 
      });
    }
  }

  private async handleUserSelectMenuInteraction(interaction: any) {
    logger.info(`User select menu interaction received: ${interaction.customId}`);
    
    if (!interaction.replied && !interaction.deferred) {
      const users = interaction.users.map((user: any) => user.tag).join(', ');
      await interaction.reply({ 
        content: `Selected users: ${users}`, 
        ephemeral: true 
      });
    }
  }

  private async handleRoleSelectMenuInteraction(interaction: any) {
    logger.info(`Role select menu interaction received: ${interaction.customId}`);
    
    if (!interaction.replied && !interaction.deferred) {
      const roles = interaction.roles.map((role: any) => role.name).join(', ');
      await interaction.reply({ 
        content: `Selected roles: ${roles}`, 
        ephemeral: true 
      });
    }
  }

  private async handleMentionableSelectMenuInteraction(interaction: any) {
    logger.info(`Mentionable select menu interaction received: ${interaction.customId}`);
    
    if (!interaction.replied && !interaction.deferred) {
      const mentions = interaction.values.map((value: string) => `<@${value}>`).join(', ');
      await interaction.reply({ 
        content: `Selected mentionables: ${mentions}`, 
        ephemeral: true 
      });
    }
  }

  private async handleChannelSelectMenuInteraction(interaction: any) {
    logger.info(`Channel select menu interaction received: ${interaction.customId}`);
    
    if (!interaction.replied && !interaction.deferred) {
      const channels = interaction.channels.map((channel: any) => channel.name).join(', ');
      await interaction.reply({ 
        content: `Selected channels: ${channels}`, 
        ephemeral: true 
      });
    }
  }
}
