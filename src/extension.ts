import * as vscode from 'vscode';
import * as hash from 'object-hash';

type CyclerConfiguration = {
  $global: boolean;
  $step: number;
  $min: number;
  $max: number;
};

type Configuration = {
  [settingKey: string]: unknown;
};

type SettingsCyclerArguments =
  | Configuration
  | Configuration[]
  | {
      $global: boolean;
      $values: Configuration | Configuration[];
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

const CYCLER_FIELDS: (keyof CyclerConfiguration)[] = ['$global', '$step', '$min', '$max'];

const cyclerIndexCache: { [key: string]: number } = {};

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    'workspace.settings.cycler',

    async (args: SettingsCyclerArguments) => {
      if (!args) {
        vscode.window.showErrorMessage(`Please make sure your 'args' is not empty`);
        return;
      }

      let configurations: Configuration[];
      if (!Array.isArray(args) && args.$values !== undefined) {
        configurations = (Array.isArray(args.$values) ? args.$values : [args.$values]).map(
          (value) => ({ ...value, $global: args.$global })
        );
      } else if (Array.isArray(args)) {
        configurations = args;
      } else if (typeof args === 'object') {
        configurations = [args as Configuration];
      } else {
        vscode.window.showErrorMessage(
          `Please make sure your 'args' is an array or an object with '$values' property`
        );
        return;
      }

      if (configurations.length <= 0) {
        vscode.window.showWarningMessage(`Please make sure your 'args' is not empty'`);
        return;
      }
      const id = hash(configurations);
      const workspaceConfiguration = vscode.workspace.getConfiguration();

      const { configs, values } = configurations
        .map((configuration) =>
          parseConfiguration(configuration as Configuration & CyclerConfiguration)
        )
        .reduce(
          (acc, [cyclerConfiguration, valuesConfiguration]) => {
            acc.configs.push(cyclerConfiguration);
            acc.values.push(valuesConfiguration);
            return acc;
          },
          {
            configs: [] as CyclerConfiguration[],
            values: [] as Configuration[],
          }
        );

      let involvedOptions: Set<string> = new Set<string>();
      for (const value of values) {
        for (const key in value) {
          involvedOptions.add(key);
        }
      }

      let currentOptions: { [key: string]: unknown } = {};
      for (let key of involvedOptions.values()) {
        let val = workspaceConfiguration.inspect(key);
        if (!val) continue;
        currentOptions[val.key] =
          val.globalValue !== undefined ? val.globalValue : val.defaultValue;
      }

      let nextIndex: number;
      if (cyclerIndexCache[id] === undefined) {
        let currentIndex = -1;
        for (let index = 0, len = values.length; index < len; index++) {
          if (shallowEqual(values[index], currentOptions)) {
            currentIndex = index;
          }
        }
        nextIndex = (currentIndex + 1) % values.length;
      } else {
        nextIndex = (cyclerIndexCache[id] + 1) % values.length;
      }
      cyclerIndexCache[id] = nextIndex;

      const promiseFns: (() => Thenable<void>)[] = [];
      Object.keys(values[nextIndex]).forEach((key) =>
        promiseFns.push(
          makeOptionUpdater(key, values[nextIndex][key], configs[nextIndex], workspaceConfiguration)
        )
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
  { $global, $max, $min, $step }: CyclerConfiguration,
  workspaceConfiguration: vscode.WorkspaceConfiguration
): () => Thenable<void> {
  console.log('[extension] updater ', key, val, { $global, $max, $min, $step })
  const inspectionVal = workspaceConfiguration.inspect(key);
  const scope = $global ? true : vscode.ConfigurationTarget.Workspace;
  if (val === '$inc') {
    const currentVal = extractValFromInspection(inspectionVal, 0);
    const newVal = typeof currentVal === 'number' ? currentVal + $step : 0;
    const clampedVal = Math.min(Math.max(newVal, $min), $max);
    return () => workspaceConfiguration.update(key, clampedVal, scope);
  } else if (val === '$dec') {
    const currentVal = extractValFromInspection(inspectionVal, 0);
    const newVal = typeof currentVal === 'number' ? currentVal - $step : 0;
    const clampedVal = Math.min(Math.max(newVal, $min), $max);
    return () => workspaceConfiguration.update(key, clampedVal, scope);
  } else if (val === '$toggle') {
    const currentVal = extractValFromInspection(inspectionVal);
    const isOposate = OPOSITES.some(([a]) => Object.is(a, currentVal));
    if (!isOposate) return () => Promise.resolve(undefined);
    const newVal = OPOSITES.find(([a]) => Object.is(a, currentVal))?.[1];
    console.log('[extension] updater $toggle', currentVal, newVal)
    return () => workspaceConfiguration.update(key, newVal, scope);
  } else {
    return () => workspaceConfiguration.update(key, val, scope);
  }
}

export function deactivate() {}

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

function parseConfiguration(
  configuration: Configuration & CyclerConfiguration
): [cyclerConfiguration: CyclerConfiguration, valuesConfiguration: Configuration] {
  const cyclerConfiguration: CyclerConfiguration = {
    $global: false,
    $step: 1,
    $min: -Infinity,
    $max: Infinity,
  };
  const valuesConfiguration: Configuration = {};
  for (const key in configuration) {
    if (CYCLER_FIELDS.includes(key as keyof CyclerConfiguration)) {
      (cyclerConfiguration as any)[key] = configuration[key];
    } else {
      valuesConfiguration[key] = configuration[key];
    }
  }
  return [cyclerConfiguration, valuesConfiguration] as [
    cyclerConfiguration: CyclerConfiguration,
    valuesConfiguration: Configuration
  ];
}
