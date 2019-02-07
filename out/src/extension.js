"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode_1 = require("vscode")
const change_case_1 = require("change-case")
const rxjs_1 = require("rxjs")
const helpers_1 = require("./helpers")
const TEMPLATE_SUFFIX_SEPERATOR = "-"
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
  const createComponent = (uri, suffix = "") => {
    // Display a dialog to the user
    let enterComponentNameDialog$ = rxjs_1.Observable.from(
      vscode_1.window.showInputBox({
        prompt:
          "Please enter component name in camelCase then I can convert it to PascalCase for you."
      })
    )
    enterComponentNameDialog$
      .concatMap(val => {
        if (val.length === 0) {
          helpers_1.logger("error", "Component name can not be empty!")
          throw new Error("Component name can not be empty!")
        }
        let componentName = change_case_1.paramCase(val)
        let componentDir = helpers_1.FileHelper.createComponentDir(
          uri,
          componentName
        )
        return rxjs_1.Observable.forkJoin(
          helpers_1.FileHelper.createComponent(
            componentDir,
            componentName,
            suffix
          ),
          helpers_1.FileHelper.createIndexFile(componentDir, componentName),
          helpers_1.FileHelper.createCSS(componentDir, componentName)
        )
      })
      .concatMap(result => rxjs_1.Observable.from(result))
      .filter(path => path.length > 0)
      .first()
      .concatMap(filename =>
        rxjs_1.Observable.from(vscode_1.workspace.openTextDocument(filename))
      )
      .concatMap(textDocument => {
        if (!textDocument) {
          helpers_1.logger("error", "Could not open file!")
          throw new Error("Could not open file!")
        }
        return rxjs_1.Observable.from(
          vscode_1.window.showTextDocument(textDocument)
        )
      })
      .do(editor => {
        if (!editor) {
          helpers_1.logger("error", "Could not open file!")
          throw new Error("Could not open file!")
        }
      })
      .subscribe(
        c => {
          helpers_1.logger("success", "React component successfully created!")
          vscode_1.commands.executeCommand(
            "workbench.files.action.refreshFilesExplorer"
          )
        },
        err => helpers_1.logger("error", err.message)
      )
  }
  const componentArray = [
    {
      type: "container",
      commandId: "extension.genReactContainerComponentFiles"
    },
    {
      type: "stateless",
      commandId: "extension.genReactStatelessComponentFiles"
    },
    {
      type: "reduxContainer",
      commandId: "extension.genReactReduxContainerComponentFiles"
    },
    {
      type: "reduxStateless",
      commandId: "extension.genReactReduxStatelessComponentFiles"
    }
  ]
  // The command has been defined in the package.json file
  // Now provide the implementation of the command with  registerCommand
  // The commandId parameter must match the command field in package.json
  componentArray.forEach(c => {
    const suffix = `${TEMPLATE_SUFFIX_SEPERATOR}${c.type}`
    const disposable = vscode_1.commands.registerCommand(c.commandId, uri =>
      createComponent(uri, suffix)
    )
    // Add to a list of disposables which are disposed when this extension is deactivated.
    context.subscriptions.push(disposable)
  })
}
exports.activate = activate
// this method is called when your extension is deactivated
function deactivate() {
  // code whe
}
exports.deactivate = deactivate
//# sourceMappingURL=extension.js.map
