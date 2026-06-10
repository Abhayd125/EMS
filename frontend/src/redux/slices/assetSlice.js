import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiRequest } from '../../utils/api';

export const fetchAssets = createAsyncThunk(
  'assets/fetchAll',
  async (params = {}, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const data = await apiRequest(`/assets?${queryParams}`);
      return data; // returns { data, total, page, limit }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createAsset = createAsyncThunk(
  'assets/create',
  async (assetData, { rejectWithValue }) => {
    try {
      const data = await apiRequest('/assets', {
        method: 'POST',
        body: JSON.stringify(assetData)
      });
      return data.asset;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateAsset = createAsyncThunk(
  'assets/update',
  async ({ id, assetData }, { rejectWithValue }) => {
    try {
      const data = await apiRequest(`/assets/${id}`, {
        method: 'PUT',
        body: JSON.stringify(assetData)
      });
      return data.asset;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteAsset = createAsyncThunk(
  'assets/delete',
  async (id, { rejectWithValue }) => {
    try {
      await apiRequest(`/assets/${id}`, { method: 'DELETE' });
      return id;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const assignAsset = createAsyncThunk(
  'assets/assign',
  async ({ id, employeeId, notes }, { rejectWithValue }) => {
    try {
      const data = await apiRequest(`/assets/${id}/assign`, {
        method: 'POST',
        body: JSON.stringify({ employeeId, notes })
      });
      return data.assignment;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const returnAsset = createAsyncThunk(
  'assets/return',
  async ({ assignmentId, notes }, { rejectWithValue }) => {
    try {
      const data = await apiRequest(`/assets/assignment/${assignmentId}/return`, {
        method: 'POST',
        body: JSON.stringify({ notes })
      });
      return data.assignment;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const assetSlice = createSlice({
  name: 'assets',
  initialState: {
    list: [],
    total: 0,
    page: 1,
    limit: 10,
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
      // Fetch Assets
      .addCase(fetchAssets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAssets.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.data;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.limit = action.payload.limit;
      })
      .addCase(fetchAssets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create Asset
      .addCase(createAsset.fulfilled, (state, action) => {
        state.success = true;
        state.list.unshift(action.payload);
      })
      .addCase(createAsset.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Update Asset
      .addCase(updateAsset.fulfilled, (state, action) => {
        state.success = true;
        const index = state.list.findIndex(a => a.id === action.payload.id);
        if (index !== -1) {
          state.list[index] = { ...state.list[index], ...action.payload };
        }
      })
      .addCase(updateAsset.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Delete Asset
      .addCase(deleteAsset.fulfilled, (state, action) => {
        state.list = state.list.filter(a => a.id !== action.payload);
      })
      .addCase(deleteAsset.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Assign Asset & Return Asset (refresh state after action)
      .addCase(assignAsset.fulfilled, (state) => {
        state.success = true;
      })
      .addCase(assignAsset.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(returnAsset.fulfilled, (state) => {
        state.success = true;
      })
      .addCase(returnAsset.rejected, (state, action) => {
        state.error = action.payload;
      });
  }
});

export const { resetStatus } = assetSlice.actions;
export default assetSlice.reducer;
