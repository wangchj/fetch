import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import { Project } from 'types/project';

const initialState: Project = {
  name: '',
  items: []
};

export const projectSlice = createSlice({
  name: 'project',
  initialState,
  reducers: {
    setProject(state, action: PayloadAction<Project>) {
      return action.payload;
    }
  },
});

// Action creators are generated for each case reducer function
export const { setProject } = projectSlice.actions
export default projectSlice.reducer