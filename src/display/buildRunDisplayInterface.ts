import { DisplayInterface, EventType } from './displayInterface';

export enum BuildRunEventTypes {
    Reset = 'reset',
    Packet = 'packet'
}

export class BuildRunDI {
    resetResponseQueue: (() => void)[] = [];

    constructor(
        public readonly displayInterface: DisplayInterface
    ) {
        this.displayInterface.on(EventType.BuildAndRun, (evt) => {
            if (evt.type === BuildRunEventTypes.Reset) {
                // tslint:disable-next-line: curly
                for (let resp of this.resetResponseQueue)
                    resp();
                this.resetResponseQueue.length = 0;
            }
        });
    }

    /**
     * When the reset event is sent to the webview, the webview should respond back with a reset event to confirm that the reset was complete.
     */
    async waitForResetResponse(): Promise<void> {
        return new Promise((res, _) => { // Lambda so `this` is not overridden
            this.resetResponseQueue.push(res);
        });
    }
}
