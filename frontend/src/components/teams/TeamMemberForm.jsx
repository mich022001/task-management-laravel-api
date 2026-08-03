import { useState } from 'react';

export default function TeamMemberForm({
    eligibleUsers,
    isSubmitting,
    validationErrors = {},
    onSubmit,
}) {
    const [form, setForm] = useState({
        user_id: '',
        member_role: 'member',
    });

    function handleChange(event) {
        const { name, value } = event.target;

        setForm((currentForm) => {
            if (name === 'user_id') {
                const selectedUser = eligibleUsers.find(
                    (user) => user.id === value,
                );

                return {
                    ...currentForm,
                    user_id: value,
                    member_role:
                        selectedUser?.role === 'manager'
                            ? currentForm.member_role
                            : 'member',
                };
            }

            return {
                ...currentForm,
                [name]: value,
            };
        });
    }

    function handleSubmit(event) {
        event.preventDefault();

        onSubmit(form);
    }

    const userErrors = validationErrors.user_id ?? [];
    const roleErrors = validationErrors.member_role ?? [];

    const selectedUser = eligibleUsers.find((user) => user.id === form.user_id);

    const canBeLead = selectedUser?.role === 'manager';

    return (
        <form className="task-form team-member-form" onSubmit={handleSubmit}>
            <div className="task-form-grid">
                <div className="form-field">
                    <label htmlFor="team-member-user">
                        User <span>*</span>
                    </label>

                    <select
                        id="team-member-user"
                        name="user_id"
                        value={form.user_id}
                        onChange={handleChange}
                        aria-invalid={userErrors.length > 0}
                        required
                    >
                        <option value="">Select an active user</option>

                        {eligibleUsers.map((user) => (
                            <option key={user.id} value={user.id}>
                                {user.name} — {user.email}
                            </option>
                        ))}
                    </select>

                    {userErrors.length > 0 ? (
                        <div className="form-field-errors">
                            {userErrors.map((message) => (
                                <p key={message}>{message}</p>
                            ))}
                        </div>
                    ) : null}
                </div>

                <div className="form-field">
                    <label htmlFor="team-member-role">
                        Team role <span>*</span>
                    </label>

                    <select
                        id="team-member-role"
                        name="member_role"
                        value={form.member_role}
                        onChange={handleChange}
                        aria-invalid={roleErrors.length > 0}
                        required
                    >
                        <option value="member">Member</option>

                        {canBeLead ? <option value="lead">Lead</option> : null}
                    </select>

                    {roleErrors.length > 0 ? (
                        <div className="form-field-errors">
                            {roleErrors.map((message) => (
                                <p key={message}>{message}</p>
                            ))}
                        </div>
                    ) : null}
                </div>
            </div>

            <div className="task-form-actions">
                <button
                    type="submit"
                    className="primary-button"
                    disabled={isSubmitting || eligibleUsers.length === 0}
                >
                    {isSubmitting ? 'Adding...' : 'Add member'}
                </button>
            </div>
        </form>
    );
}
