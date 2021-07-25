import { Component, ComponentState, PropsWithChildren } from "./Component";

type StackProps = {
  direction?: 'horizontal' | 'vertical',
  spacing?: number,
  alignment?: 'top' | 'bottom' | 'center',
  justify?: 'start' | 'center' | 'end' | 'auto',
  width?: number | 'auto',
  height?: number | 'auto',
};

export class Stack extends Component<Required<StackProps>> {
  private maxItemHeight: number = 0;
  private maxItemWidth: number = 0;
  private maxContentWidth: number = 0;
  private maxContentHeight: number = 0;

  constructor({
    direction = 'vertical', children = [], spacing = 0, alignment = 'top',
    justify = 'start', width = 'auto', height = 0
  }: PropsWithChildren<StackProps>) {
    super({ direction, children, spacing, alignment, justify, width, height });
    this.maxItemHeight = children.reduce((max, child) => Math.max(max, child.height), 0);
    this.maxItemWidth = children.reduce((max, child) => Math.max(max, child.width), 0);

    if (width !== 'auto') {
      this.width = width;
    }

    if (height !== 'auto') {
      this.height = height;
    }

    this.updateMaxContentWidth();
  }

  private alignmentOffset(width: number, height: number): [number, number] {
    const isVertical = this.props.direction === 'vertical';

    switch (this.props.alignment) {
      case 'top':
        return [0, 0];
      case 'bottom':
        return [isVertical ? this.maxItemWidth - width : 0, isVertical ? this.maxItemHeight - height : 0];
      case 'center': {
        return [isVertical ? (this.maxItemWidth - width) / 2 : 0, isVertical ? 0 : (this.maxItemHeight - height) / 2];
      }
    }
  }

  private justifyOffset(): [number, number] {
    const isVertical = this.props.direction === 'vertical';

    switch (this.props.justify) {
      case 'start':
        return [0, 0];
      case 'end':
        return [0, 0];
      case 'center':
        return [isVertical ? 0 : (this.width - this.maxContentWidth) / 2, isVertical ? (this.height - this.maxContentHeight) / 2 : 0];
      case 'auto':
        return [(this.width - this.maxContentWidth) / 2, (this.height - this.maxContentHeight) / 2];
    }
  }

  private *positions(): IterableIterator<[number, number, Component<any>, number]> {
    const { children = [], spacing } = this.props;
    const [xJustifyOffset, yJustifyOffset] = this.justifyOffset();
    let xPos = spacing;
    let yPos = spacing;
    let wrapCount = 0;

    for (const child of children) {
      // wrap around
      if (this.props.direction === 'horizontal' && xPos + child.width + spacing > this.width) {
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

      if (this.props.direction === 'horizontal') {
        xPos += child.width + spacing;
      } else {
        yPos += child.height + spacing;
      }
    }
  }

  private updateMaxContentWidth(): void {
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

    if (this.props.width === 'auto') {
      this.width = this.maxContentWidth;
    }

    if (this.props.height === 'auto') {
      this.height = this.maxContentHeight;
    }
  }

  public render(x: number, y: number, ctx: CanvasRenderingContext2D): void {
    for (const [childX, childY, child] of this.positions()) {
      child.render(x + childX, y + childY, ctx);
    }

    super.render(x, y, ctx);
  }

  public setState(state: ComponentState): void {
    // do not rerender
    this.state = state;
  }

  public addChild(child: Component<any>): void {
    this.props.children?.push(child);
    this.maxItemHeight = Math.max(this.maxItemHeight, child.height);
    this.maxItemWidth = Math.max(this.maxItemHeight, child.width);
    this.updateMaxContentWidth();
  }
}