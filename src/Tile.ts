import { behaviors } from "./Behavior";
import { LevelAction } from "./Level";
import { isProperty, Noun, Rules, Word } from "./Rules";
import { TileMap } from "./TileMap";

const squareProps: { [N in Noun]: { color: string } } = {
  baba: { color: '#88c0d1ba' },
  wall: { color: '#a37949ba' },
  flag: { color: '#fffeab' },
  text: { color: '#ffffff' },
  rock: { color: 'blue' },
};

type ControlsAction = { type: 'controls', deltaX: number, deltaY: number };
type UpdatedRulesAction = { type: 'updated_rules' };
type WinAction = { type: 'win' };
type MoveAction = { type: 'move', deltaX: number, deltaY: number };

export type Action = ControlsAction | MoveAction | WinAction | UpdatedRulesAction;

export type Dispatcher = (action: LevelAction) => void;

export class Tile {
  public static SIZE = 64;

  private noun: Noun = 'baba';
  protected color: string = 'red';
  public dispatch: Dispatcher;
  public map: TileMap;

  constructor(kind: Noun, map: TileMap, dispatch: Dispatcher) {
    this.setKind(kind);
    this.map = map;
    this.dispatch = dispatch;
  }

  public get position(): { x: number, y: number } {
    return this.map.position(this);
  }

  public get x(): number {
    return this.position.x;
  }

  public get y(): number {
    return this.position.y;
  }

  public setKind(kind: Noun): void {
    this.noun = kind;
    this.color = squareProps[kind].color;
  }

  public update(): void {

  }

  public render(x: number, y: number, ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = this.color;
    ctx.fillRect(x * Tile.SIZE, y * Tile.SIZE, Tile.SIZE, Tile.SIZE);
    ctx.fill();

    ctx.strokeStyle = 'grey';
    ctx.strokeRect(x * Tile.SIZE, y * Tile.SIZE, Tile.SIZE, Tile.SIZE);
    ctx.stroke();
  }

  public reactTo(action: Action): void {
    if (behaviors.always(action, this) === 'break') {
      return;
    }

    for (const word of Rules.get(this.kind)) {
      if (isProperty(word)) {
        const shouldBreak = behaviors[word](action, this) === 'break';
        if (shouldBreak) break;
      }
    }
  }

  public get kind(): Noun {
    return this.noun;
  }

  public is(word: Word): boolean {
    return Rules.is(this.kind, word);
  }

  public overlapping(): Tile[] {
    return this.map.at(this.x, this.y);
  }
}