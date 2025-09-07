import { CustomEvents } from './enums';

// example of a custom event
const gameStopped = new CustomEvent(CustomEvents.GAME_STOPPED, {
    bubbles: true,
    cancelable: true,
});

export { gameStopped };
