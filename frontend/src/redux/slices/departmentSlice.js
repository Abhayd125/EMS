import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiRequest } from '../../utils/api';

export const fetchDepartments = createAsyncThunk(
  'departments/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const data = await apiRequest('/departments');
      return data.departments;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createDepartment = createAsyncThunk(
  'departments/create',
  async (deptData, { rejectWithValue }) => {
    try {
      const data = await apiRequest('/departments', {
        method: 'POST',
        body: JSON.stringify(deptData)
      });
      return data.department;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateDepartment = createAsyncThunk(
  'departments/update',
  async ({ id, deptData }, { rejectWithValue }) => {
    try {
      const data = await apiRequest(`/departments/${id}`, {
        method: 'PUT',
        body: JSON.stringify(deptData)
      });
      return data.department;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteDepartment = createAsyncThunk(
  'departments/delete',
  async (id, { rejectWithValue }) => {
    try {
      await apiRequest(`/departments/${id}`, { method: 'DELETE' });
      return id;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const departmentSlice = createSlice({
  name: 'departments',
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
      .addCase(fetchDepartments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDepartments.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchDepartments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createDepartment.fulfilled, (state, action) => {
        state.success = true;
        state.list.push(action.payload);
      })
      .addCase(createDepartment.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(updateDepartment.fulfilled, (state, action) => {
        state.success = true;
        const index = state.list.findIndex(d => d.id === action.payload.id);
        if (index !== -1) {
          state.list[index] = { ...state.list[index], ...action.payload };
        }
      })
      .addCase(updateDepartment.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(deleteDepartment.fulfilled, (state, action) => {
        state.list = state.list.filter(d => d.id !== action.payload);
      })
      .addCase(deleteDepartment.rejected, (state, action) => {
        state.error = action.payload;
      });
  }
});

export const { resetStatus } = departmentSlice.actions;
export default departmentSlice.reducer;
