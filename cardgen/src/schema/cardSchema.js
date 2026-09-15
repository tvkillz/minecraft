import { SchemaType } from '@google/generative-ai'

/** Gemini response schema for a single generated card draft. */
export function cardDraftSchema() {
  return {
    type: SchemaType.OBJECT,
    properties: {
      title: { type: SchemaType.STRING, description: 'Display name, title case' },
      slug: {
        type: SchemaType.STRING,
        description: 'Unique id: {domain}_card_{NN}_{snake_case_title}',
      },
      domain: { type: SchemaType.STRING, description: 'Realm id from domains.json' },
      role: {
        type: SchemaType.STRING,
        description: 'Archetype e.g. Heavy Tank / Defender, Assassin / Scout',
      },
      stats: {
        type: SchemaType.OBJECT,
        properties: {
          mana: { type: SchemaType.INTEGER },
          attack: { type: SchemaType.INTEGER },
          health: { type: SchemaType.INTEGER },
        },
        required: ['mana', 'attack', 'health'],
      },
      keywords: {
        type: SchemaType.ARRAY,
        items: { type: SchemaType.STRING },
        description: '0–2 keywords from the project glossary only',
      },
      ability: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING },
          text: { type: SchemaType.STRING },
        },
        required: ['name', 'text'],
      },
      image_prompt: {
        type: SchemaType.STRING,
        description:
          'Detailed visual prompt for an image model: subject, pose, environment, lighting. No card frame or text.',
      },
      image_notes: {
        type: SchemaType.STRING,
        description:
          'Extra notes for the image platform: style refs, negative prompts, aspect ratio reminders',
      },
    },
    required: [
      'title',
      'slug',
      'domain',
      'role',
      'stats',
      'keywords',
      'ability',
      'image_prompt',
      'image_notes',
    ],
  }
}

/** Batch wrapper returned by Gemini. */
export function cardBatchSchema() {
  return {
    type: SchemaType.OBJECT,
    properties: {
      cards: {
        type: SchemaType.ARRAY,
        items: cardDraftSchema(),
      },
    },
    required: ['cards'],
  }
}

/** Title/slug repair response after validation conflicts. */
export function cardRepairBatchSchema() {
  return {
    type: SchemaType.OBJECT,
    properties: {
      repairs: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            slug: {
              type: SchemaType.STRING,
              description: 'Original slug identifying which card to fix',
            },
            title: { type: SchemaType.STRING, description: 'New unique title' },
            ability_name: {
              type: SchemaType.STRING,
              description: 'Optional new ability name matching the title',
              nullable: true,
            },
            image_prompt: {
              type: SchemaType.STRING,
              description: 'Optional updated image prompt if subject name changed',
              nullable: true,
            },
          },
          required: ['slug', 'title'],
        },
      },
    },
    required: ['repairs'],
  }
}
