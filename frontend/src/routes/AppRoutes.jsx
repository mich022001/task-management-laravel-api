import { Navigate, Route, Routes } from 'react-router-dom';

import AppLayout from '../components/layout/AppLayout.jsx';
import Analytics from '../pages/Analytics.jsx';
import CreateTask from '../pages/CreateTask.jsx';
import CreateTeam from '../pages/CreateTeam.jsx';
import CreateUser from '../pages/CreateUser.jsx';
import Dashboard from '../pages/Dashboard.jsx';
import EditTask from '../pages/EditTask.jsx';
<<<<<<< HEAD
=======
import EditTeam from '../pages/EditTeam.jsx';
>>>>>>> db23007 (feat(users): implement user management screens)
import EditUser from '../pages/EditUser.jsx';
import Forbidden from '../pages/Forbidden.jsx';
import ForgotPassword from '../pages/ForgotPassword.jsx';
import Login from '../pages/Login.jsx';
import ResetPassword from '../pages/ResetPassword.jsx';
import NotFound from '../pages/NotFound.jsx';
import TaskDetails from '../pages/TaskDetails.jsx';
import Tasks from '../pages/Tasks.jsx';
import TeamDetails from '../pages/TeamDetails.jsx';
import Teams from '../pages/Teams.jsx';
import Users from '../pages/Users.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';
import RoleRoute from './RoleRoute.jsx';

export default function AppRoutes() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                    <Route
                        index
                        element={<Navigate to="/dashboard" replace />}
                    />

                    <Route path="/dashboard" element={<Dashboard />} />

                    <Route path="/tasks" element={<Tasks />} />

                    <Route path="/tasks/:taskId" element={<TaskDetails />} />

                    <Route
                        element={
                            <RoleRoute allowedRoles={['admin', 'manager']} />
                        }
                    >
                        <Route path="/tasks/create" element={<CreateTask />} />

                        <Route
                            path="/tasks/:taskId/edit"
                            element={<EditTask />}
                        />

                        <Route path="/teams" element={<Teams />} />
                        <Route path="/teams/create" element={<CreateTeam />} />
                        <Route
                            path="/teams/:teamId"
                            element={<TeamDetails />}
                        />
<<<<<<< HEAD
=======
                        <Route
                            path="/teams/:teamId/edit"
                            element={<EditTeam />}
                        />
>>>>>>> db23007 (feat(users): implement user management screens)

                        <Route path="/analytics" element={<Analytics />} />
                    </Route>

                    <Route element={<RoleRoute allowedRoles={['admin']} />}>
                        <Route path="/users" element={<Users />} />
                        <Route path="/users/create" element={<CreateUser />} />
                        <Route
                            path="/users/:userId/edit"
                            element={<EditUser />}
                        />
                    </Route>
                </Route>
            </Route>

            <Route path="/forbidden" element={<Forbidden />} />
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
}
