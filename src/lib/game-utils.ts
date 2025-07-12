const ALPHABET = 'abcdefghijklmnopqrstuvwxyz';

/**
 * Shuffles an array in-place using the Fisher-Yates (aka Knuth) algorithm.
 * @param array The array to shuffle.
 * @returns The shuffled array.
 */
export function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  let currentIndex = newArray.length;
  let randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex !== 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [newArray[currentIndex], newArray[randomIndex]] = [
      newArray[randomIndex], newArray[currentIndex]];
  }

  return newArray;
}


export function generateLetterPool(word: string, size: number = 12): string[] {
  const wordLetters = word.toLowerCase().split('');
  const neededDistractors = size - wordLetters.length;

  if (neededDistractors < 0) {
    return shuffleArray(wordLetters);
  }

  const distractors: string[] = [];
  const availableChars = ALPHABET.split('').filter(char => !wordLetters.includes(char));

  for (let i = 0; i < neededDistractors; i++) {
    const randomIndex = Math.floor(Math.random() * availableChars.length);
    distractors.push(availableChars[randomIndex]);
  }

  return shuffleArray([...wordLetters, ...distractors]);
}
