import { Game } from "./Game";

const game = new Game(18, 16);

///@ts-ignore
window['game'] = game;

document.body.appendChild(game.canvas);

game.start();