import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    titulo: z.string().max(70),
    descripcion: z.string().min(80).max(160),
    fecha: z.coerce.date(),
    actualizado: z.coerce.date().optional(),
    autor: z.string().default('Equipo'),
    borrador: z.boolean().default(false),
  }),
});

export const collections = { blog };
