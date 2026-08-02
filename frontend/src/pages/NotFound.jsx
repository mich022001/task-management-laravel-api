import { Link } from 'react-router-dom';

export default function NotFound() {
    return (
        <main className="route-message">
            <h1>404</h1>
            <p>The requested page could not be found.</p>
            <Link to="/dashboard">Return to dashboard</Link>
        </main>
    );
}
