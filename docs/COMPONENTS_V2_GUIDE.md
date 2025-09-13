# Discord Components v2 Guide

This guide covers the complete implementation of Discord's Components v2 system in the Discord MCP Server, based on the [Discord Components v2 changelog](https://discord.com/developers/docs/change-log/2025-04-22-components-v2) and [Components reference](https://discord.com/developers/docs/components/reference).

## Overview

Components v2 introduces enhanced message layouts with:
- **Containers** - Group components with custom layouts
- **Separators** - Visual dividers between content sections
- **Enhanced Text Elements** - Styled text with headings and colors
- **Image Elements** - Rich image display
- **Advanced Buttons** - Enhanced button styling
- **Select Menus** - Improved dropdown menus
- **Modals** - Interactive forms

## API Endpoints

### Components v2 Message
```http
POST /api/components/v2/message
```

Send a message with Components v2 support.

**Request Body:**
```json
{
  "channelId": "123456789012345678",
  "messageData": {
    "content": "Welcome to Components v2!",
    "containers": [
      {
        "type": "container",
        "style": "primary",
        "layout": "vertical",
        "children": [
          {
            "type": "text",
            "content": "Main Heading",
            "style": "heading",
            "color": "#ffffff"
          },
          {
            "type": "button",
            "label": "Click me!",
            "style": "primary",
            "customId": "example_button"
          }
        ]
      }
    ],
    "separators": [
      {
        "type": "separator",
        "style": "solid",
        "color": "#7289da"
      }
    ]
  }
}
```

### Individual Component Builders

#### Container
```http
POST /api/components/v2/container
```

**Request Body:**
```json
{
  "containerData": {
    "type": "container",
    "style": "primary",
    "layout": "vertical",
    "children": [
      {
        "type": "text",
        "content": "Container content",
        "style": "body"
      },
      {
        "type": "button",
        "label": "Button",
        "style": "primary",
        "customId": "btn_1"
      }
    ]
  }
}
```

#### Separator
```http
POST /api/components/v2/separator
```

**Request Body:**
```json
{
  "separatorData": {
    "type": "separator",
    "style": "solid",
    "color": "#7289da"
  }
}
```

#### Text Element
```http
POST /api/components/v2/text
```

**Request Body:**
```json
{
  "textData": {
    "type": "text",
    "content": "This is styled text",
    "style": "heading",
    "color": "#ffffff",
    "weight": "bold"
  }
}
```

**Text Styles:**
- `heading` - Large heading text
- `subheading` - Medium heading text
- `body` - Regular body text
- `caption` - Small caption text
- `code` - Code block text

**Text Weights:**
- `normal` - Regular text
- `bold` - Bold text
- `italic` - Italic text

#### Image Element
```http
POST /api/components/v2/image
```

**Request Body:**
```json
{
  "imageData": {
    "type": "image",
    "url": "https://example.com/image.png",
    "alt": "Example image",
    "width": 300,
    "height": 200
  }
}
```

#### Button
```http
POST /api/components/v2/button
```

**Request Body:**
```json
{
  "buttonData": {
    "type": "button",
    "label": "Click me!",
    "style": "primary",
    "customId": "example_button",
    "emoji": "👍",
    "disabled": false
  }
}
```

**Button Styles:**
- `primary` - Blue primary button
- `secondary` - Gray secondary button
- `success` - Green success button
- `danger` - Red danger button
- `link` - Link-style button

#### Select Menu
```http
POST /api/components/v2/select
```

**Request Body:**
```json
{
  "selectData": {
    "type": "select",
    "customId": "example_select",
    "placeholder": "Choose an option...",
    "minValues": 1,
    "maxValues": 1,
    "options": [
      {
        "label": "Option 1",
        "value": "option_1",
        "description": "First option",
        "emoji": "1️⃣",
        "default": false
      },
      {
        "label": "Option 2",
        "value": "option_2",
        "description": "Second option",
        "emoji": "2️⃣",
        "default": true
      }
    ]
  }
}
```

#### Modal
```http
POST /api/components/v2/modal
```

**Request Body:**
```json
{
  "modalData": {
    "title": "Example Modal",
    "customId": "example_modal",
    "components": [
      {
        "type": "text_input",
        "customId": "name_input",
        "label": "Your Name",
        "style": "short",
        "required": true,
        "placeholder": "Enter your name...",
        "maxLength": 100,
        "minLength": 1
      },
      {
        "type": "text_input",
        "customId": "description_input",
        "label": "Description",
        "style": "paragraph",
        "required": false,
        "placeholder": "Enter a description...",
        "maxLength": 1000
      }
    ]
  }
}
```

