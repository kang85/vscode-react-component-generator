"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
const vscode_1 = require("vscode")
const fse = require("fs-extra")
const fs = require("fs")
const path = require("path")
const change_case_1 = require("change-case")
const rxjs_1 = require("rxjs")
// import { Config as ConfigInterface } from './config.interface';
class FileHelper {
  static createComponentDir(uri, componentName) {
    let contextMenuSourcePath
    const globalConfig = getConfig().get("global")
    if (uri && fs.lstatSync(uri.fsPath).isDirectory()) {
      contextMenuSourcePath = uri.fsPath
    } else if (uri) {
      contextMenuSourcePath = path.dirname(uri.fsPath)
    } else {
      contextMenuSourcePath = vscode_1.workspace.rootPath
    }
    let componentDir = `${contextMenuSourcePath}`
    if (globalConfig.generateFolder) {
      componentDir = `${contextMenuSourcePath}/${this.setName(componentName)}`
      fse.mkdirsSync(componentDir)
    }
    return componentDir
  }
  static createComponent(componentDir, componentName, suffix = "-container") {
    const globalConfig = getConfig().get("global")
    const componentConfig = getConfig().get("mainFile")
    let templateFileName =
      this.assetRootDir + `/templates/component${suffix}.template`
    if (componentConfig.template) {
      const path = componentConfig.template + `component${suffix}.template`
      templateFileName = this.resolveWorkspaceRoot(path)
    }
    const compName = this.setName(componentName)
    const removeLifecycleType =
      globalConfig.lifecycleType == "legacy" ? "reactv16" : "legacy"
    console.log("removeLifecycleType", removeLifecycleType)
    let componentContent = fs
      .readFileSync(templateFileName)
      .toString()
      .replace(/{componentName}/g, compName)
      .replace(/{quotes}/g, this.getQuotes(globalConfig))
    // console.log('content', componentContent);
    componentContent = removeBetweenTags(
      globalConfig.lifecycleType,
      removeLifecycleType,
      componentContent
    )
    let filename = `${componentDir}/${compName}.${componentConfig.extension}`
    if (componentConfig.create) {
      return this.createFile(filename, componentContent).map(result => filename)
    } else {
      return rxjs_1.Observable.of("")
    }
  }
  static createIndexFile(componentDir, componentName) {
    const globalConfig = getConfig().get("global")
    const indexConfig = getConfig().get("indexFile")
    let templateFileName = this.assetRootDir + "/templates/index.template"
    if (indexConfig.template) {
      templateFileName = this.resolveWorkspaceRoot(indexConfig.template)
    }
    const compName = this.setName(componentName)
    let indexContent = fs
      .readFileSync(templateFileName)
      .toString()
      .replace(/{componentName}/g, compName)
      .replace(/{quotes}/g, this.getQuotes(globalConfig))
    let filename = `${componentDir}/index.${indexConfig.extension}`
    if (indexConfig.create) {
      return this.createFile(filename, indexContent).map(result => filename)
    } else {
      return rxjs_1.Observable.of("")
    }
  }
  static createCSS(componentDir, componentName) {
    const globalConfig = getConfig().get("global")
    const styleConfig = getConfig().get("styleFile")
    const styleTemplate = getStyleSheetExtTemplate()
    let templateFileName = `${this.assetRootDir}/templates/${
      styleTemplate.template
    }`
    // if (styleConfig.template) {
    //     templateFileName = this.resolveWorkspaceRoot(styleConfig.template);
    // }
    const compName = this.setName(componentName)
    let cssContent = fs
      .readFileSync(templateFileName)
      .toString()
      .replace(/{componentName}/g, compName)
      .replace(/{quotes}/g, this.getQuotes(globalConfig))
    let filename = `${componentDir}/${compName}${styleConfig.suffix}.${
      styleTemplate.ext
    }`
    if (styleConfig.create) {
      return this.createFile(filename, cssContent).map(result => filename)
    } else {
      return rxjs_1.Observable.of("")
    }
  }
}
FileHelper.assetRootDir = path.join(__dirname, "../../assets")
FileHelper.createFile = rxjs_1.Observable.bindNodeCallback(fse.outputFile)
FileHelper.resolveWorkspaceRoot = path =>
  path.replace("${workspaceFolder}", vscode_1.workspace.rootPath)
FileHelper.getQuotes = config => (config.quotes === "double" ? '"' : "'")
FileHelper.setName = name => change_case_1.pascalCase(name)
exports.FileHelper = FileHelper
function logger(type, msg = "") {
  switch (type) {
    case "success":
      return vscode_1.window.setStatusBarMessage(`Success: ${msg}`, 5000)
    // return window.showInformationMessage(`Success: ${msg}`);
    case "warning":
      return vscode_1.window.showWarningMessage(`Warning: ${msg}`)
    case "error":
      return vscode_1.window.showErrorMessage(`Failed: ${msg}`)
  }
}
exports.logger = logger
function getConfig(uri) {
  return vscode_1.workspace.getConfiguration("ACReactComponentGenerator", uri)
}
exports.default = getConfig
function getStyleSheetExtTemplate() {
  const configuredView = getConfig().get("styleFile.type")
  let styleTemplate = {
    ext: "css",
    template: "css.template"
  }
  switch (configuredView) {
    case "styled-components (.js)":
      styleTemplate = { ext: "js", template: "css-styled.template" }
      break
    case "emotion (.js)":
      styleTemplate = { ext: "js", template: "css-emotion.template" }
      break
    case "sass (.sass)":
      styleTemplate.ext = "sass"
      break
    case "sass (.scss)":
      styleTemplate.ext = "scss"
      break
    case "less (.less)":
      styleTemplate.ext = "less"
      break
  }
  return styleTemplate
}
exports.getStyleSheetExtTemplate = getStyleSheetExtTemplate
function removeBetweenTags(remainTag, removedtag, content) {
  const escapeRegExp = s => s.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")
  const regexPattern = RegExp(
    `${escapeRegExp(`<${removedtag}>`)}([\\S\\s]+?)${escapeRegExp(
      `</${removedtag}>`
    )}`,
    "gi"
  )
  const removeOnlyTagsPattern = new RegExp(
    `<(${escapeRegExp(remainTag)}|/${escapeRegExp(remainTag)})[^>]{0,}>`,
    "gi"
  )
  return content.replace(regexPattern, "").replace(removeOnlyTagsPattern, "")
}
exports.removeBetweenTags = removeBetweenTags
//# sourceMappingURL=helpers.js.map
