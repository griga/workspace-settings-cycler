import * as vscode from 'vscode';

function shallowEqual(a: any, b: any): boolean {
  // only check fist depth
  for (let key in a) {
    if (!a.hasOwnProperty(key)) continue;
    if (!b.hasOwnProperty(key)) return false;
    if (a[key] === b[key]) continue;
    if (typeof a[key] !== 'object') return false;
  }
  for (let key in b) {
    if (b.hasOwnProperty(key) && !a.hasOwnProperty(key)) return false;
  }
  return true;
}

type Configuration = {
  [key: string]: unknown;
};

type SettingsCyclerArguments = {
  id: string;
  values: Configuration | Configuration[];
};

type InspectionResult<T> =
  | {
      key: string;

      defaultValue?: T;
      globalValue?: T;
      workspaceValue?: T;
      workspaceFolderValue?: T;

      defaultLanguageValue?: T;
      globalLanguageValue?: T;
      workspaceLanguageValue?: T;
      workspaceFolderLanguageValue?: T;

      languageIds?: string[];
    }
  | undefined;

const OPOSITES: ([boolean, boolean] | [number, number] | [string, string])[] = [
  [true, false],
  [false, true],
  [0, 1],
  [1, 0],
  ['on', 'off'],
  ['off', 'on'],
  ['yes', 'no'],
  ['no', 'yes'],
  ['enabled', 'disabled'],
  ['disabled', 'enabled'],
  ['active', 'inactive'],
  ['inactive', 'active'],
];

const cyclerIndexCache: { [key: string]: number } = {};

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    'workspace.settings.cycler',

    async (args: SettingsCyclerArguments) => {
      if (!args || !args.id || !args.values) {
        vscode.window.showErrorMessage(`Please make sure your 'args' is not empty`);
        return;
      }

      const values = Array.isArray(args.values) ? args.values : [args.values];

      if (values.length <= 0) {
        vscode.window.showWarningMessage(`Please make sure your 'args.value' is not empty'`);
        return;
      }

      let workspaceConfiguration = vscode.workspace.getConfiguration();

      let allOptions: Set<string> = new Set<string>();

      for (const value of values) {
        for (const key in value) {
          allOptions.add(key);
        }
      }

      let currentOptions: { [key: string]: unknown } = {};

      for (let key of allOptions.values()) {
        let val = workspaceConfiguration.inspect(key);
        if (!val) continue;
        currentOptions[val.key] =
          val.globalValue !== undefined ? val.globalValue : val.defaultValue;
      }

      let promiseFns: (() => Thenable<void>)[] = [];

      let nextIndex: number;
      if (cyclerIndexCache[args.id] === undefined) {
        let currentIndex = -1;
        for (let index = 0, len = values.length; index < len; index++) {
          let configuration = values[index];
          if (shallowEqual(configuration, currentOptions)) {
            currentIndex = index;
          }
        }
        nextIndex = (currentIndex + 1) % values.length;
      } else {
        nextIndex = (cyclerIndexCache[args.id] + 1) % values.length;
      }
      cyclerIndexCache[args.id] = nextIndex;

      Object.keys(values[nextIndex]).forEach((key) =>
        promiseFns.push(makeOptionUpdater(key, values[nextIndex][key], workspaceConfiguration))
      );

      const results = await Promise.allSettled(promiseFns.map((fn) => fn()));
      const rejected = results.filter(
        (result) => result.status === 'rejected'
      ) as PromiseRejectedResult[];
      rejected.forEach((result) => console.error(result.reason));
    }
  );

  context.subscriptions.push(disposable);
}

function extractValFromInspection<T>(
  inspectionVal: InspectionResult<T>,
  falback?: T
): T | undefined {
  const currentVal =
    inspectionVal?.workspaceValue ??
    inspectionVal?.globalValue ??
    inspectionVal?.defaultValue ??
    falback;

  return currentVal;
}

function makeOptionUpdater(
  key: string,
  val: unknown,
  workspaceConfiguration: vscode.WorkspaceConfiguration
): () => Thenable<void> {
  const inspectionVal = workspaceConfiguration.inspect(key);
  if (val === '$inc') {
    const currentVal = extractValFromInspection(inspectionVal, 0);
    const newVal = typeof currentVal === 'number' ? currentVal + 1 : 0;
    return () => workspaceConfiguration.update(key, newVal, vscode.ConfigurationTarget.Workspace);
  } else if (val === '$dec') {
    const currentVal = extractValFromInspection(inspectionVal, 0);
    const newVal = typeof currentVal === 'number' ? currentVal - 1 : 0;
    return () => workspaceConfiguration.update(key, newVal, vscode.ConfigurationTarget.Workspace);
  } else if (val === '$toggle') {
    const currentVal = extractValFromInspection(inspectionVal);
    const isOposate = OPOSITES.some(([a]) => Object.is(a, currentVal));
    if (!isOposate) return () => Promise.resolve(undefined);
    const newVal = OPOSITES.find(([a]) => Object.is(a, currentVal))?.[1];
    return () => workspaceConfiguration.update(key, newVal, vscode.ConfigurationTarget.Workspace);
  } else {
    return () => workspaceConfiguration.update(key, val, vscode.ConfigurationTarget.Workspace);
  }
}

export function deactivate() {}
