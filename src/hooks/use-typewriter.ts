import { useEffect, useState } from 'react';

const TYPE_MS = 90;
const DELETE_MS = 45;
const HOLD_MS = 1300;
const GAP_MS = 350;

/**
 * Types each word out letter by letter, holds it, deletes it, then moves on to the next word
 * (looping forever). Returns the text as it currently reads. Pass a stable `words` array.
 * While `enabled` is false nothing runs, so there are no idle timers.
 */
export function useTypewriter(words: readonly string[], enabled: boolean): string {
  const [text, setText] = useState('');

  useEffect(() => {
    if (!enabled || words.length === 0) return;

    let wordIndex = 0;
    let charCount = 0;
    let deleting = false;
    let timer: ReturnType<typeof setTimeout>;

    const tick = () => {
      const word = words[wordIndex];
      if (!deleting) {
        charCount += 1;
        setText(word.slice(0, charCount));
        if (charCount === word.length) {
          deleting = true;
          timer = setTimeout(tick, HOLD_MS);
          return;
        }
        timer = setTimeout(tick, TYPE_MS);
      } else {
        charCount -= 1;
        setText(word.slice(0, charCount));
        if (charCount === 0) {
          deleting = false;
          wordIndex = (wordIndex + 1) % words.length;
          timer = setTimeout(tick, GAP_MS);
          return;
        }
        timer = setTimeout(tick, DELETE_MS);
      }
    };

    timer = setTimeout(tick, GAP_MS);
    return () => clearTimeout(timer);
  }, [words, enabled]);

  return text;
}
