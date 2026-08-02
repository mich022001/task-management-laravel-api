import { Link } from 'react-router-dom';

export default function Forbidden() {
    return (
        <main className="route-message">
            <h1>403</h1>
            <p>You do not have permission to view this page.</p>
            <Link to="/dashboard">Return to dashboard</Link>
        </main>
    );
}
