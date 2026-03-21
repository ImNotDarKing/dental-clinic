import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/admin.css";

const Admin = () => {
    const navigate = useNavigate();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [loginData, setLoginData] = useState({ email: "", password: "" });
    const [message, setMessage] = useState({ text: "", type: "" });
    
    const [doctors, setDoctors] = useState([]);
    const [users, setUsers] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [activeTab, setActiveTab] = useState("doctors");

    useEffect(() => {
        const adminToken = localStorage.getItem("adminToken");
        if (adminToken) {
            setIsLoggedIn(true);
            loadData();
        }
    }, []);

    const loadData = async () => {
        try {
            const doctorsRes = await fetch("http://localhost:5000/admin/doctors");
            const doctorsData = await doctorsRes.json();
            setDoctors(doctorsData);

            const usersRes = await fetch("http://localhost:5000/admin/users");
            const usersData = await usersRes.json();
            setUsers(usersData);

            const appointmentsRes = await fetch("http://localhost:5000/admin/appointments");
            const appointmentsData = await appointmentsRes.json();
            setAppointments(appointmentsData);
        } catch (err) {
            console.error("Ошибка загрузки данных:", err);
        }
    };

    const handleLoginChange = (e) => {
        const { name, value } = e.target;
        setLoginData({ ...loginData, [name]: value });
    };

    const handleAdminLogin = async (e) => {
        e.preventDefault();
        setMessage({ text: "", type: "" });

        try {
            const response = await fetch("http://localhost:5000/admin/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(loginData)
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem("adminToken", data.token);
                setIsLoggedIn(true);
                setLoginData({ email: "", password: "" });
                setMessage({ text: "Вход выполнен успешно!", type: "success" });
                loadData();
            } else {
                setMessage({ text: data.message || "Ошибка входа", type: "error" });
            }
        } catch (err) {
            setMessage({ text: "Ошибка подключения", type: "error" });
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("adminToken");
        setIsLoggedIn(false);
        setLoginData({ email: "", password: "" });
        setMessage({ text: "", type: "" });
        navigate("/");
    };

    const deleteDoctor = async (doctorId) => {
        if (!window.confirm("Вы уверены?")) return;

        try {
            const response = await fetch(`http://localhost:5000/admin/doctors/${doctorId}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${localStorage.getItem("adminToken")}` }
            });

            if (response.ok) {
                setDoctors(doctors.filter(d => d.doctor_id !== doctorId));
                setMessage({ text: "Врач удалён", type: "success" });
            } else {
                setMessage({ text: "Ошибка удаления", type: "error" });
            }
        } catch (err) {
            setMessage({ text: "Ошибка подключения", type: "error" });
        }
    };

    const deleteUser = async (userId) => {
        if (!window.confirm("Вы уверены?")) return;

        try {
            const response = await fetch(`http://localhost:5000/admin/users/${userId}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${localStorage.getItem("adminToken")}` }
            });

            if (response.ok) {
                setUsers(users.filter(u => u.user_id !== userId));
                setMessage({ text: "Пользователь удалён", type: "success" });
            } else {
                setMessage({ text: "Ошибка удаления", type: "error" });
            }
        } catch (err) {
            setMessage({ text: "Ошибка подключения", type: "error" });
        }
    };

    const deleteAppointment = async (appointmentId) => {
        if (!window.confirm("Вы уверены?")) return;

        try {
            const response = await fetch(`http://localhost:5000/admin/appointments/${appointmentId}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${localStorage.getItem("adminToken")}` }
            });

            if (response.ok) {
                setAppointments(appointments.filter(a => a.appointment_id !== appointmentId));
                setMessage({ text: "Запись удалена", type: "success" });
            } else {
                setMessage({ text: "Ошибка удаления", type: "error" });
            }
        } catch (err) {
            setMessage({ text: "Ошибка подключения", type: "error" });
        }
    };

    if (!isLoggedIn) {
        return (
            <main className="admin-login">
                <div className="admin-login-container">
                    <h1>Админ Панель</h1>
                    
                    {message.text && (
                        <div className={`message ${message.type}`}>{message.text}</div>
                    )}

                    <form onSubmit={handleAdminLogin}>
                        <div className="form-group">
                            <label>Email</label>
                            <input
                                type="email"
                                name="email"
                                value={loginData.email}
                                onChange={handleLoginChange}
                                // placeholder="admin@example.com"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Пароль</label>
                            <input
                                type="password"
                                name="password"
                                value={loginData.password}
                                onChange={handleLoginChange}
                                // placeholder="123456"
                                required
                            />
                        </div>

                        <button type="submit" className="btn-login">Вход</button>
                    </form>

                </div>
            </main>
        );
    }

    return (
        <main className="admin-panel">
            <div className="admin-container">
                <div className="admin-header">
                    <h1>Админ Панель</h1>
                    <button className="btn-logout" onClick={handleLogout}>Выход</button>
                </div>

                {message.text && (
                    <div className={`message ${message.type}`}>{message.text}</div>
                )}

                <div className="admin-tabs">
                    <button
                        className={`tab-btn ${activeTab === "doctors" ? "active" : ""}`}
                        onClick={() => setActiveTab("doctors")}
                    >
                        Врачи ({doctors.length})
                    </button>
                    <button
                        className={`tab-btn ${activeTab === "users" ? "active" : ""}`}
                        onClick={() => setActiveTab("users")}
                    >
                        Пользователи ({users.length})
                    </button>
                    <button
                        className={`tab-btn ${activeTab === "appointments" ? "active" : ""}`}
                        onClick={() => setActiveTab("appointments")}
                    >
                        Записи ({appointments.length})
                    </button>
                </div>

                {activeTab === "doctors" && (
                    <div className="admin-section">
                        <h2>Список врачей</h2>
                        <div className="table-wrapper">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Имя</th>
                                        <th>Фамилия</th>
                                        <th>Специальность</th>
                                        <th>Email</th>
                                        <th>Действие</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {doctors.map((doctor) => (
                                        <tr key={doctor.doctor_id}>
                                            <td>{doctor.doctor_id}</td>
                                            <td>{doctor.first_name}</td>
                                            <td>{doctor.last_name}</td>
                                            <td>{doctor.specialization}</td>
                                            <td>{doctor.email}</td>
                                            <td>
                                                <button
                                                    className="btn-delete"
                                                    onClick={() => deleteDoctor(doctor.doctor_id)}
                                                >
                                                    Удалить
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {doctors.length === 0 && <p className="empty">Нет врачей</p>}
                    </div>
                )}

                {activeTab === "users" && (
                    <div className="admin-section">
                        <h2>Список пользователей</h2>
                        <div className="table-wrapper">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Email</th>
                                        <th>Роль</th>
                                        <th>Действие</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user) => (
                                        <tr key={user.user_id}>
                                            <td>{user.user_id}</td>
                                            <td>{user.email}</td>
                                            <td>{user.role_id === 1 ? "Пациент" : "Врач"}</td>
                                            <td>
                                                <button
                                                    className="btn-delete"
                                                    onClick={() => deleteUser(user.user_id)}
                                                >
                                                    Удалить
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {users.length === 0 && <p className="empty">Нет пользователей</p>}
                    </div>
                )}

                {activeTab === "appointments" && (
                    <div className="admin-section">
                        <h2>Список записей на приём</h2>
                        <div className="table-wrapper">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Пациент</th>
                                        <th>Врач</th>
                                        <th>Дата</th>
                                        <th>Услуга</th>
                                        <th>Действие</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {appointments.map((appointment) => (
                                        <tr key={appointment.appointment_id}>
                                            <td>{appointment.appointment_id}</td>
                                            <td>{appointment.patient_name || "—"}</td>
                                            <td>{appointment.doctor_name || "—"}</td>
                                            <td>{new Date(appointment.appointment_date).toLocaleString("ru-RU")}</td>
                                            <td>{appointment.service_type}</td>
                                            <td>
                                                <button
                                                    className="btn-delete"
                                                    onClick={() => deleteAppointment(appointment.appointment_id)}
                                                >
                                                    Удалить
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {appointments.length === 0 && <p className="empty">Нет записей</p>}
                    </div>
                )}
            </div>
        </main>
    );
};

export default Admin;
