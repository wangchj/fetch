import { exec } from 'child_process';
import { app, BrowserWindow, ipcMain, IpcMainInvokeEvent } from 'electron';
import fs from 'fs';
import os from 'os';
import { Project } from 'types/project';
import { Request } from 'types/request';
import { Workspace } from 'types/workspace';

// This allows TypeScript to pick up the magic constants that's auto-generated by Forge's Webpack
// plugin that tells the Electron app where to look for the Webpack-bundled app code (depending on
// whether you're running in development or production).
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = (): void => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    height: 800,
    width: 1600,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  });

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  mainWindow.on('close', () => {
    mainWindow.webContents.send('flush-workspace');
  });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  ipcMain.handle('openWorkspace', openWorkspace);
  ipcMain.handle('openProject', (event, path) => openProject(event, path));
  ipcMain.handle('saveProject', (event, path, project) => saveProject(event, path, project));
  ipcMain.handle('sendRequest', (event, request) => sendRequest(event, request));
  ipcMain.handle('saveWorkspace', (event, workspace) => saveWorkspace(event, workspace));
  createWindow();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

/**
 * Opens workspace file from disk.
 *
 * @returns The workspace object or undefined if workspace does not exist.
 */
async function openWorkspace(): Promise<Workspace> {
  try {
    const str = fs.readFileSync(`${os.homedir()}/.fetchy/workspace.json`, 'utf-8');
    return JSON.parse(str);
  }
  catch (error) {
    return;
  }
}

/**
 * Opens a project from disk.
 *
 * @param event Electron invoke event.
 * @param path The project file absolute path.
 * @returns The project object or undefined if project can't be opened.
 */
async function openProject(event: IpcMainInvokeEvent, path: string): Promise<Project> {
  try {
    const str = fs.readFileSync(path, 'utf-8');
    return JSON.parse(str);
  }
  catch (error) {
    return;
  }
}

/**
 * Saves the project to disk.
 *
 * @param event Electron invoke event.
 * @param project
 */
async function saveProject(event: IpcMainInvokeEvent, path: string, project: Project) {
  fs.writeFileSync(path, JSON.stringify(project, null, 2), 'utf-8');
}

async function sendRequest(event: IpcMainInvokeEvent, request: Request): Promise<string> {
  console.log('--------------', JSON.stringify(event, null, 2), request);
  return "Response";
}

/**
 * Saves workspace to disk.
 *
 * @param event Electron invoke event.
 * @param workspace The workspace object to save.
 */
async function saveWorkspace(event: IpcMainInvokeEvent, workspace: Workspace) {
  try {
    fs.writeFileSync(
      `${os.homedir()}/.fetchy/workspace.json`,
      JSON.stringify(workspace, null, 2),
      'utf-8'
    );
  }
  catch (error) {
    console.warn('Fail to save workspace:', error.message);
  }
}
