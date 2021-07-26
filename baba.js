(() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));

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
  var zIndex = (kind) => {
    return tileProps[kind].zIndex;
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

  // src/Utils.ts
  var swapRemove = (values, index) => {
    [values[index], values[values.length - 1]] = [values[values.length - 1], values[index]];
    values.pop();
  };
  var findSortedIndex = (value, values, lss) => {
    let low = 0, high = values.length;
    while (low < high) {
      const mid = Math.floor((low + high) / 2);
      if (lss(values[mid], value)) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }
    return low;
  };
  var insertSorted = (value, values, lss) => {
    const index = findSortedIndex(value, values, lss);
    values.splice(index, 0, value);
  };

  // src/TileMap.ts
  var TileMap = class {
    constructor(width, height) {
      this.history = [];
      this.recordHistory = false;
      this.dims = [width, height];
      this.tiles = [];
      this.linear = [];
      this.positions = new Map();
      this.clear();
    }
    at(x, y) {
      var _a;
      if (!this.isValidPosition(x, y)) {
        return [];
      }
      return (_a = this.tiles[x][y]) != null ? _a : [];
    }
    startRecordingHistory() {
      this.recordHistory = true;
    }
    add(x, y, tile, addToLinear = true, addToHistory = true) {
      var _a;
      if (addToHistory && this.recordHistory) {
        this.history.push({ type: "add", tile, addToLinear });
      }
      (_a = this.at(x, y)) == null ? void 0 : _a.push(tile);
      if (addToLinear) {
        insertSorted(tile, this.linear, (a, b) => zIndex(a.kind) < zIndex(b.kind));
      }
      this.positions.set(tile, { x, y });
    }
    position(tile) {
      const pos = this.positions.get(tile);
      if (pos === void 0) {
        throw new Error("Could not get position of provided tile");
      }
      return pos;
    }
    remove(tile, removeFromLinear = true, addToHistory = true) {
      const pos = this.position(tile);
      if (pos) {
        if (addToHistory && this.recordHistory) {
          this.history.push({ type: "remove", tile, removeFromLinear });
        }
        const tiles = this.at(pos.x, pos.y);
        const idx = tiles == null ? void 0 : tiles.findIndex((t) => t === tile);
        if (idx !== void 0 && idx >= 0) {
          swapRemove(tiles, idx);
        }
        if (removeFromLinear) {
          const idx2 = this.linear.findIndex((t) => t === tile);
          if (idx2 >= 0) {
            this.linear.splice(idx2, 1);
          }
          this.positions.delete(tile);
        }
      }
    }
    isValidPosition(x, y) {
      return x >= 0 && x < this.dims[0] && y >= 0 && y < this.dims[1];
    }
    move(tile, deltaX, deltaY, addToHistory = true) {
      var _a;
      const pos = this.positions.get(tile);
      if (pos && this.isValidPosition(pos.x + deltaX, pos.y + deltaY)) {
        if (addToHistory && this.recordHistory) {
          this.history.push({ type: "move", tile, deltaX, deltaY });
        }
        this.remove(tile, false, false);
        pos.x += deltaX;
        pos.y += deltaY;
        (_a = this.at(pos.x, pos.y)) == null ? void 0 : _a.push(tile);
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
    }
    undo() {
      const action = this.history.pop();
      if (action) {
        switch (action.type) {
          case "add":
            this.remove(action.tile, action.addToLinear, false);
            break;
          case "remove":
            this.add(action.tile.x, action.tile.y, action.tile, action.removeFromLinear, false);
            break;
          case "move":
            this.move(action.tile, -action.deltaX, -action.deltaY, false);
        }
      }
    }
    clear() {
      this.positions.clear();
      this.linear = [];
      this.tiles = [];
      this.history = [];
      this.recordHistory = false;
      for (let i = 0; i < this.dims[0]; i++) {
        this.tiles.push([]);
        for (let j = 0; j < this.dims[1]; j++) {
          this.tiles[i].push([]);
        }
      }
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
    static from(level) {
      const lvl = new _Level(level.dims[0], level.dims[1]);
      lvl.reset(level);
      return lvl;
    }
    reset({ text, objects }) {
      this.map.clear();
      this.text = [];
      const dispatch = this.reactTo.bind(this);
      this.won = false;
      for (const { x, y, word } of text) {
        const txt = new Text(word, this.map, dispatch);
        this.text.push(txt);
        this.add(x, y, txt);
      }
      for (const { x, y, kind } of objects) {
        this.add(x, y, new Tile(kind, this.map, dispatch));
      }
      this.map.startRecordingHistory();
      this.reactTo({ type: "update_rules" });
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
    add(x, y, tile) {
      this.needsUpdate = true;
      this.map.add(x, y, tile);
    }
    render() {
      this.ctx.fillStyle = "black";
      this.ctx.fillRect(0, 0, this.dims[0] * Tile.SIZE, this.dims[1] * Tile.SIZE);
      for (const tile of this.map) {
        tile.render(this.ctx);
      }
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
    needsRerender() {
      return this.needsUpdate;
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
    undo() {
      this.tileMap.undo();
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

  // src/UI/Component.ts
  var _Component = class {
    constructor(props) {
      this.width = 0;
      this.height = 0;
      this.debugColor = "red";
      this.debugLineWidth = 2;
      this.lastX = 0;
      this.lastY = 0;
      this.state = "none";
      this.needsUpdate = true;
      this.props = props;
    }
    render(x, y, ctx) {
      this.lastX = x;
      this.lastY = y;
      if (_Component.DEBUG) {
        this.debug(x, y, ctx);
      }
      this.needsUpdate = false;
    }
    debug(x, y, ctx) {
      ctx.strokeStyle = this.debugColor;
      ctx.lineWidth = this.debugLineWidth;
      ctx.strokeRect(x, y, this.width, this.height);
    }
    setState(state) {
      if (this.state !== state) {
        this.onStateChange(state, this.state);
        this.state = state;
        this.needsUpdate = true;
      }
    }
    addChild(child) {
      var _a;
      (_a = this.props.children) == null ? void 0 : _a.push(child);
    }
    onStateChange(newState, oldState) {
    }
    onMouseEvent(x, y, newState, defaultState, handler) {
      if (x >= this.lastX && x <= this.lastX + this.width && (y >= this.lastY && y <= this.lastY + this.height)) {
        this.setState(newState);
        if (this.props.children) {
          this.props.children.forEach((child) => child[handler](x, y));
        }
      } else {
        this.setState(defaultState);
      }
    }
    onMouseMove(x, y) {
      this.onMouseEvent(x, y, "hover", "none", "onMouseMove");
    }
    onMouseDown(x, y) {
      this.onMouseEvent(x, y, "mouseDown", this.state, "onMouseDown");
    }
    onMouseUp(x, y) {
      this.onMouseEvent(x, y, "hover", this.state, "onMouseUp");
    }
    needsRerender() {
      var _a, _b;
      return this.needsUpdate || ((_b = (_a = this.props.children) == null ? void 0 : _a.some((c) => c.needsRerender())) != null ? _b : false);
    }
  };
  var Component = _Component;
  Component.DEBUG = false;

  // src/UI/Button.ts
  var Button = class extends Component {
    constructor({
      text,
      width,
      height,
      textColor = "white",
      backgroundColor = "#7b2cbf",
      font = "20px Arial",
      borderColor = "white",
      borderWidth = 0,
      onClick
    }) {
      super({ text, width, height, textColor, backgroundColor, font, borderColor, borderWidth, onClick });
      this.width = width;
      this.height = height;
      this.debugColor = "blue";
      this.onHoverProps = __spreadProps(__spreadValues({}, this.props), {
        borderWidth: 2,
        borderColor
      });
    }
    onStateChange(newState) {
      if (newState === "mouseDown") {
        this.props.onClick();
      }
    }
    render(x, y, ctx) {
      const {
        text,
        width,
        height,
        textColor,
        backgroundColor,
        font,
        borderColor,
        borderWidth
      } = this.state === "hover" ? this.onHoverProps : this.props;
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(x, y, width, height);
      ctx.font = font;
      ctx.fillStyle = textColor;
      const metrics = ctx.measureText(text);
      const textWidth = metrics.width;
      const textHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
      ctx.fillText(text, x + (width - textWidth) / 2, y + (height + textHeight) / 2, width);
      if (borderWidth > 0) {
        ctx.lineWidth = borderWidth;
        ctx.strokeStyle = borderColor;
        ctx.strokeRect(x, y, width, height);
      }
      super.render(x, y, ctx);
    }
  };

  // src/UI/Stack.ts
  var Stack = class extends Component {
    constructor({
      direction = "vertical",
      children = [],
      spacing = 0,
      alignment = "top",
      justify = "start",
      width = "auto",
      height = 0
    }) {
      super({ direction, children, spacing, alignment, justify, width, height });
      this.maxItemHeight = 0;
      this.maxItemWidth = 0;
      this.maxContentWidth = 0;
      this.maxContentHeight = 0;
      this.maxItemHeight = children.reduce((max, child) => Math.max(max, child.height), 0);
      this.maxItemWidth = children.reduce((max, child) => Math.max(max, child.width), 0);
      if (width !== "auto") {
        this.width = width;
      }
      if (height !== "auto") {
        this.height = height;
      }
      this.updateMaxContentSize();
    }
    alignmentOffset(width, height) {
      const isVertical = this.props.direction === "vertical";
      switch (this.props.alignment) {
        case "top":
          return [0, 0];
        case "bottom":
          return [isVertical ? this.maxItemWidth - width : 0, isVertical ? this.maxItemHeight - height : 0];
        case "center": {
          return [isVertical ? (this.maxItemWidth - width) / 2 : 0, isVertical ? 0 : (this.maxItemHeight - height) / 2];
        }
      }
    }
    justifyOffset() {
      const isVertical = this.props.direction === "vertical";
      switch (this.props.justify) {
        case "start":
          return [0, 0];
        case "end":
          return [0, 0];
        case "center":
          return [isVertical ? 0 : (this.width - this.maxContentWidth) / 2, isVertical ? (this.height - this.maxContentHeight) / 2 : 0];
        case "auto":
          return [(this.width - this.maxContentWidth) / 2, (this.height - this.maxContentHeight) / 2];
      }
    }
    *positions() {
      const { children = [], spacing } = this.props;
      const [xJustifyOffset, yJustifyOffset] = this.justifyOffset();
      let xPos = spacing;
      let yPos = spacing;
      let wrapCount = 0;
      for (const child of children) {
        if (this.props.direction === "horizontal" && xPos + child.width + spacing > this.width) {
          xPos = spacing;
          yPos += this.maxItemHeight + spacing;
          wrapCount++;
        } else if (yPos + child.height + spacing > this.height) {
          xPos += this.maxItemWidth + spacing;
          yPos = spacing;
          wrapCount++;
        }
        const [xOffset, yOffset] = this.alignmentOffset(child.width, child.height);
        yield [xPos + xOffset + xJustifyOffset, yPos + yOffset + yJustifyOffset, child, wrapCount];
        if (this.props.direction === "horizontal") {
          xPos += child.width + spacing;
        } else {
          yPos += child.height + spacing;
        }
      }
    }
    updateMaxContentSize() {
      const { spacing } = this.props;
      let maxWidth = 0;
      let maxHeight = 0;
      let lastWrapCount = 0;
      let contentStartX = -1;
      let contentEndX = 0;
      let contentStartY = -1;
      let contentEndY = 0;
      for (const [x, y, child, wrapCount] of this.positions()) {
        if (contentStartX < 0) {
          contentStartX = x;
          contentStartY = y;
          lastWrapCount = wrapCount;
        }
        if (wrapCount === lastWrapCount) {
          contentEndX = x + child.width + spacing;
          contentEndY = y + child.height + spacing;
        } else {
          lastWrapCount = wrapCount;
          maxWidth = Math.max(maxWidth, contentEndX - contentStartX);
          maxHeight = Math.max(maxHeight, contentEndY - contentStartY);
          contentStartX = x;
          contentStartY = y;
          contentEndX = x + child.width + spacing;
          contentEndY = y + child.height + spacing;
        }
      }
      this.maxContentWidth = Math.max(maxWidth, contentEndX - contentStartX);
      this.maxContentHeight = Math.max(maxHeight, contentEndY - contentStartY);
      if (this.props.width === "auto") {
        this.width = this.maxContentWidth;
      }
      if (this.props.height === "auto") {
        this.height = this.maxContentHeight;
      }
    }
    render(x, y, ctx) {
      for (const [childX, childY, child] of this.positions()) {
        child.render(x + childX, y + childY, ctx);
      }
      super.render(x, y, ctx);
    }
    addChild(child) {
      super.addChild(child);
      this.maxItemHeight = Math.max(this.maxItemHeight, child.height);
      this.maxItemWidth = Math.max(this.maxItemHeight, child.width);
      this.updateMaxContentSize();
    }
  };

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
      this.stretch = false;
      this.state = "playing";
      this.needsUpdate = true;
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
      this.ui = this.initUI();
    }
    initUI() {
      return new Stack({
        children: [
          new Button({
            text: "Start over",
            width: 6 * Tile.SIZE,
            height: 1 * Tile.SIZE,
            onClick: () => {
              var _a;
              (_a = this.currentLevel) == null ? void 0 : _a.reset(levels[this.currentLevelIndex]);
              this.state = "playing";
              this.needsUpdate = true;
            }
          })
        ],
        direction: "vertical",
        spacing: 30,
        alignment: "center",
        justify: "auto",
        width: this.width * Tile.SIZE,
        height: this.height * Tile.SIZE
      });
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
        var _a, _b, _c, _d, _e;
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
          case "Escape":
            this.state = this.state === "paused" ? "playing" : "paused";
            this.needsUpdate = true;
            break;
          case "Backspace":
            this.needsUpdate = true;
            (_e = this.currentLevel) == null ? void 0 : _e.undo();
            break;
        }
      });
      const mousePosition = (event) => {
        const boundingRect = this.cnv.getBoundingClientRect();
        return [event.clientX - boundingRect.left, event.clientY - boundingRect.top];
      };
      this.cnv.addEventListener("mousemove", (event) => {
        if (this.isUIVisible()) {
          const [x, y] = mousePosition(event);
          this.ui.onMouseMove(x, y);
        }
      });
      this.cnv.addEventListener("mousedown", (event) => {
        if (this.isUIVisible()) {
          const [x, y] = mousePosition(event);
          this.ui.onMouseDown(x, y);
        }
      });
      this.cnv.addEventListener("mouseup", (event) => {
        if (this.isUIVisible()) {
          const [x, y] = mousePosition(event);
          this.ui.onMouseUp(x, y);
        }
      });
    }
    isUIVisible() {
      return this.state === "paused";
    }
    render() {
      this.ctx.fillStyle = "#212529";
      this.ctx.fillRect(0, 0, this.width * Tile.SIZE, this.height * Tile.SIZE);
      if (this.currentLevel) {
        const [lvlX, lvlY] = this.currentLevel.dimensions;
        const zoom = this.stretch ? Math.min(this.width / lvlX, this.height / lvlY) : 1;
        const offsetX = (this.width - lvlX * zoom) * Tile.SIZE / 2;
        const offsetY = (this.height - lvlY * zoom) * Tile.SIZE / 2;
        this.currentLevel.render();
        this.ctx.drawImage(this.currentLevel.canvas, offsetX, offsetY, lvlX * Tile.SIZE * zoom, lvlY * Tile.SIZE * zoom);
      }
      if (this.isUIVisible()) {
        this.ui.render(0, 0, this.ctx);
      }
      this.needsUpdate = false;
    }
    update() {
      var _a, _b;
      const needsUpdate = this.needsUpdate || ((_a = this.currentLevel) == null ? void 0 : _a.needsRerender()) || this.isUIVisible() && this.ui.needsRerender();
      if (needsUpdate) {
        (_b = this.currentLevel) == null ? void 0 : _b.update();
        this.render();
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
  };

  // src/Main.ts
  var game = new Game(18, 16);
  window["game"] = game;
  document.body.appendChild(game.canvas);
  game.start();
})();
