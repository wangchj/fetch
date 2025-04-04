import {
  Button,
  Modal,
  Select,
  Stack,
  TextInput,
  Title,
} from "@mantine/core";
import { Dispatch, UnknownAction } from "@reduxjs/toolkit";
import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { projectSlice } from "renderer/redux/project-slice";
import { RootState, store } from "renderer/redux/store";
import { workspaceSlice } from "renderer/redux/workspace-slice";
import * as Persistence from "renderer/utils/persistence";
import { OpenedResource } from "types/opened-resource";
import { Project } from "types/project";
import { Workspace } from "types/workspace";

let dispatch: Dispatch<UnknownAction>;
let workspace: Workspace
let project: Project;
let openedResource: OpenedResource;
let opened: boolean, setOpened: React.Dispatch<React.SetStateAction<boolean>>;
let name: string, setName: React.Dispatch<React.SetStateAction<string>>;
let folder: string, setFolder: React.Dispatch<React.SetStateAction<string>>;
let folderMap: Record<string, string>;
let folderKeys: string[];

/**
 * Makes folder keys from tree rooted at folder.
 *
 * @param folder The id of the root folder from which to get folder keys
 * @param path The folder path.
 * @returns An object where the key is the folder key and value is the folder object.
 */
function makeFolderMap(project: Project, folderId: string, path: string): Record<string, string> {
  if (!project || !folderId) {
    return {};
  }

  let res = {} as Record<string, string>;
  let folder = project?.folders?.[folderId];
  let name = folder?.name ?? ''
  let key = path === '/' ?  `${path}${name}` : `${path}/${name}`;

  if (folder) {
    res[key] = folderId;
  }

  if (Array.isArray(folder?.folders) && folder.folders.length > 0) {
    const sub = folder
      .folders
      .map(id => makeFolderMap(
        project,
        id,
        `${key}`
      ))
      .reduce((a, c) => ({...a, ...c}), {});

    res = {...res, ...sub};
  }

  return res;
}

/**
 * Handles Save button click event.
 */
async function onSaveClick() {
  try {
    const folderId = folderMap[folder];
    const resource = {...openedResource};
    const props = {...openedResource.props};
    const request = {...openedResource.props.request};

    if (name) {
      request.name = name;
    }

    props.folderId = folderId;
    resource.dirty = false;

    props.request = request;
    resource.props = props;


    dispatch(projectSlice.actions.addNewRequest({
      id: resource.id,
      request: resource.props.request,
      folderId
    }));

    await Persistence.saveProject();
    dispatch(workspaceSlice.actions.setResource(resource));
    await Persistence.saveWorkspace();
    setOpened(false);
  }
  catch (error) {
    console.log("Error saving project", error);
  }
}

/**
 * Opens the modal.
 *
 * @param _openedResource The OpenedResource object to save.
 */
export function openSaveRequestModal(_openedResource: OpenedResource) {
  openedResource = _openedResource;
  setName(openedResource?.props?.request?.name ?? '');
  setOpened(true);
}

export function SaveRequestModal() {
  dispatch = useDispatch();
  workspace = useSelector((state: RootState) => state.workspace);
  project = useSelector((state: RootState) => state.project);

  [opened, setOpened] = useState<boolean>(false);
  [name, setName] = useState<string>(openedResource?.props?.request?.name ?? '');
  [folder, setFolder] = useState<string>('/');

  folderMap = useMemo(() => makeFolderMap(project, project.tree, ''), [project.tree]);
  folderKeys = Object.keys(folderMap);

  return (
    <Modal
      opened={opened}
      title={<Title order={3}>Save Request</Title>}
      onClose={() => setOpened(false)}
      centered
      onKeyDown={event => event.key === 'Enter' ? onSaveClick() : null}
    >
      <Stack>
        <TextInput
          label="Name (optional)"
          value={name}
          onChange={event => setName(event.currentTarget.value)}
          data-autofocus
        />

        <Select
          label="Folder"
          value={folder}
          onChange={value => setFolder(value)}
          data={folderKeys}
          allowDeselect={false}
          withCheckIcon={false}
        />

        <Button onClick={onSaveClick}>Save</Button>
      </Stack>
    </Modal>
  )
}
