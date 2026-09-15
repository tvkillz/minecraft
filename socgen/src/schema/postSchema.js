import { SchemaType } from '@google/generative-ai'

export function postContentSchema() {
  return {
    type: SchemaType.OBJECT,
    properties: {
      instagram: {
        type: SchemaType.OBJECT,
        properties: {
          header: {
            type: SchemaType.STRING,
            description: 'Top “шапка” line: hook + link-in-bio note. NO raw URLs in caption body.',
          },
          caption: {
            type: SchemaType.STRING,
            description: 'Main caption after header. Emojis welcome. No http/https links here.',
          },
          hashtags: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
            description: '5–15 hashtags including #',
          },
          alt_text: { type: SchemaType.STRING },
        },
        required: ['header', 'caption', 'hashtags', 'alt_text'],
      },
      facebook: {
        type: SchemaType.OBJECT,
        properties: {
          body: {
            type: SchemaType.STRING,
            description: 'Long-form post (multiple paragraphs). Storytelling, lore, card details.',
          },
          link_url: { type: SchemaType.STRING },
          link_cta: {
            type: SchemaType.STRING,
            description: 'Short CTA line before the clickable link at the very end',
          },
        },
        required: ['body', 'link_url', 'link_cta'],
      },
      discord: {
        type: SchemaType.OBJECT,
        properties: {
          content: {
            type: SchemaType.STRING,
            description: 'Discord markdown: **bold**, bullet lists, [clickable link](url)',
          },
        },
        required: ['content'],
      },
      image: {
        type: SchemaType.OBJECT,
        properties: {
          prompt: {
            type: SchemaType.STRING,
            description: 'Square 1:1 image prompt for social promo. No text in image.',
          },
          reference_assets: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
            description: 'Card art or scene paths only — never brand/logo assets',
          },
          subject_line: {
            type: SchemaType.STRING,
            description: 'Short title overlay suggestion for composite mode',
          },
        },
        required: ['prompt', 'reference_assets', 'subject_line'],
      },
    },
    required: ['instagram', 'facebook', 'discord', 'image'],
  }
}
