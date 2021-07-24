
export type Noun = 'wall' | 'baba' | 'text' | 'flag' | 'rock' | 'water';
export type Connector = 'is';
export type Property = 'you' | 'stop' | 'push' | 'win';

export const priorities: { [P in Property]: number } = {
  win: 100,
  stop: 50,
  you: 20,
  push: 10,
};

const getPriority = (word: Word): number => {
  return isProperty(word) ? priorities[word] : 0;
};

export type Word = Noun | Connector | Property;

export type WordKind = 'noun' | 'connector' | 'property';

export const wordKinds: { [W in Word]: WordKind } = {
  flag: 'noun',
  baba: 'noun',
  wall: 'noun',
  water: 'noun',
  text: 'noun',
  rock: 'noun',
  is: 'connector',
  you: 'property',
  stop: 'property',
  push: 'property',
  win: 'property',
};

export const isNoun = (word: Word): word is Noun => {
  return wordKinds[word] === 'noun';
};

export const isConnector = (word: Word): word is Connector => {
  return wordKinds[word] === 'connector';
};

export const isProperty = (word: Word): word is Property => {
  return wordKinds[word] === 'property';
};

export class Rules {
  private rules: Map<Word, Word[]>;
  private static instance = new Rules();

  private constructor() {
    this.rules = new Map();
  }

  public static add(lhs: Word, rhs: Word): void {
    if (!this.instance.rules.has(lhs)) {
      this.instance.rules.set(lhs, []);
    }

    this.instance.rules.get(lhs)?.push(rhs);
  }

  public static get(lhs: Word): Word[] {
    return this.instance.rules.get(lhs) ?? [];
  }

  public static is(lhs: Word, rhs: Word): boolean {
    return this.get(lhs)?.some(r => r === rhs) ?? false;
  }

  public static clear(): void {
    Rules.instance.rules.clear();
  }

  public static orderByPriority(): void {
    for (const [key, value] of Rules.instance.rules) {
      Rules.instance.rules.set(key, value.sort((a, b) => getPriority(a) - getPriority(b)));
    }
  }

  public static won(): boolean {
    return [...Rules.instance.rules.keys()].some(lhs => Rules.is(lhs, 'you') && Rules.is(lhs, 'win'));
  }

  public static all(): Readonly<Map<Word, Word[]>> {
    return Rules.instance.rules;
  }
}