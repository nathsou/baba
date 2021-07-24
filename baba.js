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
    wall: { color: "#272640", zIndex: 0 },
    water: { color: "#345995", zIndex: 0 },
    flag: { color: "#EAC435", zIndex: 10 },
    text: { color: "#faf3dd", zIndex: 10 },
    rock: { color: "#994636", zIndex: 10 }
  };
  var _Tile = class {
    constructor(kind, map, dispatch) {
      this.noun = "baba";
      this.color = tileProps[this.noun].color;
      this.setKind(kind);
      this.map = map;
      this.dispatch = dispatch;
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
    constructor(text, map, dispatch) {
      super("text", map, dispatch);
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
    indexRuleFrom(x, y, dir, map) {
      const deltaX = dir === "left" ? 1 : 0;
      const deltaY = dir === "down" ? 1 : 0;
      const squares = map.at(x + deltaX, y + deltaY);
      for (const sq of squares) {
        if (sq instanceof _Text && sq.text === "is") {
          const left2 = map.at(x + 2 * deltaX, y + 2 * deltaY);
          for (const sq2 of left2) {
            if (sq2 instanceof _Text) {
              Rules.add(this.text, sq2.text);
            }
          }
        }
      }
    }
    indexRules(map) {
      const pos = map.position(this);
      if (pos) {
        this.indexRuleFrom(pos.x, pos.y, "left", map);
        this.indexRuleFrom(pos.x, pos.y, "down", map);
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
      this.onWinHandlers = [];
      this.dims = [dimX, dimY];
      const cnv = document.createElement("canvas");
      cnv.tabIndex = 100;
      const dpr = window.devicePixelRatio;
      cnv.style.width = dimX * Tile.SIZE + "px";
      cnv.style.height = dimY * Tile.SIZE + "px";
      cnv.width = Math.floor(dimX * Tile.SIZE * dpr);
      cnv.height = Math.floor(dimY * Tile.SIZE * dpr);
      this.cnv = cnv;
      const ctx = this.cnv.getContext("2d");
      if (ctx === null) {
        throw new Error(`Could not create a canvas`);
      }
      this.ctx = ctx;
      this.ctx.scale(dpr, dpr);
      this.map = new TileMap(dimX, dimY);
    }
    static from({ dims, text, objects }) {
      const lvl = new _Level(dims[0], dims[1]);
      const dispatch = lvl.reactTo.bind(lvl);
      for (const { x, y, word } of text) {
        lvl.add(x, y, new Text(word, lvl.map, dispatch));
      }
      for (const { x, y, kind } of objects) {
        lvl.add(x, y, new Tile(kind, lvl.map, dispatch));
      }
      lvl.reactTo({ type: "update_rules" });
      return lvl;
    }
    reactTo(action) {
      switch (action.type) {
        case "win":
          this.won = true;
          this.needsRulesUpdate = true;
          break;
        case "update_rules":
          this.needsRulesUpdate = true;
          break;
      }
    }
    broadcast(action) {
      this.needsUpdate = true;
      for (const tile of this.map) {
        tile.reactTo(action);
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
      this.ctx.fillRect(0, 0, this.dims[0] * Tile.SIZE, this.dims[1] * Tile.SIZE);
      this.ctx.fill();
      const tiles = [...this.map].sort((a, b) => tileProps[a.kind].zIndex - tileProps[b.kind].zIndex);
      tiles.forEach((tile) => tile.render(this.ctx));
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
    notifyWinListeners() {
      if (this.won) {
        this.onWinHandlers.forEach((listener) => {
          listener();
        });
      }
    }
    onWin(handler) {
      this.onWinHandlers.push(handler);
    }
    get canvas() {
      return this.cnv;
    }
    get dimensions() {
      return this.dims;
    }
    get tileMap() {
      return this.map;
    }
  };
  var Level = _Level;
  Level.DEBUG = false;

  // src/Game.ts
  var lvl0 = {
    name: "Level 0",
    dims: [15, 13],
    text: [
      { x: 2, y: 2, word: "baba" },
      { x: 3, y: 2, word: "is" },
      { x: 4, y: 2, word: "you" },
      { x: 10, y: 2, word: "flag" },
      { x: 11, y: 2, word: "is" },
      { x: 12, y: 2, word: "win" },
      { x: 2, y: 10, word: "wall" },
      { x: 3, y: 10, word: "is" },
      { x: 4, y: 10, word: "stop" },
      { x: 10, y: 10, word: "rock" },
      { x: 11, y: 10, word: "is" },
      { x: 12, y: 10, word: "push" }
    ],
    objects: [
      { kind: "baba", x: 3, y: 6 },
      { kind: "flag", x: 12, y: 6 },
      { kind: "wall", x: 2, y: 4 },
      { kind: "wall", x: 3, y: 4 },
      { kind: "wall", x: 4, y: 4 },
      { kind: "wall", x: 5, y: 4 },
      { kind: "wall", x: 6, y: 4 },
      { kind: "wall", x: 7, y: 4 },
      { kind: "wall", x: 8, y: 4 },
      { kind: "wall", x: 9, y: 4 },
      { kind: "wall", x: 10, y: 4 },
      { kind: "wall", x: 11, y: 4 },
      { kind: "wall", x: 12, y: 4 },
      { kind: "wall", x: 2, y: 8 },
      { kind: "wall", x: 3, y: 8 },
      { kind: "wall", x: 4, y: 8 },
      { kind: "wall", x: 5, y: 8 },
      { kind: "wall", x: 6, y: 8 },
      { kind: "wall", x: 7, y: 8 },
      { kind: "wall", x: 8, y: 8 },
      { kind: "wall", x: 9, y: 8 },
      { kind: "wall", x: 10, y: 8 },
      { kind: "wall", x: 11, y: 8 },
      { kind: "wall", x: 12, y: 8 },
      { kind: "rock", x: 7, y: 5 },
      { kind: "rock", x: 7, y: 6 },
      { kind: "rock", x: 7, y: 7 }
    ]
  };
  var lvl1 = {
    name: "Level 1",
    dims: [16, 12],
    text: [
      { x: 4, y: 2, word: "baba" },
      { x: 5, y: 2, word: "is" },
      { x: 6, y: 2, word: "you" },
      { x: 3, y: 5, word: "wall" },
      { x: 3, y: 6, word: "is" },
      { x: 3, y: 7, word: "stop" },
      { x: 12, y: 2, word: "flag" },
      { x: 12, y: 3, word: "is" },
      { x: 12, y: 4, word: "win" },
      { x: 14, y: 4, word: "push" }
    ],
    objects: [
      { kind: "baba", x: 6, y: 7 },
      { kind: "flag", x: 12, y: 7 },
      { kind: "wall", x: 10, y: 0 },
      { kind: "wall", x: 10, y: 1 },
      { kind: "wall", x: 10, y: 2 },
      { kind: "wall", x: 10, y: 3 },
      { kind: "wall", x: 10, y: 4 },
      { kind: "wall", x: 10, y: 5 },
      { kind: "wall", x: 10, y: 6 },
      { kind: "wall", x: 10, y: 7 },
      { kind: "wall", x: 10, y: 8 },
      { kind: "wall", x: 10, y: 9 },
      { kind: "wall", x: 10, y: 10 },
      { kind: "wall", x: 10, y: 11 }
    ]
  };
  var levels = [
    lvl0,
    lvl1
  ];
  var Game = class {
    constructor(width, height) {
      this.currentLevelIndex = 0;
      this.currentLevel = null;
      this.zoomedIn = false;
      this.width = width;
      this.height = height;
      const cnv = document.createElement("canvas");
      cnv.tabIndex = 100;
      const dpr = window.devicePixelRatio;
      cnv.style.width = width * Tile.SIZE + "px";
      cnv.style.height = height * Tile.SIZE + "px";
      cnv.width = Math.floor(width * Tile.SIZE * dpr);
      cnv.height = Math.floor(height * Tile.SIZE * dpr);
      const ctx = cnv.getContext("2d");
      if (ctx === null) {
        throw new Error(`Could not create a canvas`);
      }
      this.cnv = cnv;
      this.ctx = ctx;
      this.ctx.scale(dpr, dpr);
      this.initListeners();
      this.setLevel(levels[0]);
    }
    setLevel(lvl) {
      const level = Level.from(lvl);
      this.currentLevel = level;
      level.onWin(() => {
        const nextLevelIndex = (this.currentLevelIndex + 1) % levels.length;
        this.setLevel(levels[nextLevelIndex]);
        this.currentLevelIndex = nextLevelIndex;
      });
    }
    initListeners() {
      this.cnv.addEventListener("keydown", (event) => {
        var _a, _b, _c, _d;
        event.preventDefault();
        switch (event.code) {
          case "KeyA":
          case "ArrowLeft":
            (_a = this.currentLevel) == null ? void 0 : _a.broadcast({ type: "controls", deltaX: -1, deltaY: 0 });
            break;
          case "KeyD":
          case "ArrowRight":
            (_b = this.currentLevel) == null ? void 0 : _b.broadcast({ type: "controls", deltaX: 1, deltaY: 0 });
            break;
          case "KeyW":
          case "ArrowUp":
            (_c = this.currentLevel) == null ? void 0 : _c.broadcast({ type: "controls", deltaX: 0, deltaY: -1 });
            break;
          case "KeyS":
          case "ArrowDown":
            (_d = this.currentLevel) == null ? void 0 : _d.broadcast({ type: "controls", deltaX: 0, deltaY: 1 });
            break;
        }
      });
    }
    render() {
      this.ctx.fillStyle = "#212529";
      this.ctx.fillRect(0, 0, this.width * Tile.SIZE, this.height * Tile.SIZE);
      this.ctx.fill();
      if (this.currentLevel) {
        const [lvlX, lvlY] = this.currentLevel.dimensions;
        const zoom = this.zoomedIn ? Math.min(this.width / lvlX, this.height / lvlY) : 1;
        const offsetX = (this.width - lvlX * zoom) * Tile.SIZE / 2;
        const offsetY = (this.height - lvlY * zoom) * Tile.SIZE / 2;
        this.ctx.drawImage(this.currentLevel.canvas, offsetX, offsetY, lvlX * Tile.SIZE * zoom, lvlY * Tile.SIZE * zoom);
      }
    }
    update() {
      var _a;
      this.render();
      (_a = this.currentLevel) == null ? void 0 : _a.update();
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
  };

  // src/Main.ts
  var game = new Game(18, 16);
  window["game"] = game;
  document.body.appendChild(game.canvas);
  game.start();
})();
