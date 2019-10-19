import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { isUndefined } from 'util';
import { errorIfUndefined } from '../extUtils';

export enum EventType {
    BuildAndRun = 'buildAndRun',
    InputOutput = 'inputOutput', // Not really used because the module is output only
    Tools = 'tools',
    Settings = 'settings'
}

interface Event {
    type: string;
    event: any;
}

export class DisplayInterface {
    public curView: vscode.WebviewPanel | undefined = undefined;
    public eventQueue: Event[] = [];
    public eventHandlers: Map<EventType, ((arg0: any) => void)[]> = new Map();
    public temporaryEventHandlers: Map<EventType, ((arg0: any) => void)[]> = new Map();

    constructor() {
        // Empty for now...
    }

    /**
     * Opens a new CP Tools webview, or selects (focuses) it if it's already open.
     * @param context The extension context object
     */
    openDisplay(context: vscode.ExtensionContext): void {
        if (!isUndefined(this.curView)) {
            var display: vscode.WebviewPanel = this.curView;
            display.reveal(vscode.ViewColumn.Active);
        }
        else {
    // tslint:disable-next-line: no-duplicate-variable
            var display: vscode.WebviewPanel = vscode.window.createWebviewPanel(
                'cpToolsDisplay',
                'CP Tools',
                vscode.ViewColumn.Active,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true
                }
            );

            // Attaching Relevant event handlers

            // On dispose
            display.onDidDispose(() => {
                this.curView = undefined;
            }, null, context.subscriptions);

            // Making sure to empty the event queue when the frame is shown
            display.onDidChangeViewState(evt => {
                if (evt.webviewPanel.visible) {
                    // tslint:disable-next-line: curly
                    for (const event of this.eventQueue)
                        display.webview.postMessage(event);
                    this.eventQueue.length = 0;
                }
            });

            // Handling events from the webview
            display.webview.onDidReceiveMessage(evt => {
                console.log(JSON.stringify(evt));

                if (isUndefined(evt.type)) {
                    vscode.window.showErrorMessage('Received event from webview with unknown type!');
                    return;
                }
                
                // Normal handlers
                let handlers = this.eventHandlers.get(evt.type);
                if (!isUndefined(handlers)) {
                    handlers.forEach(handle => handle(evt.event));
                }

                // Temp handlers
                let temporaryHandlers = this.temporaryEventHandlers.get(evt.type);
                if (!isUndefined(temporaryHandlers)) {
                    temporaryHandlers.forEach(handle => handle(evt.event));
                    this.temporaryEventHandlers.delete(evt.type);
                }
            });
        }

        // Set final stuff
        display.webview.html = this.getDisplayHTML(context);
        this.curView = display;
    }

    /**
     * Unlinks the current display
     */
    unlinkDisplay(): void {
        this.curView = undefined;
    }

    /**
     * Resets the display HTML of the CP-Tools webview.  Mainly for debugging purposes or if something has gone wrong.
     * If curView is undefined, an error will be thrown
     * @param context The extension context
     */
    resetDisplayHTML(context: vscode.ExtensionContext): void {
        const curView = errorIfUndefined(this.curView, 'No display is loaded!');
        curView.webview.html = this.getDisplayHTML(context);
        vscode.window.showInformationMessage('Reloaded WebView HTML!');
    }

    /**
     * Gets the HTML for the CP Tools display
     * @param context Extension context object
     */
    getDisplayHTML(context: vscode.ExtensionContext) { 
        let resourceDir = vscode.Uri.file(path.join(context.extensionPath, 'out', 'assets')).with({ scheme: 'vscode-resource' });
        // console.log(resourceDir);
        return fs.readFileSync(path.join(context.extensionPath, 'out', 'assets', 'display.html'))
            .toString()
            .replace(/vscodeRoot/g, resourceDir.toString());
    }

    /**
     * Emits an event to the display
     * @param obj Event object to emit
     */
    emit(obj: Event) {
        // Has to be like this (likely because of some this shenanigans)
        // This cannot simply be refractored to `const emitEvent = display.webview.postMessage;`
        if (!isUndefined(this.curView) && this.curView.visible) {
            this.curView.webview.postMessage(obj);
        }
        else {
            this.eventQueue.push(obj);
        }
    }

    /**
     * Registers an event handler for events from the display
     * @param type Type of event
     * @param handler Event handler
     */
    on(type: EventType, handler: (arg0: any) => void) {
        let res = this.eventHandlers.get(type);
        if (isUndefined(res)) {
            this.eventHandlers.set(type, res = []);
        }

        res.push(handler);
    }
}