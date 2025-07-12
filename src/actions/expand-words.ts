'use server';

import { expandWordList } from "@/ai/flows/expand-word-list";
import { z } from "zod";
import { type Word } from "@/lib/words";

const expandWordsSchema = z.object({
  baseWords: z.string(),
});

export async function expandWordsAction(input: { baseWords: string }): Promise<{data?: Word[], error?: string}> {
  const parsedInput = expandWordsSchema.safeParse(input);
  if (!parsedInput.success) {
    return { error: "Invalid input" };
  }
  
  try {
    const result = await expandWordList({
      baseWords: parsedInput.data.baseWords,
      count: 5,
    });

    const newWords = result.newWords.split(',').map(w => w.trim()).filter(Boolean);
    const newClues = result.newClues.split(',').map(c => c.trim()).filter(Boolean);

    if (newWords.length !== newClues.length || newWords.length === 0) {
      console.error("Mismatch or empty result", {newWords, newClues});
      return { error: "La génération de l'IA a produit un résultat inattendu." };
    }
    
    const newWordObjects: Word[] = newWords.map((word, index) => ({
        word,
        clue: newClues[index]
    }));

    return { data: newWordObjects };
  } catch (e) {
    console.error(e);
    return { error: "Échec de la génération de nouveaux mots." };
  }
}
