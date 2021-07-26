import { Component, ComponentState } from "./Component";

type ButtonProps = {
  text: string,
  width: number,
  height: number,
  textColor?: string,
  backgroundColor?: string,
  borderColor?: string,
  borderWidth?: number,
  font?: string,
  onClick: () => void,
};

export class Button extends Component<Required<ButtonProps>> {
  private onHoverProps: Required<ButtonProps>;

  constructor({
    text, width, height, textColor = 'white',
    backgroundColor = '#7b2cbf', font = '20px Arial',
    borderColor = 'white', borderWidth = 0, onClick
  }: ButtonProps) {
    super({ text, width, height, textColor, backgroundColor, font, borderColor, borderWidth, onClick });
    this.width = width;
    this.height = height;
    this.debugColor = 'blue';

    this.onHoverProps = {
      ...this.props,
      borderWidth: 2,
      borderColor,
    };
  }

  protected onStateChange(newState: ComponentState): void {
    if (newState === 'mouseDown') {
      this.props.onClick();
    }
  }

  public render(x: number, y: number, ctx: CanvasRenderingContext2D): void {
    const {
      text, width, height, textColor,
      backgroundColor, font, borderColor, borderWidth
    } = this.state === 'hover' ? this.onHoverProps : this.props;

    ctx.fillStyle = backgroundColor;
    ctx.fillRect(x, y, width, height);

    ctx.font = font;
    ctx.fillStyle = textColor;
    const metrics = ctx.measureText(text);
    const textWidth = metrics.width;
    const textHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;

    ctx.fillText(
      text,
      x + (width - textWidth) / 2,
      y + (height + textHeight) / 2,
      width
    );

    if (borderWidth > 0) {
      ctx.lineWidth = borderWidth;
      ctx.strokeStyle = borderColor;
      ctx.strokeRect(x, y, width, height);
    }

    super.render(x, y, ctx);
  }
}