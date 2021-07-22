import { Rules, Word, WordKind, wordKinds } from "./Rules";
import { Dispatcher, Tile } from "./Tile";
import { TileMap } from "./TileMap";

type WordProps = {
  color: string,
};

export const textProps: { [W in Word]: WordProps } = {
  baba: { color: '#b259d9' },
  flag: { color: 'yellow' },
  wall: { color: '#525252' },
  is: { color: 'white' },
  you: { color: '#fffeab' },
  stop: { color: '#687a5c' },
  push: { color: '#74cfc7' },
  win: { color: 'yellow' },
  text: { color: 'grey' },
  rock: { color: 'white' },
};

export class Text extends Tile {
  public static FONT_SIZE = 16;
  private text: Word;
  private textColor: string;
  private wordKind: WordKind;

  constructor(text: Word, map: TileMap, dispatch: Dispatcher) {
    super('text', map, dispatch);
    this.text = text;
    this.textColor = textProps[text].color;
    this.wordKind = wordKinds[text];
  }

  public getText(): Word {
    return this.text;
  }

  public isNoun(): boolean {
    return this.wordKind === 'noun';
  }

  public isConnector(): boolean {
    return this.wordKind === 'noun';
  }

  public isProperty(): boolean {
    return this.wordKind === 'property';
  }

  private indexRuleFrom(x: number, y: number, dir: 'left' | 'down', map: TileMap) {
    const deltaX = dir === 'left' ? 1 : 0;
    const deltaY = dir === 'down' ? 1 : 0;

    const squares = map.at(x + deltaX, y + deltaY);
    for (const sq of squares) {
      if (sq instanceof Text && sq.text === 'is') {
        const left2 = map.at(x + 2 * deltaX, y + 2 * deltaY);
        for (const sq of left2) {
          if (sq instanceof Text) {
            Rules.add(this.text, sq.text);
          }
        }
      }
    }
  }

  public indexRules(map: TileMap): void {
    const pos = map.position(this);

    if (pos) {
      this.indexRuleFrom(pos.x, pos.y, 'left', map);
      this.indexRuleFrom(pos.x, pos.y, 'down', map);
    }
  }

  public render(x: number, y: number, ctx: CanvasRenderingContext2D): void {
    super.render(x, y, ctx);

    const upper = this.text.toUpperCase();
    ctx.fillStyle = 'black'; // this.textColor;
    ctx.font = `${Text.FONT_SIZE}px Arial`;
    const { width: textWidth } = ctx.measureText(upper);
    ctx.fillText(
      upper,
      x * Tile.SIZE + (Tile.SIZE - textWidth) / 2,
      y * Tile.SIZE + (Tile.SIZE + Text.FONT_SIZE) / 2,
      Tile.SIZE
    );
    ctx.fill();
  }
}