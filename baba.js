(() => {
  // src/Rules.ts
  var priorities = {
    win: 100,
    stop: 50,
    you: 20,
    push: 10
  };
  var getPriority = (word) => {
    return isProperty(word) ? priorities[word] : 0;
  };
  var wordKinds = {
    flag: "noun",
    baba: "noun",
    wall: "noun",
    water: "noun",
    text: "noun",
    rock: "noun",
    is: "connector",
    you: "property",
    stop: "property",
    push: "property",
    win: "property"
  };
  var isNoun = (word) => {
    return wordKinds[word] === "noun";
  };
  var isProperty = (word) => {
    return wordKinds[word] === "property";
  };
  var _Rules = class {
    constructor() {
      this.rules = new Map();
    }
    static add(lhs, rhs) {
      var _a;
      if (!this.instance.rules.has(lhs)) {
        this.instance.rules.set(lhs, []);
      }
      (_a = this.instance.rules.get(lhs)) == null ? void 0 : _a.push(rhs);
    }
    static get(lhs) {
      var _a;
      return (_a = this.instance.rules.get(lhs)) != null ? _a : [];
    }
    static is(lhs, rhs) {
      var _a, _b;
      return (_b = (_a = this.get(lhs)) == null ? void 0 : _a.some((r) => r === rhs)) != null ? _b : false;
    }
    static clear() {
      _Rules.instance.rules.clear();
    }
    static orderByPriority() {
      for (const [key, value] of _Rules.instance.rules) {
        _Rules.instance.rules.set(key, value.sort((a, b) => getPriority(a) - getPriority(b)));
      }
    }
    static won() {
      return [..._Rules.instance.rules.keys()].some((lhs) => _Rules.is(lhs, "you") && _Rules.is(lhs, "win"));
    }
    static all() {
      return _Rules.instance.rules;
    }
  };
  var Rules = _Rules;
  Rules.instance = new _Rules();

  // src/Behavior.ts
  var canMove = (tile, deltaX, deltaY) => {
    const [x, y] = [tile.x + deltaX, tile.y + deltaY];
    if (!tile.map.isValidPosition(x, y))
      return false;
    if (tile.map.has("stop", x, y))
      return false;
    for (const other of tile.map.at(x, y)) {
      if ((other.is("push") || other.is("you")) && !canMove(other, deltaX, deltaY)) {
        return false;
      }
    }
    return true;
  };
  var tryMoving = (tile, deltaX, deltaY) => {
    if (canMove(tile, deltaX, deltaY)) {
      const moveAction = { type: "move", deltaX, deltaY };
      for (const sq of tile.map.at(tile.x + deltaX, tile.y + deltaY)) {
        if (sq !== tile) {
          sq.reactTo(moveAction);
        }
      }
      tile.map.move(tile, deltaX, deltaY);
    }
  };
  var always = (action, tile) => {
    if (action.type === "updated_rules") {
      const newKind = Rules.get(tile.kind).find(isNoun);
      if (newKind !== void 0) {
        tile.setKind(newKind);
      }
    }
    if (tile.kind === "text" && action.type === "move") {
      tile.dispatch({ type: "update_rules" });
    }
  };
  var stop = () => "break";
  var you = (action, tile) => {
    if (action.type === "controls") {
      tile.reactTo({ type: "move", deltaX: action.deltaX, deltaY: action.deltaY });
    }
    if (action.type === "move") {
      tryMoving(tile, action.deltaX, action.deltaY);
    }
  };
  var win = (action, tile) => {
    if (action.type === "updated_rules" && Rules.is(tile.kind, "you") || tile.overlapping().some((t) => t.is("you"))) {
      tile.dispatch({ type: "win" });
    }
  };
  var push = (action, tile) => {
    if (action.type === "move") {
      tryMoving(tile, action.deltaX, action.deltaY);
    }
  };
  var behaviors = {
    always,
    stop,
    you,
    win,
    push
  };

  // src/Tile.ts
  var tileProps = {
    baba: { color: "#E40066", zIndex: 10 },
    wall: { color: "#FB4D3D", zIndex: 0 },
    water: { color: "#345995", zIndex: 0 },
    flag: { color: "#EAC435", zIndex: 10 },
    text: { color: "#ffffff", zIndex: 10 },
    rock: { color: "blue", zIndex: 10 }
  };
  var _Tile = class {
    constructor(kind, map2, dispatch2) {
      this.noun = "baba";
      this.color = "red";
      this.setKind(kind);
      this.map = map2;
      this.dispatch = dispatch2;
    }
    get position() {
      return this.map.position(this);
    }
    get x() {
      return this.position.x;
    }
    get y() {
      return this.position.y;
    }
    setKind(kind) {
      this.noun = kind;
      this.color = tileProps[kind].color;
    }
    update() {
    }
    render(ctx) {
      const { x, y } = this.position;
      ctx.fillStyle = this.color;
      ctx.fillRect(x * _Tile.SIZE, y * _Tile.SIZE, _Tile.SIZE, _Tile.SIZE);
      ctx.fill();
    }
    reactTo(action) {
      if (behaviors.always(action, this) === "break") {
        return;
      }
      for (const word of Rules.get(this.kind)) {
        if (isProperty(word)) {
          const shouldBreak = behaviors[word](action, this) === "break";
          if (shouldBreak)
            break;
        }
      }
    }
    get kind() {
      return this.noun;
    }
    is(word) {
      return Rules.is(this.kind, word);
    }
    overlapping() {
      return this.map.at(this.x, this.y);
    }
  };
  var Tile = _Tile;
  Tile.SIZE = 48;

  // src/TileMap.ts
  var swapRemove = (values, index) => {
    [values[index], values[values.length - 1]] = [values[values.length - 1], values[index]];
    values.pop();
  };
  var TileMap = class {
    constructor(width, height) {
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
    at(x, y) {
      var _a;
      if (!this.isValidPosition(x, y)) {
        return [];
      }
      return (_a = this.squares[x][y]) != null ? _a : [];
    }
    add(x, y, square, addToLinear = true) {
      var _a;
      (_a = this.at(x, y)) == null ? void 0 : _a.push(square);
      if (addToLinear) {
        this.linear.push(square);
      }
      this.positions.set(square, { x, y });
    }
    position(square) {
      const pos = this.positions.get(square);
      if (pos === void 0) {
        throw new Error("Could not get position of provided square");
      }
      return pos;
    }
    remove(square, removeFromLinear = true) {
      const pos = this.position(square);
      if (pos) {
        const squares = this.at(pos.x, pos.y);
        const idx = squares == null ? void 0 : squares.findIndex((sq) => sq === square);
        if (idx !== void 0 && idx >= 0) {
          swapRemove(squares, idx);
        }
        if (removeFromLinear) {
          const idx2 = this.linear.findIndex((sq) => sq === square);
          if (idx2 >= 0) {
            swapRemove(this.linear, idx2);
          }
          this.positions.delete(square);
        }
      }
    }
    isValidPosition(x, y) {
      return x >= 0 && x < this.dims[0] && y >= 0 && y < this.dims[1];
    }
    move(square, deltaX, deltaY) {
      var _a;
      const pos = this.positions.get(square);
      if (pos && this.isValidPosition(pos.x + deltaX, pos.y + deltaY)) {
        this.remove(square, false);
        pos.x += deltaX;
        pos.y += deltaY;
        (_a = this.at(pos.x, pos.y)) == null ? void 0 : _a.push(square);
      }
    }
    has(rhs, x, y) {
      return this.at(x, y).some((sq) => Rules.is(sq.kind, rhs));
    }
    *[Symbol.iterator]() {
      yield* this.linear;
    }
    debug(ctx) {
      const textColor = (count) => {
        if (count === 0)
          return "blue";
        if (count === 1)
          return "pink";
        if (count === 2)
          return "yellow";
        return "red";
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
  };

  // src/Text.ts
  var textProps = {
    baba: { color: "#b259d9" },
    flag: { color: "yellow" },
    wall: { color: "#525252" },
    is: { color: "white" },
    you: { color: "#fffeab" },
    stop: { color: "#687a5c" },
    push: { color: "#74cfc7" },
    win: { color: "yellow" },
    text: { color: "grey" },
    rock: { color: "white" },
    water: { color: "#345995" }
  };
  var _Text = class extends Tile {
    constructor(text, map2, dispatch2) {
      super("text", map2, dispatch2);
      this.text = text;
      this.textColor = textProps[text].color;
      this.wordKind = wordKinds[text];
    }
    getText() {
      return this.text;
    }
    isNoun() {
      return this.wordKind === "noun";
    }
    isConnector() {
      return this.wordKind === "noun";
    }
    isProperty() {
      return this.wordKind === "property";
    }
    indexRuleFrom(x, y, dir, map2) {
      const deltaX = dir === "left" ? 1 : 0;
      const deltaY = dir === "down" ? 1 : 0;
      const squares = map2.at(x + deltaX, y + deltaY);
      for (const sq of squares) {
        if (sq instanceof _Text && sq.text === "is") {
          const left2 = map2.at(x + 2 * deltaX, y + 2 * deltaY);
          for (const sq2 of left2) {
            if (sq2 instanceof _Text) {
              Rules.add(this.text, sq2.text);
            }
          }
        }
      }
    }
    indexRules(map2) {
      const pos = map2.position(this);
      if (pos) {
        this.indexRuleFrom(pos.x, pos.y, "left", map2);
        this.indexRuleFrom(pos.x, pos.y, "down", map2);
      }
    }
    render(ctx) {
      super.render(ctx);
      const { x, y } = this.position;
      const upper = this.text.toUpperCase();
      ctx.fillStyle = "black";
      ctx.font = `${_Text.FONT_SIZE}px Arial`;
      const { width: textWidth } = ctx.measureText(upper);
      ctx.fillText(upper, x * Tile.SIZE + (Tile.SIZE - textWidth) / 2, y * Tile.SIZE + (Tile.SIZE + _Text.FONT_SIZE) / 2, Tile.SIZE);
      ctx.fill();
    }
  };
  var Text = _Text;
  Text.FONT_SIZE = 16;

  // src/Level.ts
  var _Level = class {
    constructor(dimX, dimY) {
      this.needsUpdate = true;
      this.needsRulesUpdate = true;
      this.text = [];
      this.won = false;
      this.cnv = document.createElement("canvas");
      this.cnv.tabIndex = 100;
      this.cnv.width = dimX * Tile.SIZE;
      this.cnv.height = dimY * Tile.SIZE;
      this.map = new TileMap(dimX, dimY);
      const ctx = this.cnv.getContext("2d");
      if (ctx === null) {
        throw new Error(`Could not create a canvas`);
      }
      this.ctx = ctx;
      this.initListeners();
    }
    reactTo(action) {
      switch (action.type) {
        case "win":
          this.won = true;
          break;
        case "update_rules":
          this.needsRulesUpdate = true;
          break;
      }
    }
    initListeners() {
      this.cnv.addEventListener("keydown", (event) => {
        event.preventDefault();
        switch (event.code) {
          case "KeyA":
          case "ArrowLeft":
            this.broadcast({ type: "controls", deltaX: -1, deltaY: 0 });
            break;
          case "KeyD":
          case "ArrowRight":
            this.broadcast({ type: "controls", deltaX: 1, deltaY: 0 });
            break;
          case "KeyW":
          case "ArrowUp":
            this.broadcast({ type: "controls", deltaX: 0, deltaY: -1 });
            break;
          case "KeyS":
          case "ArrowDown":
            this.broadcast({ type: "controls", deltaX: 0, deltaY: 1 });
            break;
        }
      });
    }
    broadcast(action) {
      this.needsUpdate = true;
      for (const square of this.map) {
        square.reactTo(action);
      }
    }
    add(x, y, square) {
      this.needsUpdate = true;
      this.map.add(x, y, square);
      if (square instanceof Text) {
        this.text.push(square);
      }
    }
    render() {
      this.ctx.fillStyle = "black";
      this.ctx.fillRect(0, 0, this.cnv.width, this.cnv.height);
      this.ctx.fill();
      const tiles2 = [...this.map].sort((a, b) => tileProps[a.kind].zIndex - tileProps[b.kind].zIndex);
      tiles2.forEach((tile) => tile.render(this.ctx));
      if (_Level.DEBUG) {
        this.map.debug(this.ctx);
      }
    }
    updateRules() {
      Rules.clear();
      Rules.add("text", "push");
      for (const text of this.text) {
        text.indexRules(this.map);
      }
      Rules.orderByPriority();
      this.broadcast({ type: "updated_rules" });
      this.needsRulesUpdate = false;
    }
    update() {
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
    start() {
      const callback = () => {
        this.update();
        requestAnimationFrame(callback);
      };
      requestAnimationFrame(callback);
    }
    get canvas() {
      return this.cnv;
    }
    get tileMap() {
      return this.map;
    }
  };
  var Level = _Level;
  Level.DEBUG = false;

  // src/game.ts
  var level = new Level(16, 12);
  var tiles = [
    ["text", "baba", 4, 2],
    ["text", "is", 5, 2],
    ["text", "you", 6, 2],
    ["text", "wall", 3, 5],
    ["text", "is", 3, 6],
    ["text", "stop", 3, 7],
    ["text", "flag", 12, 2],
    ["text", "is", 12, 3],
    ["text", "win", 12, 4],
    ["text", "push", 14, 4],
    ["square", "baba", 6, 7],
    ["square", "flag", 12, 7],
    ["square", "wall", 10, 0],
    ["square", "wall", 10, 1],
    ["square", "wall", 10, 2],
    ["square", "wall", 10, 3],
    ["square", "wall", 10, 4],
    ["square", "wall", 10, 5],
    ["square", "wall", 10, 6],
    ["square", "wall", 10, 7],
    ["square", "wall", 10, 8],
    ["square", "wall", 10, 9],
    ["square", "wall", 10, 10],
    ["square", "wall", 10, 11]
  ];
  var dispatch = level.reactTo.bind(level);
  var map = level.tileMap;
  for (const [sq, kind, x, y] of tiles) {
    level.add(x, y, sq === "square" ? new Tile(kind, map, dispatch) : new Text(kind, map, dispatch));
  }
  var game = {
    level
  };

  // src/Main.ts
  var { level: level2 } = game;
  window["level"] = level2;
  document.body.appendChild(level2.canvas);
  level2.reactTo({ type: "update_rules" });
  level2.start();
})();
