import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiRequest } from '../../utils/api';

export const fetchPayrolls = createAsyncThunk(
  'payroll/fetchAll',
  async (employeeId = null, { rejectWithValue }) => {
    try {
      const endpoint = employeeId ? `/payroll?employeeId=${employeeId}` : '/payroll';
      const data = await apiRequest(endpoint, { method: 'GET' });
      return data.payrolls;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updatePayroll = createAsyncThunk(
  'payroll/update',
  async ({ employeeId, payrollData }, { rejectWithValue }) => {
    try {
      const data = await apiRequest(`/payroll/${employeeId}`, {
        method: 'PUT',
        body: JSON.stringify(payrollData)
      });
      return data.payroll;
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

const payrollSlice = createSlice({
  name: 'payroll',
  initialState,
  reducers: {
    clearPayrollStatus: (state) => {
      state.error = null;
      state.success = false;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Payrolls
      .addCase(fetchPayrolls.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPayrolls.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchPayrolls.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update Payroll
      .addCase(updatePayroll.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updatePayroll.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        const index = state.list.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.list[index] = action.payload;
        } else {
          state.list.unshift(action.payload);
        }
      })
      .addCase(updatePayroll.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      });
  }
});

export const { clearPayrollStatus } = payrollSlice.actions;
export default payrollSlice.reducer;
