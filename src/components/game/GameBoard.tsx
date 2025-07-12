'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Star, BrainCircuit, Check, X, Heart, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { INITIAL_WORDS, type Word } from '@/lib/words';
import { generateLetterPool, shuffleArray } from '@/lib/game-utils';
import { ExpandContent } from './ExpandContent';
import { useToast } from '@/hooks/use-toast';
import { useSounds } from '@/hooks/use-sounds';

type GameState = 'start' | 'playing' | 'correct' | 'incorrect' | 'skipped' | 'gameOver';

const ROUND_TIME = 60;
const MAX_LIVES = 3;

export function GameBoard() {
  const [gameState, setGameState] = useState<GameState>('start');
  const [wordList, setWordList] = useState<Word[]>(() => shuffleArray(INITIAL_WORDS));
  const [currentRound, setCurrentRound] = useState(0);
  const [currentWord, setCurrentWord] = useState<Word | null>(null);
  const [letterPool, setLetterPool] = useState<string[]>([]);
  const [userGuess, setUserGuess] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME);
  const [shaking, setShaking] = useState(false);
  const { toast } = useToast();
  const { playSound } = useSounds();

  const currentWordDisplay = useMemo(() => currentWord?.word.toUpperCase() ?? '', [currentWord]);

  const setupRound = useCallback(() => {
    if (lives <= 0 || currentRound >= wordList.length) {
      setGameState('gameOver');
      playSound('gameOver');
      return;
    }
    const word = wordList[currentRound];
    setCurrentWord(word);
    setLetterPool(generateLetterPool(word.word));
    setUserGuess([]);
    setTimeLeft(ROUND_TIME);
    setGameState('playing');
  }, [currentRound, wordList, lives, playSound]);

  const startGame = useCallback(() => {
    setCurrentRound(0);
    setScore(0);
    setLives(MAX_LIVES);
    setStreak(0);
    setWordList(current => shuffleArray(current));
    playSound('start');
    setupRound();
  }, [setupRound, playSound]);

  const nextRound = useCallback(() => {
    setCurrentRound(prev => prev + 1);
  }, []);

  useEffect(() => {
    if (gameState === 'start' || gameState === 'gameOver') return;
    if (gameState !== 'playing') {
       const timer = setTimeout(() => {
          setupRound();
       }, 1500);
       return () => clearTimeout(timer);
    }
  }, [currentRound, gameState]);

  useEffect(() => {
    if (gameState !== 'playing') return;

    if (timeLeft === 0) {
      playSound('incorrect');
      toast({ title: "Temps écoulé !", description: `Le mot était : ${currentWord?.word}`, variant: 'destructive' });
      setLives(l => l - 1);
      setStreak(0);
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
  }, [gameState, timeLeft, currentWord, toast, nextRound, playSound]);

  const handleLetterClick = (letter: string, index: number) => {
    if (userGuess.length < (currentWord?.word.length ?? 0)) {
      playSound('click');
      setUserGuess([...userGuess, letter]);
      const newPool = [...letterPool];
      newPool[index] = '';
      setLetterPool(newPool);
    }
  };

  const handleBackspace = () => {
    if (userGuess.length > 0) {
      playSound('click');
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
  
  const handleSkip = () => {
    playSound('incorrect');
    setLives(l => l - 1);
    setStreak(0);
    setGameState('skipped');
    toast({ title: "Mot passé", description: `Le mot était : ${currentWord?.word}`, variant: 'destructive'});
    setTimeout(() => {
        nextRound();
    }, 1500);
  };

  const handleSubmit = () => {
    if (userGuess.join('') === currentWord?.word) {
      playSound('correct');
      const timeBonus = Math.max(0, timeLeft);
      const streakBonus = streak * 5;
      setScore(s => s + 10 + timeBonus + streakBonus);
      setStreak(s => s + 1);
      setGameState('correct');
      setTimeout(() => {
        nextRound();
      }, 1500);
    } else {
      playSound('incorrect');
      setLives(l => l - 1);
      setStreak(0);
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
           <div className="flex items-center gap-2">
            {Array.from({ length: MAX_LIVES }).map((_, i) => (
              <Heart
                key={i}
                className={`transition-all ${i < lives ? 'text-red-500 fill-current' : 'text-muted-foreground'}`}
              />
            ))}
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
              <Button onClick={handleSkip} variant="ghost" disabled={gameState !== 'playing'}>Passer <ChevronsRight /></Button>
            </div>
          </CardContent>
        </Card>
        </motion.div>
        </AnimatePresence>

        <AnimatePresence>
        {['correct', 'incorrect', 'skipped'].includes(gameState) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="fixed inset-0 bg-background/80 flex flex-col items-center justify-center z-10"
          >
            <div className={`p-8 rounded-full shadow-2xl ${gameState === 'correct' ? 'bg-green-100 animate-pulse-correct' : 'bg-red-100 animate-shake'}`}>
              {gameState === 'correct' ? (
                 <Check className="w-24 h-24 text-green-500" />
              ) : (
                 <X className="w-24 h-24 text-red-500" />
              )}
            </div>
            {gameState === 'correct' ? (
                <p className="text-4xl font-bold mt-6 text-green-600">Correct !</p>
            ) : (
                <>
                  <p className="text-4xl font-bold mt-6 text-red-600">{gameState === 'skipped' ? 'Passé' : 'Incorrect !'}</p>
                  <p className="text-2xl font-bold mt-2 text-foreground">{currentWordDisplay}</p>
                </>
            )}
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
