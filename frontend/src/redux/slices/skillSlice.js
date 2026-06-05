import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiRequest } from '../../utils/api';

export const fetchSkills = createAsyncThunk(
  'skills/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const data = await apiRequest('/skills');
      return data.skills;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createSkill = createAsyncThunk(
  'skills/create',
  async (skillData, { rejectWithValue }) => {
    try {
      const data = await apiRequest('/skills', {
        method: 'POST',
        body: JSON.stringify(skillData)
      });
      return data.skill;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateSkill = createAsyncThunk(
  'skills/update',
  async ({ id, skillData }, { rejectWithValue }) => {
    try {
      const data = await apiRequest(`/skills/${id}`, {
        method: 'PUT',
        body: JSON.stringify(skillData)
      });
      return data.skill;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteSkill = createAsyncThunk(
  'skills/delete',
  async (id, { rejectWithValue }) => {
    try {
      await apiRequest(`/skills/${id}`, { method: 'DELETE' });
      return id;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const skillSlice = createSlice({
  name: 'skills',
  initialState: {
    list: [],
    loading: false,
    error: null,
    success: false
  },
  reducers: {
    resetStatus: (state) => {
      state.success = false;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSkills.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSkills.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchSkills.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createSkill.fulfilled, (state, action) => {
        state.success = true;
        state.list.push(action.payload);
      })
      .addCase(createSkill.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(updateSkill.fulfilled, (state, action) => {
        state.success = true;
        const index = state.list.findIndex(s => s.id === action.payload.id);
        if (index !== -1) {
          state.list[index] = { ...state.list[index], ...action.payload };
        }
      })
      .addCase(updateSkill.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(deleteSkill.fulfilled, (state, action) => {
        state.list = state.list.filter(s => s.id !== action.payload);
      })
      .addCase(deleteSkill.rejected, (state, action) => {
        state.error = action.payload;
      });
  }
});

export const { resetStatus } = skillSlice.actions;
export default skillSlice.reducer;
