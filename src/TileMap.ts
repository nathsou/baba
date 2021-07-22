import { Rules, Word } from "./Rules";
import { Tile } from "./Tile";

const swapRemove = (values: any[], index: number): void => {
  [values[index], values[values.length - 1]] = [values[values.length - 1], values[index]];
  values.pop();
};

export class TileMap {
  private squares: Tile[][][];
  private linear: Tile[];
  private positions: Map<Tile, { x: number, y: number }>;
  private dims: [number, number];

  constructor(width: number, height: number) {
    this.dims = [width, height];
    this.squares = [];
    this.linear = [];
    this.positions = new Map();

    for (let i = 0; i < width; i++) {
      this.squares.push([]);
      for (let j = 0; j < height; j++) {
        this.squares[i].push([]);
      }
    }
  }

  public at(x: number, y: number): Tile[] {
    if (!this.isValidPosition(x, y)) {
      return [];
    }

    return this.squares[x][y] ?? [];
  }

  public add(x: number, y: number, square: Tile, addToLinear = true): void {
    this.at(x, y)?.push(square);

    if (addToLinear) {
      this.linear.push(square);
    }

    this.positions.set(square, { x, y });
  }

  public position(square: Tile): { x: number, y: number } {
    const pos = this.positions.get(square);
    if (pos === undefined) {
      throw new Error('Could not get position of provided square');
    }

    return pos;
  }

  public remove(square: Tile, removeFromLinear = true): void {
    const pos = this.position(square);
    if (pos) {
      const squares = this.at(pos.x, pos.y);
      const idx = squares?.findIndex(sq => sq === square);

      if (idx !== undefined && idx >= 0) {
        swapRemove(squares, idx);
      }

      if (removeFromLinear) {
        const idx = this.linear.findIndex(sq => sq === square);
        if (idx >= 0) {
          swapRemove(this.linear, idx);
        }

        this.positions.delete(square);
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

    ctx.fill();
  }
}