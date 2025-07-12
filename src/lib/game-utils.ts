const ALPHABET = 'abcdefghijklmnopqrstuvwxyz';

export function shuffleArray<T>(array: T[]): T[] {
  return [...array].sort(() => Math.random() - 0.5);
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
