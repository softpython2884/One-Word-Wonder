'use server';

/**
 * @fileOverview A flow to expand the word list and clues for the game using GenAI.
 *
 * - expandWordList - A function that handles the expansion of the word list and clues.
 * - ExpandWordListInput - The input type for the expandWordList function.
 * - ExpandWordListOutput - The return type for the expandWordList function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExpandWordListInputSchema = z.object({
  baseWords: z
    .string()
    .describe(
      'A comma separated list of base words to generate more words and clues for in French.'
    ),
  count: z
    .number()
    .describe(
      'The number of new words to generate.
    ')
});
export type ExpandWordListInput = z.infer<typeof ExpandWordListInputSchema>;

const ExpandWordListOutputSchema = z.object({
  newWords: z
    .string()
    .describe('A comma separated list of new words in French.'),
  newClues: z
    .string()
    .describe('A comma separated list of clues for the new words in French.'),
});
export type ExpandWordListOutput = z.infer<typeof ExpandWordListOutputSchema>;

export async function expandWordList(input: ExpandWordListInput): Promise<ExpandWordListOutput> {
  return expandWordListFlow(input);
}

const prompt = ai.definePrompt({
  name: 'expandWordListPrompt',
  input: {schema: ExpandWordListInputSchema},
  output: {schema: ExpandWordListOutputSchema},
  prompt: `You are a word game expert, fluent in French.

You are expanding the word list for a word guessing game called "One Word Wonder" which will be deployed in France, so the language MUST be French.

Given a list of base words, you will generate a list of new words and their corresponding clues.  The new words should be related to the base words, but not be direct translations.  For example, if the base word is "pomme", a valid new word would be "compote".

Ensure that the number of new words and clues generated matches the count provided in the input. Format the output as comma separated strings, where the first string is the list of new words, and the second string is the list of clues for the new words.

Base Words: {{{baseWords}}}
Count: {{{count}}}
`,
});

const expandWordListFlow = ai.defineFlow(
  {
    name: 'expandWordListFlow',
    inputSchema: ExpandWordListInputSchema,
    outputSchema: ExpandWordListOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
