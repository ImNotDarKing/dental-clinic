import { useState } from "react";
import "./style.css";

const AppointmentModal = ({ doctorId, doctorName, onClose }) => {
    const [formData, setFormData] = useState({
        appointment_date: "",
        service_type: ""
    });
    const [message, setMessage] = useState({ text: "", type: "" });

    const getMinDateTime = () => {
        const today = new Date();
        today.setHours(10, 0, 0, 0);
        
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const hours = String(today.getHours()).padStart(2, '0');
        const minutes = String(today.getMinutes()).padStart(2, '0');
        
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    const handleChange = (e) => {
        const value = e.target.value;
        const name = e.target.name;

        if (name === "appointment_date") {
            const date = new Date(value);
            const dayOfWeek = date.getDay();

            if (dayOfWeek === 0 || dayOfWeek === 6) {
                setMessage({ text: "Прием недоступен в выходные (Сб и Вс)", type: "error" });
                return;
            }

            const hours = date.getHours();
            if (hours < 10 || hours >= 20) {
                setMessage({ text: "Прием доступен только с 10:00 до 20:00", type: "error" });
                return;
            }
        }

        setFormData({
            ...formData,
            [name]: value
        });
        setMessage({ text: "", type: "" });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ text: "", type: "" });

        const token = localStorage.getItem("token");
        if (!token) {
            setMessage({ text: "Необходимо войти в систему", type: "error" });
            return;
        }

        try {
            const response = await fetch("http://localhost:5000/appointment", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    doctor_id: doctorId,
                    appointment_date: formData.appointment_date,
                    service_type: formData.service_type
                })
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({ text: "Запись успешно создана", type: "success" });
                setTimeout(onClose, 1500);
            } else {
                setMessage({ text: data.message, type: "error" });
            }
        } catch (err) {
            setMessage({ text: "Ошибка сети", type: "error" });
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>✕</button>
                
                <h2>Запись к {doctorName}</h2>
                <p className="modal-info">График: Пн-Пт, 10:00 - 20:00</p>

                {message.text && (
                    <div className={`message ${message.type}`}>{message.text}</div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Дата и время приёма</label>
                        <input
                            type="datetime-local"
                            name="appointment_date"
                            value={formData.appointment_date}
                            onChange={handleChange}
                            min={getMinDateTime()}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Тип услуги</label>
                        <select
                            name="service_type"
                            value={formData.service_type}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Выберите услугу</option>
                            <option value="Консультация">Консультация</option>
                            <option value="Лечение">Лечение</option>
                            <option value="Чистка">Чистка</option>
                            <option value="Имплантация">Имплантация</option>
                        </select>
                    </div>

                    <button type="submit" className="btn-submit">Записать</button>
                </form>
            </div>
        </div>
    );
};

export default AppointmentModal;