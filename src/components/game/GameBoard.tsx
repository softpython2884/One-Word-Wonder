'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Star, BrainCircuit, Check, X, Heart, ChevronsRight, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { INITIAL_WORDS, type Word } from '@/lib/words';
import { generateLetterPool, shuffleArray, normalizeString } from '@/lib/game-utils';
import { ExpandContent } from './ExpandContent';
import { useToast } from '@/hooks/use-toast';

type GameState = 'start' | 'playing' | 'correct' | 'incorrect' | 'skipped' | 'gameOver';

const ROUND_TIME = 60;
const MAX_LIVES = 3;
const HIGH_SCORE_KEY = 'mot-magique-highscore';
const STREAK_TO_REGAIN_LIFE = 5;

export function GameBoard() {
  const [wordList, setWordList] = useState<Word[]>([]);
  const [gameState, setGameState] = useState<GameState>('start');
  const [currentRound, setCurrentRound] = useState(0);
  const [currentWord, setCurrentWord] = useState<Word | null>(null);
  const [letterPool, setLetterPool] = useState<string[]>([]);
  const [userGuess, setUserGuess] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME);
  const { toast } = useToast();
  
  useEffect(() => {
    const savedHighScore = localStorage.getItem(HIGH_SCORE_KEY);
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore, 10));
    }
    // Initial shuffle
    setWordList(shuffleArray([...INITIAL_WORDS]));
  }, []);

  const updateHighScore = useCallback(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem(HIGH_SCORE_KEY, score.toString());
    }
  }, [score, highScore]);

  const currentWordDisplay = useMemo(() => currentWord?.word.toUpperCase() ?? '', [currentWord]);
  const normalizedCurrentWord = useMemo(() => currentWord ? normalizeString(currentWord.word) : '', [currentWord]);

  const setupRound = useCallback((roundIndex: number) => {
    if (roundIndex >= wordList.length || lives <= 0) {
      setGameState('gameOver');
      updateHighScore();
      return;
    }
    const word = wordList[roundIndex];
    setCurrentWord(word);
    setLetterPool(generateLetterPool(normalizeString(word.word)));
    setUserGuess([]);
    setTimeLeft(ROUND_TIME);
    setGameState('playing');
  }, [wordList, lives, updateHighScore]);

  const startGame = useCallback(() => {
    setWordList(shuffleArray([...INITIAL_WORDS]));
    setCurrentRound(0);
    setScore(0);
    setLives(MAX_LIVES);
    setStreak(0);
    setupRound(0);
  }, [setupRound]);
  
  const loseLifeAndContinue = useCallback((state: 'incorrect' | 'skipped', message: string) => {
    toast({ title: message, description: `Le mot était : ${currentWordDisplay}`, variant: 'destructive' });
    setLives(l => l - 1);
    setStreak(0);
    setGameState(state);
  }, [currentWordDisplay, toast]);

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (gameState === 'playing' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (gameState === 'playing' && timeLeft === 0) {
      loseLifeAndContinue('incorrect', "Temps écoulé !");
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft, loseLifeAndContinue]);

  useEffect(() => {
    let transitionTimer: NodeJS.Timeout | undefined;
    if (['correct', 'incorrect', 'skipped'].includes(gameState)) {
      transitionTimer = setTimeout(() => {
        setCurrentRound(prev => prev + 1);
      }, 1500);
    }
    return () => clearTimeout(transitionTimer);
  }, [gameState]);


  useEffect(() => {
    if(gameState !== 'start' && gameState !== 'gameOver' && currentRound > 0) {
        setupRound(currentRound);
    }
  }, [currentRound, setupRound, gameState]);


  useEffect(() => {
    if ((currentRound >= wordList.length || lives <= 0) && gameState !== 'start' && gameState !== 'gameOver') {
        setGameState('gameOver');
        updateHighScore();
    }
  }, [currentRound, wordList.length, lives, updateHighScore, gameState]);


  const handleLetterClick = (letter: string, index: number) => {
    if (userGuess.length < (normalizedCurrentWord.length ?? 0)) {
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
  
  const handleSkip = () => {
    if(gameState !== 'playing') return;
    loseLifeAndContinue('skipped', "Mot passé");
  };

  const handleSubmit = () => {
    if(gameState !== 'playing') return;
    if (userGuess.join('') === normalizedCurrentWord) {
      const timeBonus = Math.max(0, timeLeft);
      const newStreak = streak + 1;
      const streakBonus = streak * 5;
      setScore(s => s + 10 + timeBonus + streakBonus);
      setStreak(newStreak);

      if (newStreak > 0 && newStreak % STREAK_TO_REGAIN_LIFE === 0) {
        setLives(l => {
            if (l < MAX_LIVES) {
                toast({ title: "Vie récupérée !", description: "Super série ! Vous avez regagné une vie." });
                return l + 1;
            }
            return l;
        });
      }

      setGameState('correct');
    } else {
       loseLifeAndContinue('incorrect', "Incorrect !");
    }
  };

  const handleWordsExpanded = (newWords: Word[]) => {
    setWordList(prev => shuffleArray([...prev, ...newWords]));
  };

  const renderGameContent = () => {
    if (gameState === 'start' || gameState === 'gameOver') {
      return (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full">
        <Card className="w-full max-w-md mx-auto text-center">
          <CardHeader>
            <CardTitle className="text-4xl font-headline text-primary">Mot Magique</CardTitle>
            <CardDescription>{gameState === 'start' ? "Testez votre vocabulaire français !" : "Partie terminée !"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="flex justify-center items-center gap-2 text-muted-foreground">
                <Trophy className="h-5 w-5 text-yellow-500" />
                <p>Meilleur score : {highScore}</p>
            </div>
            {gameState === 'gameOver' && <p className="text-2xl">Votre score final : {score}</p>}
            <Button size="lg" onClick={startGame}>
              {gameState === 'start' ? "Commencer le jeu" : "Rejouer"}
            </Button>
            <div className="pt-4">
               <ExpandContent currentWords={wordList} onWordsExpanded={handleWordsExpanded} />
            </div>
          </CardContent>
        </Card>
        </motion.div>
      );
    }
    
    return (
      <div className="w-full max-w-md mx-auto flex flex-col items-center gap-4 md:gap-6">
        <div className="w-full flex justify-between items-center text-lg px-2">
          <div className="flex items-center gap-2 font-semibold">
            <Star className="text-primary"/> <span>{score}</span>
          </div>
           <div className="flex items-center gap-2">
            {Array.from({ length: MAX_LIVES }).map((_, i) => (
              <Heart
                key={i}
                className={`transition-all ${i < lives ? 'text-red-500 fill-current animate-pulse' : 'text-muted-foreground'}`}
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
        <Card className={`w-full transition-shadow duration-300`}>
          <CardHeader>
            <div className="flex items-center gap-2 text-muted-foreground self-center">
              <BrainCircuit className="h-5 w-5" />
              <p className="font-semibold text-sm">INDICE</p>
            </div>
            <CardDescription className="text-lg md:text-xl text-center font-serif h-12 flex items-center justify-center p-2">
              {currentWord?.clue}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4 md:gap-6">
            <div className="flex justify-center flex-wrap gap-1.5 md:gap-2">
              {normalizedCurrentWord.split('').map((_, index) => (
                <div key={index} className="w-10 h-12 md:w-12 md:h-14 bg-secondary rounded-md flex items-center justify-center text-xl md:text-2xl font-bold uppercase shadow-inner">
                  {userGuess[index] || ''}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-5 sm:grid-cols-6 gap-2 w-full max-w-sm">
              {letterPool.map((letter, index) => (
                <Button key={index} variant="outline" size="lg"
                        className="h-12 md:h-14 text-xl md:text-2xl uppercase disabled:opacity-0 transition-all duration-200"
                        onClick={() => handleLetterClick(letter, index)}
                        disabled={!letter || gameState !== 'playing'}>
                  {letter}
                </Button>
              ))}
            </div>
            
            <div className="flex flex-wrap justify-center gap-2 md:gap-4">
              <Button onClick={handleBackspace} variant="secondary" disabled={gameState !== 'playing'}>Effacer</Button>
              <Button onClick={handleSubmit} disabled={userGuess.length !== normalizedCurrentWord.length || gameState !== 'playing'}>Valider</Button>
              <Button onClick={handleSkip} variant="ghost" disabled={gameState !== 'playing'}>Passer <ChevronsRight className="hidden sm:inline" /></Button>
            </div>
          </CardContent>
        </Card>
        </motion.div>
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-2 sm:p-4 bg-background overflow-hidden">
      {renderGameContent()}
      
      <AnimatePresence>
        {['correct', 'incorrect', 'skipped'].includes(gameState) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.3 } }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center z-50 p-4"
          >
            <motion.div 
              initial={{ scale:0 }} animate={{ scale:1 }}
              className={`p-8 rounded-full shadow-2xl ${gameState === 'correct' ? 'bg-green-100' : 'bg-red-100 animate-shake'}`}>
              {gameState === 'correct' ? (
                 <Check className="w-16 h-16 md:w-24 md:h-24 text-green-500" />
              ) : (
                 <X className="w-16 h-16 md:w-24 md:h-24 text-red-500" />
              )}
            </motion.div>
            {gameState === 'correct' ? (
                <motion.p initial={{y: 20, opacity: 0}} animate={{y: 0, opacity: 1, transition: {delay: 0.1}}} className="text-3xl md:text-4xl font-bold mt-6 text-green-600">Correct !</motion.p>
            ) : (
                <>
                  <motion.p initial={{y: 20, opacity: 0}} animate={{y: 0, opacity: 1, transition: {delay: 0.1}}} className="text-3xl md:text-4xl font-bold mt-6 text-red-600">{gameState === 'skipped' ? 'Passé' : 'Incorrect !'}</motion.p>
                  <motion.p initial={{y: 20, opacity: 0}} animate={{y: 0, opacity: 1, transition: {delay: 0.2}}} className="text-xl md:text-2xl font-bold mt-2 text-foreground">{currentWordDisplay}</motion.p>
                </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