**Text Input Styles:**
- `short` - Single line text input
- `paragraph` - Multi-line text input

## Webhook Support

### Components v2 Webhook
```http
POST /api/webhook/send-v2
```

Send Components v2 content via webhook.

**Request Body:**
```json
{
  "webhookUrl": "https://discord.com/api/webhooks/...",
  "messageData": {
    "content": "Components v2 Webhook!",
    "username": "MCP Bot",
    "avatar_url": "https://example.com/avatar.png",
    "containers": [
      {
        "type": "container",
        "style": "primary",
        "layout": "vertical",
        "children": [
          {
            "type": "text",
            "content": "Webhook Content",
            "style": "heading"
          }
        ]
      }
    ],
    "separators": [
      {
        "type": "separator",
        "style": "dashed",
        "color": "#ff0000"
      }
    ]
  }
}
```

## Examples

### Complete Components v2 Message

```javascript
const messageData = {
  content: "Welcome to our server!",
  containers: [
    {
      type: 'container',
      style: 'primary',
      layout: 'vertical',
      children: [
        {
          type: 'text',
          content: 'Server Rules',
          style: 'heading',
          color: '#ffffff',
          weight: 'bold'
        },
        {
          type: 'text',
          content: 'Please read and follow these rules:',
          style: 'body',
          color: '#cccccc'
        },
        {
          type: 'button',
          label: 'I Agree',
          style: 'success',
          customId: 'agree_rules',
          emoji: '✅'
        },
        {
          type: 'button',
          label: 'Read More',
          style: 'secondary',
          customId: 'read_more',
          emoji: '📖'
        }
      ]
    }
  ],
  separators: [
    {
      type: 'separator',
      style: 'solid',
      color: '#7289da'
    }
  ]
};

// Send via API
fetch('/api/components/v2/message', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Webhook-Signature': signature
  },
  body: JSON.stringify({
    channelId: 'your_channel_id',
    messageData
  })
});
```

### Interactive Modal Example

```javascript
const modalData = {
  title: "User Registration",
  customId: "user_registration",
  components: [
    {
      type: 'text_input',
      customId: 'username',
      label: 'Username',
      style: 'short',
      required: true,
      placeholder: 'Enter your username...',
      maxLength: 32,
      minLength: 3
    },
    {
      type: 'text_input',
      customId: 'email',
      label: 'Email Address',
      style: 'short',
      required: true,
      placeholder: 'Enter your email...',
      maxLength: 100
    },
    {
      type: 'text_input',
      customId: 'bio',
      label: 'Bio (Optional)',
      style: 'paragraph',
      required: false,
      placeholder: 'Tell us about yourself...',
      maxLength: 500
    }
  ]
};

// Create modal
fetch('/api/components/v2/modal', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Webhook-Signature': signature
  },
  body: JSON.stringify({ modalData })
});
```

## Interaction Handling

The MCP server automatically handles all Components v2 interactions:

- **Button Clicks** - Responds to button interactions
- **Select Menu Selections** - Handles dropdown selections
- **Modal Submissions** - Processes form submissions
- **User/Role/Channel Selections** - Manages entity selections

All interactions are logged and can be customized by modifying the interaction handlers in the DiscordService class.

## Security

Components v2 endpoints include:
- **Rate Limiting** - 20 requests per minute for Components v2
- **Signature Verification** - HMAC signature validation
- **Input Sanitization** - XSS and injection prevention
- **Feature Flags** - Enable/disable via `ENABLE_COMPONENTS_V2`

## Error Handling

All Components v2 endpoints return structured error responses:

```json
{
  "error": "Error message",
  "details": "Additional error details",
  "timestamp": "2025-01-27T10:30:00.000Z"
}
```

Common error codes:
- `400` - Bad Request (invalid data)
- `401` - Unauthorized (missing/invalid signature)
- `403` - Forbidden (Components v2 disabled)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

## Migration from Components v1

Components v2 is backward compatible with Components v1. Existing webhook and message endpoints continue to work while new Components v2 endpoints provide enhanced functionality.

To migrate:
1. Update API calls to use `/api/components/v2/` endpoints
2. Add `containers` and `separators` to message data
3. Use new component builders for enhanced styling
4. Update webhook calls to use `/api/webhook/send-v2`

## Support

For Components v2 support:
- Check the [Discord Components v2 documentation](https://discord.com/developers/docs/components/reference)
- Review the [Components v2 changelog](https://discord.com/developers/docs/change-log/2025-04-22-components-v2)
- Use the `/api/components/v2/examples` endpoint for sample data
- Check server logs for detailed error information
