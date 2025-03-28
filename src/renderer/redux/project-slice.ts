import { createSlice, nanoid } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import getDescendantEnvIds from 'renderer/utils/get-descendant-env-ids';
import getDescendantFolderIds from 'renderer/utils/get-descendant-folder-ids';
import getDescendantRequestIds from 'renderer/utils/get-descendant-request-ids';
import * as Persistence from 'renderer/utils/persistence';
import { Project } from 'types/project';
import { Request } from 'types/request';

const initialState: Project = null;

export const projectSlice = createSlice({
  name: 'project',
  initialState,
  reducers: {
    /**
     * Updates the entire project object.
     *
     * @param state The project object.
     * @param action Contains the new project object.
     */
    setProject(state, action: PayloadAction<Project>) {
      return action.payload;
    },

    /**
     * Close the currently opened project.
     */
    closeProject() {
      return null;
    },

    /**
     * Set a request object inside the project.
     *
     * @param state The project object.
     * @param action The payload contains:
     *   - id: The request id
     *   - request: The request object.
     */
    setRequest(state, action: PayloadAction<{id: string; request: Request}>) {
      if (!state.requests || !action.payload.request) {
        state.requests = {};
      }

      state.requests[action.payload.id] = JSON.parse(JSON.stringify(action.payload.request));

      Persistence.saveProjectDelay();
    },

    /**
     * Adds a new request to the project.
     *
     * @param state The project object.
     * @param action
     */
    addNewRequest(state, action: PayloadAction<{id: string; request: Request, folderId: string}>) {
      const {id, request, folderId} = action.payload;
      const folder = state.folders?.[folderId];

      // Edge case that the folder doesn't exist.
      if (!folder) {
        return;
      }

      // Add the request to the project
      if (!state.requests) {
        state.requests = {};
      }
      state.requests[id] = request;

      // Add the request to the folder
      if (!Array.isArray(folder.requests)) {
        folder.requests = [];
      }

      if (!folder.requests.includes(id)) {
        folder.requests.push(id);
      }

      Persistence.saveProjectDelay();
    },

    /**
     * Deletes a folder.
     *
     * @param state The project object.
     * @param action The payload:
     *  - id: the id of the folder.
     *  - parentId: the id of the containing folder.
     */
    deleteFolder(state, action: PayloadAction<{id: string, parentId: string}>) {
      const {id, parentId} = action.payload;

      if (state.requests && typeof state.requests === 'object') {
        const ids = new Set(getDescendantRequestIds(state, id));
        state.requests = Object.fromEntries(Object.entries(state.requests).filter(e => !ids.has(e[0])))
      }

      if (state.folders && typeof state.folders === 'object') {
        const ids = new Set(getDescendantFolderIds(state, id));
        state.folders = Object.fromEntries(Object.entries(state.folders).filter(e => !ids.has(e[0])))
      }

      const parent = state.folders?.[parentId];

      if (parent && Array.isArray(parent.folders)) {
        parent.folders = parent.folders.filter(i => i !== id);
      }

      Persistence.saveProjectDelay();
    },

    /**
     * Deletes a request.
     *
     * @param state The project object.
     * @param action The payload:
     *  - id: the id of the request.
     *  - parentId: the id of the containing folder.
     */
    deleteRequest(state, action: PayloadAction<{id: string, parentId: string}>) {
      const {id, parentId} = action.payload;
      delete state.requests[id];

      const folder = state.folders?.[parentId];

      if (Array.isArray(folder.requests)) {
        folder.requests = folder.requests.filter(requestId => requestId !== id);
      }

      Persistence.saveProjectDelay();
    },

    /**
     * Duplicates a request.
     *
     * @param state The project object.
     * @param action The the payload contains the id of the request and the id of its parent folder.
     */
    duplicateRequest(state, action: PayloadAction<{id: string, parentId: string}>) {
      const {id, parentId} = action.payload;
      const folder = state.folders?.[parentId];
      const request = state.requests?.[id];

      if (!folder || !request || !folder.requests) {
        return;
      }

      const newId = nanoid();
      state.requests[newId] = JSON.parse(JSON.stringify(request));
      folder.requests.push(newId);

      Persistence.saveProjectDelay();
    },

    /**
     * Adds a new folder to the project.
     *
     * @param state The project object.
     * @param action The payload has the following:
     * - name: Name of the new folder
     * - parentId: The id of the parent folder to which the new folder is added.
     */
    newFolder(state, action: PayloadAction<{name: string, parentId: string}>) {
      const {name, parentId} = action.payload;

      if (!state.folders || !state.folders[parentId]) {
        return;
      }

      const parent = state.folders[parentId];
      const newId = nanoid();

      state.folders[newId] = {
        name: name
      };

      if (!Array.isArray(parent.folders)) {
        parent.folders = [];
      }

      parent.folders.push(newId);

      Persistence.saveProjectDelay();
    },

    /**
     * Adds a new environment group to the project.
     *
     * @param state The project object.
     * @param action Contains new group name and parent id.
     */
    newEnvGroup(state, action: PayloadAction<{name: string, parentId?: string}>) {
      let {name, parentId} = action.payload;

      // Create the root environment if not exist.
      if (!state.envs) {
        const envRoot = nanoid();
        state.envs = {};
        state.envs[envRoot] = {name: ''}
        state.envRoot = envRoot;
      }

      // If parent id is undefined, then use the id of the root environment.
      if (!parentId) {
        parentId = state.envRoot;
      }

      // Get the parent environment.
      let env = state.envs[parentId];

      // Make sure the parent environment exists.
      if (!env) {
        return;
      }

      // Create env group structure if not exist.
      if (!state.envGroups) {
        state.envGroups = {};
      }

      // Create the new env group.
      const groupId = nanoid();
      state.envGroups[groupId] = {name: name};

      // Add the new group the the parent env.
      if (!Array.isArray(env.envGroups)) {
        env.envGroups = [];
      }

      env.envGroups.push(groupId);

      Persistence.saveProjectDelay();
    },

    /**
     * Adds a new environment to the project.
     *
     * @param state The project object.
     * @param action The payload contains parameters for the new environment.
     */
    newEnv(state, action: PayloadAction<{id: string, name: string, parentId?: string}>) {
      const {id, name, parentId} = action.payload;
      const parent = state.envGroups?.[parentId];

      if (!parent || !name || !state.envs) {
        return;
      }

      state.envs[id] = {name}

      if (!parent.envs) {
        parent.envs = [];
      }

      parent.envs.push(id);

      Persistence.saveProjectDelay();
    },

    /**
     * Updates an environment variable name.
     *
     * @param state The project object.
     * @param action The payload contains the environment id, variable index, and the updated
     * value.
     */
    updateVarName(state, action: PayloadAction<{id: string, index: number, value: string}>) {
      const {id, index, value} = action.payload;
      const v = state.envs?.[id]?.vars?.[index];
      if (v) {
        v.name = value;
      }

      Persistence.saveProjectDelay();
    },

    /**
     * Updates an environment variable value.
     *
     * @param state The project object.
     * @param action The payload contains the environment id, variable index, and the updated
     * value.
     */
    updateVarValue(state, action: PayloadAction<{id: string, index: number, value: string}>) {
      const {id, index, value} = action.payload;
      const v = state.envs?.[id]?.vars?.[index];
      if (v) {
        v.value = value;
      }

      Persistence.saveProjectDelay();
    },

    /**
     * Adds a new empty environment variable.
     *
     * @param state The project object.
     * @param action The payload contains the environment id.
     */
    addEmptyVar(state, action: PayloadAction<string>) {
      const id = action.payload;
      const env = state.envs?.[id];

      if (env) {
        if (!Array.isArray(env.vars)) {
          env.vars = [];
        }

        env.vars.push({name: '', value: ''});
      }

      Persistence.saveProjectDelay();
    },

    /**
     * Updates an environment variable.
     *
     * @param state The project object.
     * @param action The payload contains the environment id, variable index.
     */
    deleteVar(state, action: PayloadAction<{id: string, index: number}>) {
      const {id, index} = action.payload;
      const env = state.envs?.[id];
      const vars = env?.vars;

      if (!Array.isArray(vars) || vars.length == 1) {
        delete env.vars;
      }
      else if (index >= 0 && index < vars.length) {
        vars.splice(index, 1);
      }

      Persistence.saveProjectDelay();
    },

    /**
     * Deletes an environment group.
     *
     * @param state The project object.
     * @param action The payload contains the group id and parent env id.
     */
    deleteEnvGroup(state, action: PayloadAction<{id: string, parentId: string}>) {
      const {id, parentId} = action.payload;
      const ids = getDescendantEnvIds(state, id, 'envGroup');

      for (const id of ids) {
        delete state.envs?.[id];
        delete state.envGroups?.[id];
      }

      const parent = state.envs?.[parentId];
      const index = parent?.envGroups?.findIndex(gid => gid === id);

      if (parent && index !== -1) {
        state.envs[parentId].envGroups.splice(index, 1);
      }

      Persistence.saveProjectDelay();
    },

    /**
     * Deletes an environment.
     *
     * @param state The project object.
     * @param action The payload contains the group id and parent env id.
     */
    deleteEnv(state, action: PayloadAction<{id: string, parentId: string}>) {
      const {id, parentId} = action.payload;
      const ids = getDescendantEnvIds(state, id, 'env');

      for (const id of ids) {
        delete state.envs?.[id];
        delete state.envGroups?.[id];
      }

      const parent = state.envGroups?.[parentId];
      const index = parent?.envs?.findIndex(eid => eid === id);

      if (parent && index !== -1) {
        parent.envs.splice(index, 1);
      }

      Persistence.saveProjectDelay();
    },

    /**
     * Duplicates an environment.
     *
     * @param state The project object.
     * @param action The the payload contains the id of the env and the id of its parent folder.
     */
    duplicateEnv(state, action: PayloadAction<{id: string, parentId: string}>) {
      const {id, parentId} = action.payload;
      const group = state.envGroups?.[parentId];
      const env = state.envs?.[id];

      if (!group || !env || !group.envs) {
        return;
      }

      const newId = nanoid();

      state.envs[newId] = JSON.parse(JSON.stringify(env));
      group.envs.push(newId);

      Persistence.saveProjectDelay();
    },

    /**
     * Renames a resource.
     *
     * @param state The project model draft.
     * @param action The payload contains the type and id of the resource and the new name.
     */
    renameResource(state, action: PayloadAction<{id: string, type: string, name: string}>) {
      const {id, type, name} = action.payload;
      const res = {
        folder:   state.folders?.[id],
        request:  state.requests?.[id],
        envGroup: state.envGroups?.[id],
        env:      state.envs?.[id],
      }[type];

      if (!res || !name) {
        return;
      }

      res.name = name;

      Persistence.saveProjectDelay();
    },
  },
});

export default projectSlice.reducer
