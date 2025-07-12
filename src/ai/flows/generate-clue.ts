'use server';

/**
 * @fileOverview AI flow to generate a clue for a given word.
 *
 * - generateClue - A function that generates a clue for a given word.
 * - GenerateClueInput - The input type for the generateClue function.
 * - GenerateClueOutput - The return type for the generateClue function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateClueInputSchema = z.object({
  word: z.string().describe('The word to generate a clue for.'),
});

export type GenerateClueInput = z.infer<typeof GenerateClueInputSchema>;

const GenerateClueOutputSchema = z.object({
  clue: z.string().describe('A clue for the word.'),
});

export type GenerateClueOutput = z.infer<typeof GenerateClueOutputSchema>;

export async function generateClue(input: GenerateClueInput): Promise<GenerateClueOutput> {
  return generateClueFlow(input);
}

const generateCluePrompt = ai.definePrompt({
  name: 'generateCluePrompt',
  input: {schema: GenerateClueInputSchema},
  output: {schema: GenerateClueOutputSchema},
  prompt: `You are a helpful assistant designed to provide a single clue for a given word.

    Word: {{{word}}}

    Clue:`,
});

const generateClueFlow = ai.defineFlow(
  {
    name: 'generateClueFlow',
    inputSchema: GenerateClueInputSchema,
    outputSchema: GenerateClueOutputSchema,
  },
  async input => {
    const {output} = await generateCluePrompt(input);
    return output!;
  }
);
