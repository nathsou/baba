import { Level } from "./Level";
import { Noun, Word } from "./Rules";
import { Text } from "./Text";
import { Tile } from "./Tile";

const level = new Level(16, 12);

const tiles: Array<['square' | 'text', Word, number, number]> = [
  ['text', 'baba', 4, 2],
  ['text', 'is', 5, 2],
  ['text', 'you', 6, 2],
  ['text', 'wall', 3, 5],
  ['text', 'is', 3, 6],
  ['text', 'stop', 3, 7],
  ['text', 'flag', 12, 2],
  ['text', 'is', 12, 3],
  ['text', 'win', 12, 4],
  ['square', 'baba', 6, 7],
  ['square', 'flag', 12, 7],
  ['square', 'wall', 10, 0],
  ['square', 'wall', 10, 1],
  ['square', 'wall', 10, 2],
  ['square', 'wall', 10, 3],
  ['square', 'wall', 10, 4],
  ['square', 'wall', 10, 5],
  ['square', 'wall', 10, 6],
  ['square', 'wall', 10, 7],
  ['square', 'wall', 10, 8],
  ['square', 'wall', 10, 9],
  ['square', 'wall', 10, 10],
  ['square', 'wall', 10, 11],
];

const dispatch = level.reactTo.bind(level);
const map = level.tileMap;
for (const [sq, kind, x, y] of tiles) {
  level.add(x, y, sq === 'square' ? new Tile(kind as Noun, map, dispatch) : new Text(kind, map, dispatch));
}

export const game = {
  level: level
};