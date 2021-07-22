import { isNoun, Property, Rules } from "./Rules";
import { Action, Tile } from "./Tile";

export type Behavior = (action: Action, tile: Tile) => 'break' | void;

const canMove = (tile: Tile, deltaX: number, deltaY: number): boolean => {
  const [x, y] = [tile.x + deltaX, tile.y + deltaY];

  if (!tile.map.isValidPosition(x, y)) return false;
  if (tile.map.has('stop', x, y)) return false;

  for (const square of tile.map.at(x, y)) {
    if ((square.is('push') || square.is('you')) &&
      !canMove(square, deltaX, deltaY)
    ) {
      return false;
    }
  }

  return true;
};

const move = (tile: Tile, deltaX: number, deltaY: number): void => {
  if (canMove(tile, deltaX, deltaY)) {
    const moveAction = { type: 'move', deltaX, deltaY } as const;
    for (const sq of tile.map.at(tile.x + deltaX, tile.y + deltaY)) {
      if (sq !== this) {
        sq.reactTo(moveAction);
      }
    }

    tile.map.move(tile, deltaX, deltaY);
  }
};

const always: Behavior = (action, tile) => {
  if (action.type === 'updated_rules') {
    const newKind = Rules.get(tile.kind).find(isNoun);

    if (newKind !== undefined) {
      tile.setKind(newKind);
    }
  }

  // re-index the rules when text is moved
  if (tile.kind === 'text' && action.type === 'move') {
    tile.dispatch({ type: 'update_rules' });
  }
};

const stop: Behavior = () => 'break';

const you: Behavior = (action, tile) => {
  if (action.type === 'controls') {
    tile.reactTo({ type: 'move', deltaX: action.deltaX, deltaY: action.deltaY });
  }

  if (action.type === 'move') {
    move(tile, action.deltaX, action.deltaY);
  }
};

const win: Behavior = (action, tile) => {
  if (
    action.type === 'updated_rules' && Rules.is(tile.kind, 'you') ||
    tile.overlapping().some(t => t.is('you'))
  ) {
    tile.dispatch({ type: 'win' });
  }
};

const push: Behavior = (action, tile) => {
  if (action.type === 'move') {
    move(tile, action.deltaX, action.deltaY);
  }
};

export const behaviors: { [P in Property | 'always']: Behavior } = {
  always,
  stop,
  you,
  win,
  push,
};
