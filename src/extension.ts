// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as executeRegister from './execute/register';
import * as templatesRegister from './template/register';
import * as optionsRegister from './options/register';
import * as extensionTerminalRegister from './terminal/register';
import { OptionManager } from './options/options';
import { DisplayInterface } from './display/displayInterface';
import { BuildRunDI } from './display/buildRunDisplayInterface';
import { errorIfUndefined } from './extUtils';
import { ProgramExecutionManagerDriver } from './execute/execute';
import { ExtensionTerminalManager } from './terminal/terminal';
import { InputOutputDI } from './display/inputOutputDisplayInterface';
import { OptionsDI } from './display/optionsDisplayInterface';

// ---------------------------------------------------------------------------
// Globals to export
// ---------------------------------------------------------------------------

let _extensionContext: vscode.ExtensionContext | undefined = undefined;
let _optionManager: OptionManager | undefined = undefined;

let _displayInterface: DisplayInterface | undefined = undefined;
let _buildRunDI: BuildRunDI | undefined = undefined;
let _inputOutputDI: InputOutputDI | undefined = undefined;
let _optionsDI: OptionsDI | undefined = undefined;

let _programExecutionManager: ProgramExecutionManagerDriver | undefined = undefined;

let _extensionTerminalManager: ExtensionTerminalManager | undefined = undefined;

export function extensionContext(): vscode.ExtensionContext { return errorIfUndefined(_extensionContext, 'Extension not activated!'); }
export function optionManager(): OptionManager { return errorIfUndefined(_optionManager, 'Extension not activated!'); }

export function displayInterface(): DisplayInterface { return errorIfUndefined(_displayInterface, 'Extension not activated!'); }
export function buildRunDI(): BuildRunDI { return errorIfUndefined(_buildRunDI, 'Extension not activated!'); }
export function inputOutputDI(): InputOutputDI { return errorIfUndefined(_inputOutputDI, 'Extension not activated!'); }
export function optionsDI(): OptionsDI { return errorIfUndefined(_optionsDI, 'Extension not activated!'); }

export function programExecutionManager(): ProgramExecutionManagerDriver { return errorIfUndefined(_programExecutionManager, 'Extension not activated!'); }

export function extensionTerminalManager(): ExtensionTerminalManager { return errorIfUndefined(_extensionTerminalManager, 'Extension not activated!'); }

export const CASES_PATH = 'cases.json';

// ---------------------------------------------------------------------------
// Activation Registration n stuff
// ---------------------------------------------------------------------------

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "cp-tools" is now active!');

	// Setting and Initializing Singletons
	_extensionContext = context;
	_optionManager = new OptionManager(_extensionContext);

	_displayInterface = new DisplayInterface();
	_buildRunDI = new BuildRunDI(_displayInterface);
	_inputOutputDI = new InputOutputDI(_displayInterface);
	_optionsDI = new OptionsDI(_displayInterface, _optionManager);
	
	_programExecutionManager = new ProgramExecutionManagerDriver(_buildRunDI);

	_extensionTerminalManager = new ExtensionTerminalManager();

	// Misc. Commands
	let resetDisplayHTML = vscode.commands.registerCommand('cp-tools.resetDisplayHTML', () => {
		displayInterface().resetDisplayHTML(context);
	});

	let open = vscode.commands.registerCommand('cp-tools.open', () => {
		displayInterface().openDisplay(context);
	});

	context.subscriptions.push(resetDisplayHTML);
	context.subscriptions.push(open);

	// Registering Other Commands
	optionsRegister.registerViewsAndCommands(context);
	executeRegister.registerViewsAndCommands(context);
	templatesRegister.registerViewsAndCommands(context);
	extensionTerminalRegister.registerViewsAndCommands(context);
}

// this method is called when your extension is deactivated
export function deactivate() {}
