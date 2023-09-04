# Workspace Settings Cycler

Control any VS Code setting in your workspace by your favorite keybindings. This extension exist mainly to control settings of your current __workspace__ via keybindings

## Sample Configuration

```json
 {
    "key": "ctrl+shift+alt+x",
    "command": "workspace.settings.cycler",
    "args": {
      "id": "show_tabs",
      "values": {
        "workbench.editor.showTabs": "$toggle",
      },
    }
  },
  {
    "key": "ctrl+shift+alt+=",
    "command": "workspace.settings.cycler",
    "args": {
      "id": "workspace_zoom_inc",
      "values": {
        "window.zoomLevel": "$inc",
      },
    }
  },
  {
    "key": "ctrl+shift+alt+-",
    "command": "workspace.settings.cycler",
    "args": {
      "id": "workspace_zoom_dec",
      "values": {
        "window.zoomLevel": "$dec",
      },
    }
  },
  {
    "key": "ctrl+shift+alt+l",
    "command": "workspace.settings.cycler",
    "args": {
      "id": "show_line_numbers",
      "values": {
        "editor.lineNumbers": "$toggle"
      },
    }
  },
  {
    "key": "ctrl+shift+alt+s",
    "command": "workspace.settings.cycler",
    "args": {
      "id": "show_status_bar",
      "values": {
        "workbench.statusBar.visible": "$toggle"
      },
    }
  },
  {
    "key": "ctrl+shift+alt+a",
    "command": "workspace.settings.cycler",
    "args": {
      "id": "show_activity_bar",
      "values": {
        "workbench.activityBar.visible": "$toggle"
      },
    }
  },
  {
    "key": "ctrl+shift+alt+t",
    "command": "workspace.settings.cycler",
    "args": {
      "id": "toggle_sidebar_location",
      "values": [
        {
          "workbench.sideBar.location": "right"
        },
        {
          "workbench.sideBar.location": "left"
        }
      ]
    }
  },

```

**key**
The shortcut you want to use

**command**
Command should always be `workspace.settings.cycler`. You can create multiple keybindings and use the same `command` name.

**args**
arguments for the settings you want to toggle.

**args.id**
This is the **unique** id/name for the set of settings you want to toggle.

**args.values**
This is an array for settings you want to toggle. Every item in this array is a simple JavaScript dictionary, the format is like.

```
{
	"<SettingName>": <SettingValue>,
	"<SettingName>": <SettingValue>,
	...
}
```

You can use single object instead of array.

Special values can be used for settings:

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
