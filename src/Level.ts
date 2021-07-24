import { Noun, Rules, Word } from "./Rules";
import { Action, Tile, tileProps } from "./Tile";
import { TileMap } from "./TileMap";
import { Text } from "./Text";

export type LevelAction = { type: 'win' } | { type: 'update_rules' };

export type ObjectData = {
  x: number,
  y: number,
  kind: Noun,
};

export type TextData = {
  x: number,
  y: number,
  word: Word,
};

export type LevelData = {
  name: string,
  dims: [number, number],
  text: TextData[],
  objects: ObjectData[],
};

export class Level {
  private static DEBUG = false;
  private cnv: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private map: TileMap;
  private needsUpdate = true;
  private needsRulesUpdate = true;
  private text: Text[] = [];
  private won = false;
  private dims: [number, number];
  private onWinHandlers: (() => void)[] = [];

  public static from({ dims, text, objects }: LevelData): Level {
    const lvl = new Level(dims[0], dims[1]);
    const dispatch = lvl.reactTo.bind(lvl);

    for (const { x, y, word } of text) {
      lvl.add(x, y, new Text(word, lvl.map, dispatch));
    }

    for (const { x, y, kind } of objects) {
      lvl.add(x, y, new Tile(kind, lvl.map, dispatch));
    }

    lvl.reactTo({ type: 'update_rules' });

    return lvl;
  }

  private constructor(dimX: number, dimY: number) {
    this.dims = [dimX, dimY];
    const cnv = document.createElement('canvas');
    cnv.tabIndex = 100;

    const dpr = window.devicePixelRatio;
    cnv.style.width = dimX * Tile.SIZE + 'px';
    cnv.style.height = dimY * Tile.SIZE + 'px';
    cnv.width = Math.floor(dimX * Tile.SIZE * dpr);
    cnv.height = Math.floor(dimY * Tile.SIZE * dpr);

    this.cnv = cnv;

    const ctx = this.cnv.getContext('2d');

    if (ctx === null) {
      throw new Error(`Could not create a canvas`);
    }

    this.ctx = ctx;
    this.ctx.scale(dpr, dpr);

    this.map = new TileMap(dimX, dimY);
  }

  public reactTo(action: LevelAction): void {
    switch (action.type) {
      case 'win':
        this.won = true;
        this.needsRulesUpdate = true;
        break;
      case 'update_rules':
        this.needsRulesUpdate = true;
        break;
    }
  }

  public broadcast(action: Action): void {
    this.needsUpdate = true;
    for (const tile of this.map) {
      tile.reactTo(action);
    }
  }

  private add(x: number, y: number, square: Tile): void {
    this.needsUpdate = true;
    this.map.add(x, y, square);

    if (square instanceof Text) {
      this.text.push(square);
    }
  }

  public render(): void {
    this.ctx.fillStyle = 'black';
    this.ctx.fillRect(0, 0, this.dims[0] * Tile.SIZE, this.dims[1] * Tile.SIZE);
    this.ctx.fill();

    // order tiles by zIndex
    const tiles = [...this.map].sort((a, b) => tileProps[a.kind].zIndex - tileProps[b.kind].zIndex);

    tiles.forEach(tile => tile.render(this.ctx));

    if (Level.DEBUG) {
      this.map.debug(this.ctx);
    }
  }

  public updateRules(): void {
    Rules.clear();
    Rules.add('text', 'push');

    for (const text of this.text) {
      text.indexRules(this.map);
    }

    Rules.orderByPriority();
    this.broadcast({ type: 'updated_rules' });
    this.needsRulesUpdate = false;
  }

  public update(): void {
    if (this.needsUpdate) {
      this.notifyWinListeners();

      if (this.needsRulesUpdate) {
        this.updateRules();
      }

      if (Rules.won()) {
        this.won = true;
      }


      this.render();
      this.needsUpdate = false;
    }
  }

  private notifyWinListeners(): void {
    if (this.won) {
      this.onWinHandlers.forEach(listener => {
        listener();
      });
    }
  }

  public onWin(handler: () => void): void {
    this.onWinHandlers.push(handler);
  }

  public get canvas(): Readonly<HTMLCanvasElement> {
    return this.cnv;
  }

  public get dimensions(): [number, number] {
    return this.dims;
  }

  public get tileMap(): TileMap {
    return this.map;
  }
}