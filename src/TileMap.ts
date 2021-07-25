import { Rules, Word } from "./Rules";
import { Tile, zIndex } from "./Tile";
import { insertSorted, swapRemove } from "./Utils";

export class TileMap {
  private tiles: Tile[][][];
  private linear: Tile[]; // keep sorted by zIndex
  private positions: Map<Tile, { x: number, y: number }>;
  private dims: [number, number];

  constructor(width: number, height: number) {
    this.dims = [width, height];
    this.tiles = [];
    this.linear = [];
    this.positions = new Map();

    this.clear();
  }

  public at(x: number, y: number): Tile[] {
    if (!this.isValidPosition(x, y)) {
      return [];
    }

    return this.tiles[x][y] ?? [];
  }

  public add(x: number, y: number, tile: Tile, addToLinear = true): void {
    this.at(x, y)?.push(tile);

    if (addToLinear) {
      insertSorted(tile, this.linear, (a, b) => zIndex(a.kind) < zIndex(b.kind));
    }

    this.positions.set(tile, { x, y });
  }

  public position(tile: Tile): { x: number, y: number } {
    const pos = this.positions.get(tile);
    if (pos === undefined) {
      throw new Error('Could not get position of provided tile');
    }

    return pos;
  }

  public remove(tile: Tile, removeFromLinear = true): void {
    const pos = this.position(tile);
    if (pos) {
      const tiles = this.at(pos.x, pos.y);
      const idx = tiles?.findIndex(t => t === tile);

      if (idx !== undefined && idx >= 0) {
        swapRemove(tiles, idx);
      }

      if (removeFromLinear) {
        const idx = this.linear.findIndex(t => t === tile);
        if (idx >= 0) {
          this.linear.splice(idx, 1);
        }

        this.positions.delete(tile);
      }
    }
  }

  public isValidPosition(x: number, y: number): boolean {
    return x >= 0 && x < this.dims[0] && y >= 0 && y < this.dims[1];
  }

  public move(square: Tile, deltaX: number, deltaY: number): void {
    const pos = this.positions.get(square);
    if (pos && this.isValidPosition(pos.x + deltaX, pos.y + deltaY)) {
      this.remove(square, false);

      pos.x += deltaX;
      pos.y += deltaY;

      this.at(pos.x, pos.y)?.push(square);
    }
  }

  public has(rhs: Word, x: number, y: number): boolean {
    return this.at(x, y).some(sq => Rules.is(sq.kind, rhs));
  }

  public *[Symbol.iterator](): IterableIterator<Tile> {
    yield* this.linear;
  }

  public debug(ctx: CanvasRenderingContext2D): void {
    const textColor = (count: number) => {
      if (count === 0) return 'blue';
      if (count === 1) return 'pink';
      if (count === 2) return 'yellow';
      return 'red';
    };

    for (let i = 0; i < this.dims[0]; i++) {
      for (let j = 0; j < this.dims[1]; j++) {
        const count = this.at(i, j).length;
        const color = textColor(count);

        ctx.fillStyle = color;
        ctx.fillText(`${count}`, i * Tile.SIZE + 2, j * Tile.SIZE + 15);
      }
    }
  }

  public clear(): void {
    this.positions.clear();
    this.linear = [];
    this.tiles = [];

    for (let i = 0; i < this.dims[0]; i++) {
      this.tiles.push([]);
      for (let j = 0; j < this.dims[1]; j++) {
        this.tiles[i].push([]);
      }
    }
  }
}