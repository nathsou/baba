import { game } from "./game";

const { level } = game;

///@ts-ignore
window['level'] = level;

document.body.appendChild(level.canvas);

level.reactTo({ type: 'update_rules' });
level.start();