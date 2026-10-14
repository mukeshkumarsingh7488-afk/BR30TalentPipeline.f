import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";

import AuthLayout from "./layouts/AuthLayout.jsx";
import DashboardLayout from "./layouts/DashboardLayout.jsx";

import Login from "./pages/auth/Login.jsx";
import Register from "./pages/auth/Register.jsx";
import VerifyEmail from "./pages/auth/VerifyEmail.jsx";
import ForgotPassword from "./pages/auth/ForgotPassword.jsx";
import ResetPassword from "./pages/auth/ResetPassword.jsx";
import Dashboard from "./pages/dashboard/Dashboard.jsx";
import PublishForms from "./pages/applications/PublishForms.jsx";
import PublicApplicationForm from "./pages/applications/PublicApplicationForm.jsx";
import JobRoles from "./pages/job-roles/JobRoles.jsx";
import Departments from "./pages/departments/Departments.jsx";
import Candidates from "./pages/candidates/Candidates.jsx";
import CandidateDetails from "./pages/candidates/CandidateDetails.jsx";
import Applications from "./pages/applications/Applications.jsx";
import ApplicationDetails from "./pages/applications/ApplicationDetails.jsx";
import Interviews from "./pages/interviews/Interviews.jsx";
import Reports from "./pages/reports/Reports.jsx";
import Settings from "./pages/settings/Settings.jsx";
import SearchResults from "./pages/search/SearchResults.jsx";
import ActivityLog from "./pages/activity/ActivityLog.jsx";

import PublicRoute from "./routes/PublicRoute.jsx";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public application routes: no login required. Keep legacy links working. */}
        <Route path="/apply" element={<PublicApplicationForm />} />
        <Route path="/f/:publicId" element={<PublicApplicationForm />} />
        {/* Public authentication pages */}
        <Route element={<PublicRoute />}>
          <Route element={<AuthLayout />}>
            <Route path="/" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Route>
        </Route>

        {/* Protected application pages */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/job-roles" element={<JobRoles />} />
            <Route path="/candidates" element={<Candidates />} />
            <Route path="/candidates/:id" element={<CandidateDetails />} />
            <Route path="/applications" element={<Applications />} />
            <Route path="/applications/:id" element={<ApplicationDetails />} />
            <Route path="/departments" element={<Departments />} />
            <Route path="/interviews" element={<Interviews />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/publish-forms" element={<PublishForms />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/activity" element={<ActivityLog />} />
          </Route>
        </Route>

        {/* Unknown routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
