import { Navigate, Route, Routes } from 'react-router-dom';

import AppLayout from '../components/layout/AppLayout.jsx';
import Analytics from '../pages/Analytics.jsx';
import Dashboard from '../pages/Dashboard.jsx';
import Forbidden from '../pages/Forbidden.jsx';
import Login from '../pages/Login.jsx';
import NotFound from '../pages/NotFound.jsx';
import Tasks from '../pages/Tasks.jsx';
import Teams from '../pages/Teams.jsx';
import Users from '../pages/Users.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';
import RoleRoute from './RoleRoute.jsx';

export default function AppRoutes() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />

            <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                    <Route
                        index
                        element={<Navigate to="/dashboard" replace />}
                    />

                    <Route path="/dashboard" element={<Dashboard />} />

                    <Route path="/tasks" element={<Tasks />} />

                    <Route
                        element={
                            <RoleRoute allowedRoles={['admin', 'manager']} />
                        }
                    >
                        <Route path="/teams" element={<Teams />} />

                        <Route path="/analytics" element={<Analytics />} />
                    </Route>

                    <Route element={<RoleRoute allowedRoles={['admin']} />}>
                        <Route path="/users" element={<Users />} />
                    </Route>
                </Route>
            </Route>

            <Route path="/forbidden" element={<Forbidden />} />
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
}
