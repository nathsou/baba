import { Rules } from "./Rules";
import { Action, Tile } from "./Tile";
import { TileMap } from "./TileMap";
import { Text } from "./Text";

export type LevelAction = { type: 'win' } | { type: 'update_rules' };

export class Level {
  private static DEBUG = false;
  private cnv: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private map: TileMap;
  private needsUpdate = true;
  private needsRulesUpdate = true;
  private text: Text[] = [];
  private won = false;

  constructor(dimX: number, dimY: number) {
    this.cnv = document.createElement('canvas');
    this.cnv.tabIndex = 100;
    this.cnv.width = dimX * Tile.SIZE;
    this.cnv.height = dimY * Tile.SIZE;
    this.map = new TileMap(dimX, dimY);

    const ctx = this.cnv.getContext('2d');

    if (ctx === null) {
      throw new Error(`Could not create a canvas`);
    }

    this.ctx = ctx;
    this.initListeners();
  }

  public reactTo(action: LevelAction): void {
    switch (action.type) {
      case 'win':
        this.won = true;
        break;
      case 'update_rules':
        this.needsRulesUpdate = true;
        break;
    }
  }

  public initListeners(): void {
    this.cnv.addEventListener('keydown', event => {
      event.preventDefault();
      switch (event.code) {
        case 'KeyA':
        case 'ArrowLeft':
          this.broadcast({ type: 'controls', deltaX: -1, deltaY: 0 });
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.broadcast({ type: 'controls', deltaX: 1, deltaY: 0 });
          break;
        case 'KeyW':
        case 'ArrowUp':
          this.broadcast({ type: 'controls', deltaX: 0, deltaY: -1 });
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.broadcast({ type: 'controls', deltaX: 0, deltaY: 1 });
          break;
      }
    });
  }

  private broadcast(action: Action): void {
    this.needsUpdate = true;
    for (const square of this.map) {
      square.reactTo(action);
    }
  }

  public add(x: number, y: number, square: Tile): void {
    this.needsUpdate = true;
    this.map.add(x, y, square);

    if (square instanceof Text) {
      this.text.push(square);
    }
  }

  public render(): void {
    this.ctx.fillStyle = 'black';
    this.ctx.fillRect(0, 0, this.cnv.width, this.cnv.height);
    this.ctx.fill();

    for (const square of this.map) {
      const pos = this.map.position(square);
      if (pos) {
        square.render(pos.x, pos.y, this.ctx);
      }
    }

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

    console.log(Rules.all());
  }

  public update(): void {
    if (!this.won && this.needsUpdate) {
      if (this.needsRulesUpdate) {
        this.updateRules();
      }

      if (Rules.won()) {
        this.won = true;
      }

      for (const square of this.map) {
        square.update();
      }

      this.render();
      this.needsUpdate = false;
    }
  }

  public start(): void {
    const callback = () => {
      this.update();
      requestAnimationFrame(callback);
    };

    requestAnimationFrame(callback);
  };

  public get canvas(): Readonly<HTMLCanvasElement> {
    return this.cnv;
  }

  public get tileMap(): TileMap {
    return this.map;
  }
}