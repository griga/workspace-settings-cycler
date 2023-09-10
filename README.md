# Workspace Settings Cycler

Control any VS Code setting in your workspace by your favorite keybindings. This extension exist mainly to control settings of your current **workspace** or opened **folder** via keybindings. Here are some to help you get started.

## Sample Configuration

```json
  {
    "key": "ctrl+shift+alt+t",
    "command": "workspace.settings.cycler",
    "args": {
      "workbench.editor.showTabs": "$toggle",
    }
  },
  {
    "key": "ctrl+shift+alt+=",
    "command": "workspace.settings.cycler",
    "args": {
      "window.zoomLevel": "$inc",
    }
  },
  {
    "key": "ctrl+shift+alt+-",
    "command": "workspace.settings.cycler",
    "args": {
      "window.zoomLevel": "$dec",
    }
  },
  {
    "key": "ctrl+shift+alt+]",
    "command": "workspace.settings.cycler",
    "args": {
      "editor.fontSize": "$inc",
    }
  },
  {
    "key": "ctrl+shift+alt+[",
    "command": "workspace.settings.cycler",
    "args": {
      "editor.fontSize": "$dec",
    }
  },
  {
    "key": "ctrl+shift+alt+l",
    "command": "workspace.settings.cycler",
    "args": {
      "editor.lineNumbers": "$toggle"
    }
  },
  {
    "key": "ctrl+shift+alt+s",
    "command": "workspace.settings.cycler",
    "args": {
      "workbench.statusBar.visible": "$toggle"
    }
  },
  {
    "key": "ctrl+shift+alt+a",
    "command": "workspace.settings.cycler",
    "args": {
      "workbench.activityBar.visible": "$toggle"
    }
  },
  {
    "key": "ctrl+shift+alt+t",
    "command": "workspace.settings.cycler",
    "args": [
      {
        "workbench.sideBar.location": "right"
      },
      {
        "workbench.sideBar.location": "left"
      }
    ]
  },
  {
    "key": "ctrl+shift+alt+c",
    "command": "workspace.settings.cycler",
    "args": {
      "window.commandCenter": "$toggle"
    }
  },

```

**key**
The shortcut you want to use

**command**
Command should always be `workspace.settings.cycler`. You can create multiple keybindings and use the same `command` name.

**args**
arguments for the settings you want to toggle. Can be array of configurations or single configuration object. Check example above for usage details. Configuration is simple JavaScript dictionary, the format is like:

```
{
	"<SettingName>": <SettingValue>,
	"<SettingName>": <SettingValue>,
	...
}
``` 

Special values can be used for <SettingValue>:

- `$inc` - will increment setting value. usefull to control zoom levels or font sizes
- `$dec` - oposite to `$inc`, will decrement setting value
- `$toggle` - will switch toggable setting
- - `true` <=> `false`,
- - `0` <=> `1`,
- - `'on'` <=> `'off'`,
- - `'yes'` <=> `'no'`,
- - `'enabled'` <=> `'disabled'`,
- - `'active'` <=> `'inactive'`

## Release Notes

### 0.0.1
Initial release

### 0.0.2
Simplify command configuration