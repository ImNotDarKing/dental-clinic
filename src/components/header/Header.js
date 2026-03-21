import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./style.css";

const Header = () => {
    const navigate = useNavigate();
    const [isDoctor, setIsDoctor] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            try {
                const decoded = JSON.parse(atob(token.split('.')[1]));
                setIsDoctor(decoded.role === 2);
            } catch (e) {
                setIsDoctor(false);
            }
        }
    }, []);

    const handleAppointmentClick = () => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/auth");
        } else if (isDoctor) {
            navigate("/profile"); 
        } else {
            navigate("/dantists");
        }
    };

    return (
        <header className="header">
            <div className="header__wrapper">
                <h1 className="header__title">
                    <strong>
                        {isDoctor ? "Добро пожаловать, врач" : "Добро пожаловать в"} <em>Dental Clinic</em>
                    </strong>
                    <br />
                    {isDoctor ? "Управляйте записями пациентов" : "Забота о вашем здоровье и улыбке"}
                </h1>
                <div className="header__text">
                    <p>
                        {isDoctor 
                            ? "Просмотрите и управляйте всеми приёмами пациентов"
                            : "Профессиональные стоматологические услуги, индивидуальный подход к каждому пациенту."
                        }
                    </p>
                </div>
                <button className="btn" onClick={handleAppointmentClick}>
                    {isDoctor ? "Мои пациенты" : "Записаться на приём"}
                </button>
            </div>
        </header>
    );
};

export default Header;