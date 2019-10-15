import * as vscode from 'vscode';
import * as path from 'path';
import { optionManager } from '../extension';
import { OptionProperties, CategoryProperties } from './options';
import { errorIfUndefined } from '../extUtils';

export class OptionsNodeProvider implements vscode.TreeDataProvider<OptionNode | OptionNodeCategory> {
    private changeEmitter: vscode.EventEmitter<OptionNode | OptionNodeCategory | undefined> = new vscode.EventEmitter<OptionNode | OptionNodeCategory | undefined>();
        onDidChangeTreeData: vscode.Event<OptionNode | OptionNodeCategory | undefined | null> = this.changeEmitter.event;   
    
    constructor() {}

    refresh(): void {
        this.changeEmitter.fire();
    }
    
    getTreeItem(element: OptionNode): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }
    
    getChildren(element?: OptionNode | undefined): vscode.ProviderResult<OptionNode[] | OptionNodeCategory[]> {
        if (element) {
            if (element instanceof OptionNodeCategory) {
                return optionManager().entriesFor(element.category).map(([key, properties]) => new OptionNode(element.category, key, properties));
            }
            return [];
        } else {
            return optionManager().categories.map(category => new OptionNodeCategory(category, optionManager().categoryProperties(category)));
        }
    }
}

export class OptionNodeCategory extends vscode.TreeItem {
    public readonly contextValue: string = 'category';

    constructor(
        public readonly category: string,
        public readonly properties: CategoryProperties) {
        super(properties.label, vscode.TreeItemCollapsibleState.Expanded);
    }

    get value(): string { return ''; }
    get tooltip(): string { return errorIfUndefined(this.label, 'Undefined label! (WTF are you doing?)'); }

    get iconPath(): string {
        return path.join(__filename, '..', '..', '..', 'icons', 'category.svg');
    }
}

export class OptionNode extends vscode.TreeItem {
    public readonly contextValue: string = 'key';

    constructor(
        public readonly category: string,
        public readonly key: string, 
        public readonly properties: OptionProperties) {
        super(properties.label + ': ', vscode.TreeItemCollapsibleState.None);
    }

    get description(): string {
        return this.value.toString();
    }

    get value(): string | number {
        return optionManager().get(this.category, this.key);
    }

    get tooltip(): string {
        return `${this.properties.description}\nCurrent Value: ${this.value}`;
    }

    get iconPath(): string {
        return path.join(__filename, '..', '..', '..', 'icons', 'types', `${this.properties.type}.svg`);
    }
}