const path = require('path');
const {Menu, app, BrowserWindow} = require('electron');
const {version} = require(path.join(__dirname, '../package.json'));

const template = [
  {
    label: 'App',
    role: 'window',
    submenu: [
      {
        label: 'Reload',
        accelerator: 'CmdOrCtrl+R',
        click (item, focusedWindow) {
          if (focusedWindow) focusedWindow.reload()
        }
      },
      {
        role: 'minimize'
      },
      {
        role: 'close'
      }
    ]
  },
  {
    label: 'Zoom',
    submenu: [
      // {
      //   label: 'Toggle Developer Tools',
      //   accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
      //   click (item, focusedWindow) {
      //     if (focusedWindow) focusedWindow.webContents.toggleDevTools()
      //   }
      // },
      {
        role: 'resetzoom'
      },
      {
        role: 'zoomin',
        accelerator: 'CmdOrCtrl+=',
      },
      {
        role: 'zoomout'
      },
      {
        type: 'separator'
      },
      {
        role: 'togglefullscreen'
      }
    ]
  },
  {
    label: 'Edit',
    submenu: [
      {
        role: 'undo'
      },
      {
        role: 'redo'
      },
      {
        type: 'separator'
      },
      {
        role: 'cut'
      },
      {
        role: 'copy'
      },
      {
        role: 'paste'
      },
      {
        role: 'delete'
      },
      {
        role: 'selectall'
      }
    ]
  },
  {
    role: 'help',
    submenu: [
      {
        label: 'About',
        click (item, focusedWindow) {
          let message = 'SLbot v.'+version+'\nCreated by Huckleberry in 2018\nYou are free to use, edit, and distribute under the MIT license.';
          focusedWindow.webContents.send('alert', message);
        }
      },
      {
        label: 'Check for Updates',
        click (item, focusedWindow) {
          let message = 'coming soon';
          focusedWindow.webContents.send('alert', message);
        }
      }
    ]
  }
]

if (process.platform === 'darwin') {
  const name = app.getName()
  template.unshift({
    label: name,
    submenu: [
      {
        role: 'about'
      },
      {
        type: 'separator'
      },
      {
        role: 'services',
        submenu: []
      },
      {
        type: 'separator'
      },
      {
        role: 'hide'
      },
      {
        role: 'hideothers'
      },
      {
        role: 'unhide'
      },
      {
        type: 'separator'
      },
      {
        role: 'quit'
      }
    ]
  })
  // Edit menu.
  template[1].submenu.push(
    {
      type: 'separator'
    },
    {
      label: 'Speech',
      submenu: [
        {
          role: 'startspeaking'
        },
        {
          role: 'stopspeaking'
        }
      ]
    }
  )
  // Window menu.
  template[3].submenu = [
    {
      label: 'Close',
      accelerator: 'CmdOrCtrl+W',
      role: 'close'
    },
    {
      label: 'Minimize',
      accelerator: 'CmdOrCtrl+M',
      role: 'minimize'
    },
    {
      label: 'Zoom',
      role: 'zoom'
    },
    {
      type: 'separator'
    },
    {
      label: 'Bring All to Front',
      role: 'front'
    }
  ]
}

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);
