import { Navigate } from 'react-router-dom';

import { useAuthStore } from '~/stores/useAuthStore';
import { canAccessDashboardRoute, getDefaultDashboardPath } from '~/utils/dashboardPermissions';

export default function DashboardRouteGuard({ route, children }) {
    const user = useAuthStore((state) => state.user);
    const role = user?.role;

    if (!canAccessDashboardRoute(role, route)) {
        return <Navigate to={getDefaultDashboardPath(role)} replace />;
    }

    return children;
}
