import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiRequest } from '../../utils/api';

export const fetchPerformances = createAsyncThunk(
  'performance/fetchAll',
  async (employeeId = null, { rejectWithValue }) => {
    try {
      const endpoint = employeeId ? `/performance?employeeId=${employeeId}` : '/performance';
      const data = await apiRequest(endpoint, { method: 'GET' });
      return data.performances;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createPerformance = createAsyncThunk(
  'performance/create',
  async ({ employeeId, performanceData }, { rejectWithValue }) => {
    try {
      const data = await apiRequest(`/performance/${employeeId}`, {
        method: 'POST',
        body: JSON.stringify(performanceData)
      });
      return data.performance;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  list: [],
  loading: false,
  error: null,
  success: false
};

const performanceSlice = createSlice({
  name: 'performance',
  initialState,
  reducers: {
    clearPerformanceStatus: (state) => {
      state.error = null;
      state.success = false;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Performances
      .addCase(fetchPerformances.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPerformances.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchPerformances.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create Performance
      .addCase(createPerformance.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createPerformance.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.list.unshift(action.payload);
      })
      .addCase(createPerformance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      });
  }
});

export const { clearPerformanceStatus } = performanceSlice.actions;
export default performanceSlice.reducer;
