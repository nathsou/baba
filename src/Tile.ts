import { behaviors } from "./Behavior";
import { LevelAction } from "./Level";
import { isProperty, Noun, Rules, Word } from "./Rules";
import { TileMap } from "./TileMap";

export const tileProps: { [N in Noun]: { color: string, zIndex: number } } = {
  baba: { color: '#E40066', zIndex: 10 },
  wall: { color: '#FB4D3D', zIndex: 0 },
  water: { color: '#345995', zIndex: 0 },
  flag: { color: '#EAC435', zIndex: 10 },
  text: { color: '#ffffff', zIndex: 10 },
  rock: { color: 'blue', zIndex: 10 },
};

type ControlsAction = { type: 'controls', deltaX: number, deltaY: number };
type UpdatedRulesAction = { type: 'updated_rules' };
type WinAction = { type: 'win' };
type MoveAction = { type: 'move', deltaX: number, deltaY: number };

export type Action = ControlsAction | MoveAction | WinAction | UpdatedRulesAction;

export type Dispatcher = (action: LevelAction) => void;

export class Tile {
  public static SIZE = 48;

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
    this.color = tileProps[kind].color;
  }

  public update(): void {

  }

  public render(ctx: CanvasRenderingContext2D): void {
    const { x, y } = this.position;
    ctx.fillStyle = this.color;
    ctx.fillRect(x * Tile.SIZE, y * Tile.SIZE, Tile.SIZE, Tile.SIZE);
    ctx.fill();

    // ctx.strokeStyle = 'grey';
    // ctx.strokeRect(x * Tile.SIZE, y * Tile.SIZE, Tile.SIZE, Tile.SIZE);
    // ctx.stroke();
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