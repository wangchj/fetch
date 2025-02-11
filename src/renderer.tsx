/**
 * This file will automatically be loaded by webpack and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/latest/tutorial/process-model
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * To enable Node.js integration in this file, open up `main.js` and enable the `nodeIntegration`
 * flag:
 *
 * ```
 *  // Create the browser window.
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true
 *    }
 *  });
 * ```
 */

import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import { createTheme, MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { loader } from '@monaco-editor/react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { dispatch, store } from 'renderer/redux/store';
import { App } from 'renderer/ui/app';
import onSave from "renderer/utils/on-save";
import * as Persistence from 'renderer/utils/persistence';
import { Project } from 'types/project';
import { Request } from 'types/request';
import { Workspace } from 'types/workspace';
import { RequestResult } from 'types/request-result';
import { projectSlice } from 'renderer/redux/project-slice';
import { workspaceSlice } from 'renderer/redux/workspace-slice';

self.MonacoEnvironment = {
	getWorkerUrl: function (moduleId, label) {
		return './vs/base/worker/workerMain.js';
	}
};

loader.config({ paths: { vs: './vs' } });

declare global {
  interface Window {
    openWorkspace: () => Promise<Workspace>;
    saveWorkspace: (workspace: Workspace) => Promise<void>;
    openProject: (path: string) => Promise<Project>;
    saveProject: (path: string, project: Project) => Promise<void>;
    sendRequest: (request: Request) => Promise<RequestResult>;
    showOpenProjectDialog: () => Promise<string>;
    showNewProjectDialog: () => Promise<string>;
    onFlushWorkspace: (callback: () => void) => void;
    onSave: (callback: () => void) => void;
    onCloseProject: (callback: () => void) => void;
    monaco: any;
    printWorkspace: () => void;
    printProject: () => void;
    printResults: () => void;
    printUi: () => void;
    printPersistence: () => void;
  }
}

const theme = createTheme({
  /** Put your mantine theme override here */
});

createRoot(document.querySelector('#root')).render(
  <Provider store={store}>
    <MantineProvider theme={theme}>
      <App/>
      <Notifications autoClose={false}/>
    </MantineProvider>
  </Provider>
);

/**
 * Handles flush workspace event from the main process.
 *
 * The purpose is to flush the redux state to the main process to be saved on disk.
 */
window.onFlushWorkspace(() => {
  const workspace = store.getState().workspace;
  const project = store.getState().project;
  Persistence.saveWorkspace(workspace);
  Persistence.saveProject(workspace.projectPath, project);
});

/**
 * Handles the save event from app menu.
 */
window.onSave(() => {
  onSave();
});

/**
 * Handles close project event from app menu.
 */
window.onCloseProject(() => {
  const workspace = store.getState().workspace;
  const project = store.getState().project;

  if (!project || !workspace.projectPath) {
    return;
  }

  Persistence.saveProject(workspace.projectPath, project);
  dispatch(projectSlice.actions.closeProject());

  dispatch(workspaceSlice.actions.closeProject());
  Persistence.saveWorkspace(store.getState().workspace);
});
