import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../api/config";
import defaultDoctor from "../img/default-doctor.svg";
import "../styles/profile.css";

const Profile = () => {
    const navigate = useNavigate();
    const [userRole, setUserRole] = useState(null);
    const [profileData, setProfileData] = useState(null);
    const [appointments, setAppointments] = useState([]);
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({});
    const [photoFile, setPhotoFile] = useState(null); 

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/auth");
            return;
        }

        const decoded = parseJwt(token);
        setUserRole(decoded.role);
        loadProfileData(decoded.role);
    }, [navigate]);

    const parseJwt = (token) => {
        try {
            return JSON.parse(atob(token.split('.')[1]));
        } catch (e) {
            return null;
        }
    };

    const loadProfileData = async (role) => {
        const token = localStorage.getItem("token");

        try {
            const profileRes = await fetch(`${API_BASE_URL}/profile`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const profile = await profileRes.json();
            console.log("Загруженный профиль:", profile); 
            setProfileData(profile);
            setFormData(profile || {});

            const appointmentsRes = await fetch(
                `${API_BASE_URL}/appointments?role=${role}`,
                { headers: { "Authorization": `Bearer ${token}` } }
            );
            const apps = await appointmentsRes.json();
            setAppointments(apps);
        } catch (err) {
            console.error("Ошибка загрузки профиля:", err);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];

        if (file && !file.type.startsWith('image/')) {
            alert("Пожалуйста, загрузите изображение (JPG, PNG и т.д.)");
            return;
        }

        if (file && file.size > 5 * 1024 * 1024) {
            alert("Размер файла не должен превышать 5MB");
            return;
        }

        setPhotoFile(file);
    };

    const handleSave = async () => {
        const token = localStorage.getItem("token");

        try {
            let photoUrl = formData.photo_url; 

            if (photoFile) {
                const formDataWithPhoto = new FormData();
                formDataWithPhoto.append('photo', photoFile);

                const uploadRes = await fetch(`${API_BASE_URL}/upload-photo`, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${token}`
                    },
                    body: formDataWithPhoto
                });

                if (uploadRes.ok) {
                    const uploadData = await uploadRes.json();
                    console.log("Ответ от upload-photo:", uploadData); 
                    photoUrl = uploadData.photo_url;
                } else {
                    alert("Ошибка загрузки фото");
                    return;
                }
            }

            const response = await fetch(`${API_BASE_URL}/profile`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...formData,
                    photo_url: photoUrl
                })
            });

            if (response.ok) {
                alert("Профиль обновлён");
                setEditing(false);
                setPhotoFile(null);
                setProfileData({ ...formData, photo_url: photoUrl });
                setFormData({ ...formData, photo_url: photoUrl });
            }
        } catch (err) {
            console.error("Ошибка сохранения профиля:", err);
        }
    };

    const handleDeleteAppointment = async (appointmentId) => {
        if (!window.confirm("Вы уверены, что хотите удалить эту запись?")) return;

        const token = localStorage.getItem("token");

        try {
            const response = await fetch(`${API_BASE_URL}/appointment/${appointmentId}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (response.ok) {
                alert("Запись удалена");
                setAppointments(appointments.filter(a => a.appointment_id !== appointmentId));
            }
        } catch (err) {
            console.error("Ошибка удаления:", err);
        }
    };

    if (!profileData) return <div>Загрузка...</div>;

    return (
        <main className="profile-section">
            <div className="container">
                <h1 className="title-1">Мой профиль</h1>

                <div className="profile-container">
                    <div className="profile-card">
                        <h2>{userRole === 1 ? "Данные пациента" : "Данные врача"}</h2>

                        {editing ? (
                            <div className="profile-form">
                                {userRole === 1 ? (
                                    <>
                                        <div className="form-group">
                                            <label>Имя</label>
                                            <input
                                                type="text"
                                                name="first_name"
                                                value={formData.first_name || ""}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Фамилия</label>
                                            <input
                                                type="text"
                                                name="last_name"
                                                value={formData.last_name || ""}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Телефон</label>
                                            <input
                                                type="tel"
                                                name="phone_number"
                                                value={formData.phone_number || ""}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Адрес</label>
                                            <input
                                                type="text"
                                                name="address"
                                                value={formData.address || ""}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="form-group">
                                            <label>Имя</label>
                                            <input
                                                type="text"
                                                name="first_name"
                                                value={formData.first_name || ""}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Фамилия</label>
                                            <input
                                                type="text"
                                                name="last_name"
                                                value={formData.last_name || ""}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Специализация</label>
                                            <input
                                                type="text"
                                                name="specialization"
                                                value={formData.specialization || ""}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Опыт (лет)</label>
                                            <input
                                                type="number"
                                                name="experience_years"
                                                value={formData.experience_years || ""}
                                                onChange={handleChange}
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label>Фото профиля</label>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handlePhotoChange}
                                            />
                                            {photoFile && (
                                                <p className="file-name">Выбран файл: {photoFile.name}</p>
                                            )}
                                            {profileData.photo_url && !photoFile && (
                                                <div className="current-photo">
                                                    <p>Текущее фото:</p>
                                                    <img 
                                                        src={`${API_BASE_URL}${profileData.photo_url}`}
                                                        alt="Фото профиля" 
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}

                                <button className="btn" onClick={handleSave}>Сохранить</button>
                                <button className="btn btn-cancel" onClick={() => {
                                    setEditing(false);
                                    setPhotoFile(null);
                                }}>Отмена</button>
                            </div>
                        ) : (
                            <div className="profile-info">
                                <p><strong>Имя:</strong> {profileData.first_name || "—"}</p>
                                <p><strong>Фамилия:</strong> {profileData.last_name || "—"}</p>
                                {userRole === 1 ? (
                                    <>
                                        <p><strong>Телефон:</strong> {profileData.phone_number || "—"}</p>
                                        <p><strong>Адрес:</strong> {profileData.address || "—"}</p>
                                    </>
                                ) : (
                                    <>
                                        <p><strong>Специализация:</strong> {profileData.specialization || "—"}</p>
                                        <p><strong>Опыт:</strong> {profileData.experience_years || "—"} лет</p>
                                    {profileData.photo_url && (
                                        <div className="doctor-photo-display">
                                            <img 
                                                src={`${API_BASE_URL}${profileData.photo_url}`}
                                                alt="Фото врача" 
                                            />
                                        </div>
                                    )}
                                    {!profileData.photo_url && (
                                        <div className="doctor-photo-display">
                                            <img 
                                                src={defaultDoctor}
                                                alt="Фото врача отсутствует" 
                                            />
                                        </div>
                                    )}
                                    </>
                                )}
                                <button className="btn" onClick={() => setEditing(true)}>Редактировать</button>
                            </div>
                        )}
                    </div>

                    <div className="appointments-card">
                        <h2>{userRole === 1 ? "Мои записи на приём" : "Записи пациентов ко мне"}</h2>
                        {appointments.length > 0 ? (
                            <table className="appointments-table">
                                <thead>
                                    <tr>
                                        <th>{userRole === 1 ? "Врач" : "Пациент"}</th>
                                        <th>Дата и время</th>
                                        <th>Услуга</th>
                                        {userRole === 1 && <th>Действие</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {appointments.map((apt) => (
                                        <tr key={apt.appointment_id}>
                                            <td>{apt.doctor_name || apt.patient_name}</td>
                                            <td>{new Date(apt.appointment_date).toLocaleString()}</td>
                                            <td>{apt.service_type}</td>
                                            {userRole === 1 && (
                                                <td>
                                                    <button
                                                        className="btn-delete"
                                                        onClick={() => handleDeleteAppointment(apt.appointment_id)}
                                                    >
                                                        Удалить
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p>Нет записей</p>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
};

export default Profile;