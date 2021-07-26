
export type PropsWithChildren<Props> = Props & { children?: Component<any>[] };

export type ComponentState = 'none' | 'hover' | 'mouseDown';

interface MouseEvents {
  onMouseMove: (x: number, y: number) => void,
  onMouseDown: (x: number, y: number) => void,
  onMouseUp: (x: number, y: number) => void,
}

export abstract class Component<Props> implements MouseEvents {
  protected static DEBUG = false;
  protected props: PropsWithChildren<Props>;
  public width: number = 0;
  public height: number = 0;
  protected debugColor: string = 'red';
  protected debugLineWidth: number = 2;
  protected lastX: number = 0;
  protected lastY: number = 0;
  protected state: ComponentState = 'none';
  protected needsUpdate = true;

  constructor(props: PropsWithChildren<Props>) {
    this.props = props;
  }

  public render(x: number, y: number, ctx: CanvasRenderingContext2D): void {
    this.lastX = x;
    this.lastY = y;

    if (Component.DEBUG) {
      this.debug(x, y, ctx);
    }

    this.needsUpdate = false;
  }

  private debug(x: number, y: number, ctx: CanvasRenderingContext2D) {
    ctx.strokeStyle = this.debugColor;
    ctx.lineWidth = this.debugLineWidth;
    ctx.strokeRect(x, y, this.width, this.height);
  }

  public setState(state: ComponentState): void {
    if (this.state !== state) {
      this.onStateChange(state, this.state);
      this.state = state;
      this.needsUpdate = true;
    }
  }

  public addChild(child: Component<any>): void {
    this.props.children?.push(child);
  }

  protected onStateChange(newState: ComponentState, oldState: ComponentState): void { }

  private onMouseEvent(
    x: number, y: number, newState: ComponentState,
    defaultState: ComponentState, handler: keyof MouseEvents
  ): void {
    if (
      (x >= this.lastX && x <= this.lastX + this.width) &&
      (y >= this.lastY && y <= this.lastY + this.height)
    ) {
      this.setState(newState);

      if (this.props.children) {
        this.props.children.forEach(child => child[handler](x, y));
      }
    } else {
      this.setState(defaultState);
    }
  }

  public onMouseMove(x: number, y: number): void {
    this.onMouseEvent(x, y, 'hover', 'none', 'onMouseMove');
  }

  public onMouseDown(x: number, y: number): void {
    this.onMouseEvent(x, y, 'mouseDown', this.state, 'onMouseDown');
  }

  public onMouseUp(x: number, y: number): void {
    this.onMouseEvent(x, y, 'hover', this.state, 'onMouseUp');
  }

  public needsRerender(): boolean {
    return this.needsUpdate || ((this.props.children?.some(c => c.needsRerender())) ?? false);
  }
}