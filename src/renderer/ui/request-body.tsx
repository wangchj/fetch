import { Box, Select, Stack } from "@mantine/core";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "renderer/redux/store";
import { workspaceSlice } from "renderer/redux/workspace-slice";
import Monaco from "./monaco";
import { Request } from "types/request";

export default function RequestBody() {
  const dispatch = useDispatch();
  const workspace = useSelector((state: RootState) => state.workspace);
  const openedResources = workspace.openedResources;
  const openedRequest = openedResources[workspace.selectedResourceIndex];
  const request = openedRequest.model as Request;

  return (
    <Stack style={{width: '100%', height: '100%'}}>
      <Box style={{flexGrow: 0, paddingBottom: '2px'}}>
        <Select
          placeholder="Pick value"
          data={['None', 'JSON']}
          size="xs"
        />
      </Box>

      <div style={{flexGrow: 1}}>
        <Monaco
          defaultLanguage="json"
          value={request.body ?? ''}
          onChange={
            value => dispatch(workspaceSlice.actions.updateResource({path: 'body', value}))
          }
          options={{
            minimap: {enabled: false},
            automaticLayout: true,
            wordWrap: 'on',
          }}
        />
      </div>
    </Stack>
  )
}
