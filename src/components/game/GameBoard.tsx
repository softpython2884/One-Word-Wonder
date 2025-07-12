'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Star, BrainCircuit, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { INITIAL_WORDS, type Word } from '@/lib/words';
import { generateLetterPool, shuffleArray } from '@/lib/game-utils';
import { ExpandContent } from './ExpandContent';
import { useToast } from '@/hooks/use-toast';

type GameState = 'start' | 'playing' | 'correct' | 'incorrect' | 'gameOver';

const ROUND_TIME = 60;

export function GameBoard() {
  const [gameState, setGameState] = useState<GameState>('start');
  const [wordList, setWordList] = useState<Word[]>(() => shuffleArray(INITIAL_WORDS));
  const [currentRound, setCurrentRound] = useState(0);
  const [currentWord, setCurrentWord] = useState<Word | null>(null);
  const [letterPool, setLetterPool] = useState<string[]>([]);
  const [userGuess, setUserGuess] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME);
  const [shaking, setShaking] = useState(false);
  const { toast } = useToast();

  const setupRound = useCallback(() => {
    if (currentRound >= wordList.length) {
      setGameState('gameOver');
      return;
    }
    const word = wordList[currentRound];
    setCurrentWord(word);
    setLetterPool(generateLetterPool(word.word));
    setUserGuess([]);
    setTimeLeft(ROUND_TIME);
    setGameState('playing');
  }, [currentRound, wordList]);
  
  const startGame = useCallback(() => {
    setCurrentRound(0);
    setScore(0);
    setWordList(current => shuffleArray(current));
    setupRound();
  }, [setupRound]);
  
  const nextRound = useCallback(() => {
    setCurrentRound(prev => prev + 1);
  }, []);
  
  useEffect(() => {
    if (gameState === 'start' || gameState === 'gameOver') return;
    setupRound();
  }, [currentRound]);
  
  useEffect(() => {
    if (gameState !== 'playing') return;

    if (timeLeft === 0) {
      toast({ title: "Temps écoulé !", description: `Le mot était : ${currentWord?.word}`, variant: 'destructive' });
      setGameState('incorrect');
      setTimeout(() => {
        nextRound();
      }, 2000);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [gameState, timeLeft, currentWord, toast, nextRound]);

  const handleLetterClick = (letter: string, index: number) => {
    if (userGuess.length < (currentWord?.word.length ?? 0)) {
      setUserGuess([...userGuess, letter]);
      const newPool = [...letterPool];
      newPool[index] = '';
      setLetterPool(newPool);
    }
  };

  const handleBackspace = () => {
    if (userGuess.length > 0) {
      const lastLetter = userGuess[userGuess.length - 1];
      const newGuess = userGuess.slice(0, -1);
      setUserGuess(newGuess);
      
      const firstEmptyIndex = letterPool.findIndex(l => l === '');
      if (firstEmptyIndex !== -1) {
        const newPool = [...letterPool];
        newPool[firstEmptyIndex] = lastLetter;
        setLetterPool(newPool);
      }
    }
  };

  const handleSubmit = () => {
    if (userGuess.join('') === currentWord?.word) {
      setScore(s => s + 10 + timeLeft);
      setGameState('correct');
      setTimeout(() => {
        nextRound();
      }, 1500);
    } else {
      setGameState('incorrect');
      setShaking(true);
      toast({ title: "Incorrect !", description: "Essayez encore.", variant: 'destructive' });
      setTimeout(() => {
        setShaking(false);
        setUserGuess([]);
        setLetterPool(generateLetterPool(currentWord!.word));
        setGameState('playing');
      }, 1000);
    }
  };

  const handleWordsExpanded = (newWords: Word[]) => {
    setWordList(prev => shuffleArray([...prev, ...newWords]));
  };

  const renderGameContent = () => {
    if (gameState === 'start' || gameState === 'gameOver') {
      return (
        <Card className="w-full max-w-md text-center animate-fade-in">
          <CardHeader>
            <CardTitle className="text-4xl font-headline text-primary">Mot Magique</CardTitle>
            <CardDescription>{gameState === 'start' ? "Testez votre vocabulaire français !" : "Partie terminée !"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {gameState === 'gameOver' && <p className="text-2xl">Votre score final : {score}</p>}
            <Button size="lg" onClick={startGame}>
              {gameState === 'start' ? "Commencer le jeu" : "Rejouer"}
            </Button>
            <div className="pt-4">
               <ExpandContent currentWords={wordList} onWordsExpanded={handleWordsExpanded} />
            </div>
          </CardContent>
        </Card>
      );
    }
    
    return (
      <div className="w-full max-w-2xl flex flex-col items-center gap-6">
        <div className="w-full flex justify-between items-center text-lg px-2">
          <div className="flex items-center gap-2 font-semibold">
            <Star className="text-primary"/> <span>{score}</span>
          </div>
          <div className={`flex items-center gap-2 font-semibold transition-colors ${timeLeft < 10 ? 'text-destructive' : ''}`}>
            <Clock className="text-primary"/> <span>{timeLeft}s</span>
          </div>
        </div>
        
        <AnimatePresence mode="wait">
        <motion.div
            key={currentRound}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full"
        >
        <Card className={`w-full transition-shadow duration-300 ${shaking ? 'animate-shake' : ''} ${gameState === 'correct' ? 'shadow-lg shadow-green-500/30' : ''}`}>
          <CardHeader>
            <div className="flex items-center gap-2 text-muted-foreground self-center">
              <BrainCircuit className="h-5 w-5" />
              <p className="font-semibold text-sm">INDICE</p>
            </div>
            <CardDescription className="text-xl text-center font-serif h-12 flex items-center justify-center p-2">
              {currentWord?.clue}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6">
            <div className="flex justify-center flex-wrap gap-2">
              {currentWord?.word.split('').map((_, index) => (
                <div key={index} className="w-12 h-14 bg-secondary rounded-md flex items-center justify-center text-2xl font-bold uppercase shadow-inner">
                  {userGuess[index] || ''}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-6 gap-2 w-full max-w-md">
              {letterPool.map((letter, index) => (
                <Button key={index} variant="outline" size="lg"
                        className="h-14 text-2xl uppercase disabled:opacity-0 transition-all duration-200"
                        onClick={() => handleLetterClick(letter, index)}
                        disabled={!letter || gameState !== 'playing'}>
                  {letter}
                </Button>
              ))}
            </div>
            
            <div className="flex gap-4">
              <Button onClick={handleBackspace} variant="secondary" disabled={gameState !== 'playing'}>Effacer</Button>
              <Button onClick={handleSubmit} disabled={userGuess.length !== currentWord?.word.length || gameState !== 'playing'}>Valider</Button>
            </div>
          </CardContent>
        </Card>
        </motion.div>
        </AnimatePresence>

        <AnimatePresence>
        {gameState === 'correct' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="fixed inset-0 bg-background/80 flex flex-col items-center justify-center z-10"
          >
            <div className="bg-background p-8 rounded-full shadow-2xl animate-pulse-correct">
              <Check className="w-24 h-24 text-green-500" />
            </div>
            <p className="text-4xl font-bold mt-6 text-green-600">Correct !</p>
          </motion.div>
        )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-background">
      {renderGameContent()}
    </div>
  );
}
