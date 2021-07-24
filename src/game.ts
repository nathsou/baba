import { Level, LevelData } from "./Level";
import { Tile } from "./Tile";

const lvl0: LevelData = {
  name: 'Level 0',
  dims: [15, 13],
  text: [
    { x: 2, y: 2, word: 'baba' },
    { x: 3, y: 2, word: 'is' },
    { x: 4, y: 2, word: 'you' },
    { x: 10, y: 2, word: 'flag' },
    { x: 11, y: 2, word: 'is' },
    { x: 12, y: 2, word: 'win' },
    { x: 2, y: 10, word: 'wall' },
    { x: 3, y: 10, word: 'is' },
    { x: 4, y: 10, word: 'stop' },
    { x: 10, y: 10, word: 'rock' },
    { x: 11, y: 10, word: 'is' },
    { x: 12, y: 10, word: 'push' },
  ],
  objects: [
    { kind: 'baba', x: 3, y: 6 },
    { kind: 'flag', x: 12, y: 6 },
    { kind: 'wall', x: 2, y: 4 },
    { kind: 'wall', x: 3, y: 4 },
    { kind: 'wall', x: 4, y: 4 },
    { kind: 'wall', x: 5, y: 4 },
    { kind: 'wall', x: 6, y: 4 },
    { kind: 'wall', x: 7, y: 4 },
    { kind: 'wall', x: 8, y: 4 },
    { kind: 'wall', x: 9, y: 4 },
    { kind: 'wall', x: 10, y: 4 },
    { kind: 'wall', x: 11, y: 4 },
    { kind: 'wall', x: 12, y: 4 },
    { kind: 'wall', x: 2, y: 8 },
    { kind: 'wall', x: 3, y: 8 },
    { kind: 'wall', x: 4, y: 8 },
    { kind: 'wall', x: 5, y: 8 },
    { kind: 'wall', x: 6, y: 8 },
    { kind: 'wall', x: 7, y: 8 },
    { kind: 'wall', x: 8, y: 8 },
    { kind: 'wall', x: 9, y: 8 },
    { kind: 'wall', x: 10, y: 8 },
    { kind: 'wall', x: 11, y: 8 },
    { kind: 'wall', x: 12, y: 8 },
    { kind: 'rock', x: 7, y: 5 },
    { kind: 'rock', x: 7, y: 6 },
    { kind: 'rock', x: 7, y: 7 },
  ],
};

const lvl1: LevelData = {
  name: 'Level 1',
  dims: [16, 12],
  text: [
    { x: 4, y: 2, word: 'baba' },
    { x: 5, y: 2, word: 'is' },
    { x: 6, y: 2, word: 'you' },
    { x: 3, y: 5, word: 'wall' },
    { x: 3, y: 6, word: 'is' },
    { x: 3, y: 7, word: 'stop' },
    { x: 12, y: 2, word: 'flag' },
    { x: 12, y: 3, word: 'is' },
    { x: 12, y: 4, word: 'win' },
    { x: 14, y: 4, word: 'push' },
  ],
  objects: [
    { kind: 'baba', x: 6, y: 7 },
    { kind: 'flag', x: 12, y: 7 },
    { kind: 'wall', x: 10, y: 0 },
    { kind: 'wall', x: 10, y: 1 },
    { kind: 'wall', x: 10, y: 2 },
    { kind: 'wall', x: 10, y: 3 },
    { kind: 'wall', x: 10, y: 4 },
    { kind: 'wall', x: 10, y: 5 },
    { kind: 'wall', x: 10, y: 6 },
    { kind: 'wall', x: 10, y: 7 },
    { kind: 'wall', x: 10, y: 8 },
    { kind: 'wall', x: 10, y: 9 },
    { kind: 'wall', x: 10, y: 10 },
    { kind: 'wall', x: 10, y: 11 },
  ],
};

const levels = [
  lvl0,
  lvl1,
];

export class Game {
  private cnv: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private currentLevelIndex = 0;
  private currentLevel: Level | null = null;
  private width: number;
  private height: number;
  private zoomedIn = false;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    const cnv = document.createElement('canvas');
    cnv.tabIndex = 100;

    const dpr = window.devicePixelRatio;
    cnv.style.width = width * Tile.SIZE + 'px';
    cnv.style.height = height * Tile.SIZE + 'px';
    cnv.width = Math.floor(width * Tile.SIZE * dpr);
    cnv.height = Math.floor(height * Tile.SIZE * dpr);

    const ctx = cnv.getContext('2d');

    if (ctx === null) {
      throw new Error(`Could not create a canvas`);
    }

    this.cnv = cnv;
    this.ctx = ctx;
    this.ctx.scale(dpr, dpr);

    this.initListeners();
    this.setLevel(levels[0]);
  }

  private setLevel(lvl: LevelData): void {
    const level = Level.from(lvl);
    this.currentLevel = level;

    level.onWin(() => {
      const nextLevelIndex = (this.currentLevelIndex + 1) % levels.length;
      this.setLevel(levels[nextLevelIndex]);
      this.currentLevelIndex = nextLevelIndex;
    });
  }

  public initListeners(): void {
    this.cnv.addEventListener('keydown', event => {
      event.preventDefault();
      switch (event.code) {
        case 'KeyA':
        case 'ArrowLeft':
          this.currentLevel?.broadcast({ type: 'controls', deltaX: -1, deltaY: 0 });
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.currentLevel?.broadcast({ type: 'controls', deltaX: 1, deltaY: 0 });

          break;
        case 'KeyW':
        case 'ArrowUp':
          this.currentLevel?.broadcast({ type: 'controls', deltaX: 0, deltaY: -1 });
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.currentLevel?.broadcast({ type: 'controls', deltaX: 0, deltaY: 1 });
          break;
      }
    });
  }

  private render() {
    this.ctx.fillStyle = '#212529';
    this.ctx.fillRect(0, 0, this.width * Tile.SIZE, this.height * Tile.SIZE);
    this.ctx.fill();

    if (this.currentLevel) {
      const [lvlX, lvlY] = this.currentLevel.dimensions;
      const zoom = this.zoomedIn ? Math.min(this.width / lvlX, this.height / lvlY) : 1;
      const offsetX = (this.width - lvlX * zoom) * Tile.SIZE / 2;
      const offsetY = (this.height - lvlY * zoom) * Tile.SIZE / 2;

      this.ctx.drawImage(
        this.currentLevel.canvas,
        offsetX,
        offsetY,
        lvlX * Tile.SIZE * zoom,
        lvlY * Tile.SIZE * zoom
      );
    }
  }

  private update() {
    this.render();
    this.currentLevel?.update();
  }

  public start(): void {
    const callback = () => {
      this.update();
      requestAnimationFrame(callback);
    };

    requestAnimationFrame(callback);
  };

  public get canvas(): HTMLCanvasElement {
    return this.cnv;
  }
}