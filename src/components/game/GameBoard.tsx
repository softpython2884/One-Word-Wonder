
'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Star, BrainCircuit, Check, X, Heart, ChevronsRight, Trophy, Lightbulb, Gamepad2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { INITIAL_WORDS, type Word } from '@/lib/words';
import { generateLetterPool, shuffleArray, normalizeString } from '@/lib/game-utils';
import { ExpandContent } from './ExpandContent';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


type GameState = 'start' | 'playing' | 'correct' | 'incorrect' | 'skipped' | 'gameOver';
type Difficulty = 'normal' | 'hardcore';

const ROUND_TIME = 60;
const HINTS_PER_GAME = 3;
const HIGH_SCORE_KEY = 'mot-magique-highscore';
const STREAK_TO_REGAIN_LIFE = 5;

const LIVES_BY_DIFFICULTY: Record<Difficulty, number> = {
    normal: 3,
    hardcore: 1,
};

export function GameBoard() {
  const [wordList, setWordList] = useState<Word[]>([]);
  const [gameState, setGameState] = useState<GameState>('start');
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [currentRound, setCurrentRound] = useState(0);
  const [currentWord, setCurrentWord] = useState<Word | null>(null);
  const [letterPool, setLetterPool] = useState<string[]>([]);
  const [userGuess, setUserGuess] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [lives, setLives] = useState(LIVES_BY_DIFFICULTY.normal);
  const [maxLives, setMaxLives] = useState(LIVES_BY_DIFFICULTY.normal);
  const [hintsLeft, setHintsLeft] = useState(HINTS_PER_GAME);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME);
  const [revealedByHint, setRevealedByHint] = useState<number[]>([]);
  const { toast } = useToast();
  
  const transitionTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const savedHighScore = localStorage.getItem(HIGH_SCORE_KEY);
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore, 10));
    }
    setWordList(shuffleArray([...INITIAL_WORDS]));
    return () => {
      if(transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
      }
    }
  }, []);

  useEffect(() => {
    if (gameState === 'correct' || gameState === 'incorrect' || gameState === 'skipped') {
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
      }
      transitionTimerRef.current = setTimeout(() => {
        setCurrentRound(prev => prev + 1);
      }, 1500);
    }
    return () => {
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
      }
    };
  }, [gameState]);


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
    const normalizedWord = normalizeString(word.word);
    setLetterPool(generateLetterPool(normalizedWord));
    setUserGuess(Array(normalizedWord.length).fill(''));
    setRevealedByHint([]);
    setTimeLeft(ROUND_TIME);
    setGameState('playing');
  }, [wordList, lives, updateHighScore]);

  const requestFullScreen = () => {
    const element = document.documentElement;
    if (element.requestFullscreen) {
      element.requestFullscreen().catch(err => console.log(err));
    } else if ((element as any).mozRequestFullScreen) { // Firefox
      (element as any).mozRequestFullScreen();
    } else if ((element as any).webkitRequestFullscreen) { // Chrome, Safari and Opera
      (element as any).webkitRequestFullscreen();
    } else if ((element as any).msRequestFullscreen) { // IE/Edge
      (element as any).msRequestFullscreen();
    }
  };

  const startGame = useCallback(() => {
    const startingLives = LIVES_BY_DIFFICULTY[difficulty];
    setMaxLives(startingLives);
    setLives(startingLives);
    setWordList(shuffleArray([...INITIAL_WORDS]));
    setCurrentRound(0);
    setScore(0);
    setHintsLeft(HINTS_PER_GAME);
    setStreak(0);
    setupRound(0);
    requestFullScreen();
  }, [setupRound, difficulty]);
  
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
    if (gameState !== 'start' && gameState !== 'gameOver') {
        setupRound(currentRound);
    }
  }, [currentRound]);


  useEffect(() => {
    if ((currentRound >= wordList.length || lives <= 0) && gameState !== 'start' && gameState !== 'gameOver') {
        setGameState('gameOver');
        updateHighScore();
    }
  }, [currentRound, wordList.length, lives, updateHighScore, gameState]);


  const handleLetterClick = (letter: string, index: number) => {
    if (gameState !== 'playing') return;
    const firstEmptyIndex = userGuess.findIndex(l => l === '');
    if (firstEmptyIndex !== -1) {
      const newGuess = [...userGuess];
      newGuess[firstEmptyIndex] = letter;
      setUserGuess(newGuess);

      const newPool = [...letterPool];
      newPool[index] = '';
      setLetterPool(newPool);
    }
  };

  const handleBackspace = () => {
    if (gameState !== 'playing' || difficulty === 'hardcore') return;
    let lastFilledIndex = -1;
    for (let i = userGuess.length - 1; i >= 0; i--) {
        if (userGuess[i] !== '' && !revealedByHint.includes(i)) {
            lastFilledIndex = i;
            break;
        }
    }

    if (lastFilledIndex !== -1) {
        const letterToReturn = userGuess[lastFilledIndex];
        const newGuess = [...userGuess];
        newGuess[lastFilledIndex] = '';
        setUserGuess(newGuess);

        const firstEmptyPoolIndex = letterPool.findIndex(l => l === '');
        if (firstEmptyPoolIndex !== -1) {
            const newPool = [...letterPool];
            newPool[firstEmptyPoolIndex] = letterToReturn;
            setLetterPool(newPool);
        }
    }
  };
  
  const handleSkip = () => {
    if(gameState !== 'playing') return;
    loseLifeAndContinue('skipped', "Mot passé");
  };

  const useHint = () => {
    if (hintsLeft <= 0 || gameState !== 'playing') return;

    const unrevealedIndices = normalizedCurrentWord.split('').map((_, i) => i).filter(i => !userGuess[i] || userGuess[i] !== normalizedCurrentWord[i]);

    if(unrevealedIndices.length === 0) return;

    const randomIndex = unrevealedIndices[Math.floor(Math.random() * unrevealedIndices.length)];
    const correctLetter = normalizedCurrentWord[randomIndex];
    
    const newGuess = [...userGuess];
    
    if (newGuess[randomIndex] && newGuess[randomIndex] !== '') {
       const letterToReturn = newGuess[randomIndex];
       const firstEmptyPoolIndex = letterPool.findIndex(l => l === '');
       if(firstEmptyPoolIndex !== -1) {
         const newPool = [...letterPool];
         newPool[firstEmptyPoolIndex] = letterToReturn;
         setLetterPool(newPool);
       }
    }
    
    newGuess[randomIndex] = correctLetter;
    
    setRevealedByHint(prev => [...prev, randomIndex]);
    
    const poolIndex = letterPool.findIndex((l, idx) => {
        if (l === correctLetter) {
            const guessCount = newGuess.filter(gl => gl === correctLetter).length;
            const poolCount = letterPool.filter(pl => pl === correctLetter).length;
            const originalCount = normalizedCurrentWord.split('').filter(cl => cl === correctLetter).length;
            if (guessCount <= originalCount) {
                return true;
            }
        }
        return false;
    });

    if (poolIndex !== -1) {
        const newPool = [...letterPool];
        newPool[poolIndex] = '';
        setLetterPool(newPool);
    }

    setUserGuess(newGuess);
    setHintsLeft(h => h - 1);
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
            if (l < maxLives) {
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
            
            {gameState === 'start' && (
              <div className="flex flex-col items-center gap-4 p-4">
                <div className="w-full max-w-xs">
                  <Label htmlFor="difficulty-select" className="mb-2 block text-sm font-medium text-muted-foreground">Difficulté</Label>
                  <Select value={difficulty} onValueChange={(value: Difficulty) => setDifficulty(value)}>
                    <SelectTrigger id="difficulty-select" className="w-full">
                      <SelectValue placeholder="Choisir la difficulté..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal (3 vies)</SelectItem>
                      <SelectItem value="hardcore">Hardcore (1 vie, pas d'effacement)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <Button size="lg" onClick={startGame}>
               <Gamepad2 className="mr-2" />
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
      <div className="w-full max-w-lg mx-auto flex flex-col items-center gap-4 md:gap-6">
        <div className="w-full flex justify-between items-center text-lg px-2">
           <div className="flex items-center gap-2 font-semibold">
              <Star className="text-primary"/> <span>{score}</span>
          </div>
           <div className="flex items-center gap-2">
            {Array.from({ length: maxLives }).map((_, i) => (
              <Heart
                key={i}
                className={`transition-all ${i < lives ? 'text-red-500 fill-current animate-pulse' : 'text-muted-foreground'}`}
              />
            ))}
          </div>
           <div className="flex items-center gap-2">
                <Lightbulb className="text-yellow-400" />
                <span>{hintsLeft}</span>
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
                <div key={index} className={`w-10 h-12 md:w-12 md:h-14 rounded-md flex items-center justify-center text-xl md:text-2xl font-bold uppercase shadow-inner ${revealedByHint.includes(index) ? 'bg-green-200 text-green-800' : 'bg-secondary'}`}>
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
            
            <div className="w-full flex flex-col items-center gap-2 md:gap-3">
              <div className="flex justify-center gap-2 md:gap-4">
                 <Button onClick={handleBackspace} variant="secondary" disabled={gameState !== 'playing' || difficulty === 'hardcore'}><RotateCcw className="mr-2" />Effacer</Button>
                  <Button onClick={useHint} variant="outline" className="bg-yellow-400 hover:bg-yellow-500" disabled={hintsLeft <= 0 || gameState !== 'playing'}>
                    <Lightbulb className="mr-2" /> Indice
                  </Button>
                  <Button onClick={handleSkip} variant="ghost" disabled={gameState !== 'playing'}>Passer <ChevronsRight className="hidden sm:inline" /></Button>
              </div>
              <Button onClick={handleSubmit} size="lg" className="w-full max-w-xs" disabled={userGuess.join('').length !== normalizedCurrentWord.length || gameState !== 'playing'}>
                <Check className="mr-2" /> Valider
              </Button>
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

    