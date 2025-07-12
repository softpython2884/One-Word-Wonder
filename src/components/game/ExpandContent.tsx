'use client';

import { useState } from 'react';
import { Wand2, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { type Word } from '@/lib/words';
import { expandWordsAction } from '@/actions/expand-words';

interface ExpandContentProps {
  currentWords: Word[];
  onWordsExpanded: (newWords: Word[]) => void;
}

export function ExpandContent({ currentWords, onWordsExpanded }: ExpandContentProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleExpand = async () => {
    setIsLoading(true);
    const baseWords = currentWords.map(w => w.word).join(', ');
    const result = await expandWordsAction({ baseWords });

    if (result.error) {
      toast({
        title: "Erreur de génération",
        description: result.error,
        variant: "destructive",
      });
    } else if (result.data) {
      onWordsExpanded(result.data);
      toast({
        title: "Liste de mots enrichie !",
        description: `${result.data.length} nouveaux mots ont été ajoutés.`,
      });
      setIsOpen(false);
    }
    setIsLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Wand2 className="mr-2 h-4 w-4" />
          Enrichir la liste
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enrichir la liste de mots avec l'IA</DialogTitle>
          <DialogDescription>
            Utiliser l'IA pour générer 5 nouveaux mots et indices basés sur la liste actuelle. Les nouveaux mots seront en français.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setIsOpen(false)} disabled={isLoading}>Annuler</Button>
          <Button onClick={handleExpand} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Générer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
