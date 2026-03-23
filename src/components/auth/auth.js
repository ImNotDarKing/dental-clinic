import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../../api/config";
import "./style.css";

const Auth = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("login");
    const [message, setMessage] = useState({ text: "", type: "" });

    const [loginData, setLoginData] = useState({
        email: "",
        password: ""
    });

    const [registerData, setRegisterData] = useState({
        email: "",
        password: "",
        role: ""
    });

    console.log("activeTab:", activeTab); 

    const handleLoginChange = (e) => {
        setLoginData({
            ...loginData,
            [e.target.name]: e.target.value
        });
    };

    const handleRegisterChange = (e) => {
        setRegisterData({
            ...registerData,
            [e.target.name]: e.target.value
        });
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setMessage({ text: "", type: "" });

        try {
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(loginData)
            });
            const data = await response.json();

            if (response.ok) {
                localStorage.setItem("token", data.token);
                setMessage({ text: "Вход выполнен успешно", type: "success" });
                window.dispatchEvent(new Event("authChange")); 
                navigate("/");
            } else {
                setMessage({ text: data.message, type: "error" });
            }
        } catch (err) {
            setMessage({ text: "Ошибка сети", type: "error" });
        }
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        setMessage({ text: "", type: "" });

        try {
            const response = await fetch(`${API_BASE_URL}/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(registerData)
            });
            const data = await response.json();

            if (response.ok) {
                setMessage({ text: "Регистрация успешна", type: "success" });
                setActiveTab("login");
            } else {
                setMessage({ text: data.message, type: "error" });
            }
        } catch (err) {
            setMessage({ text: "Ошибка сети", type: "error" });
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
                {message.text && (
                    <div className={`message ${message.type}`}>
                        {message.text}
                    </div>
                )}

                <div className="auth-tabs">
                    <div
                        className={`auth-tab ${activeTab === "login" ? "active" : ""}`}
                        onClick={() => setActiveTab("login")}
                    >
                        Вход
                    </div>
                    <div
                        className={`auth-tab ${activeTab === "register" ? "active" : ""}`}
                        onClick={() => setActiveTab("register")}
                    >
                        Регистрация
                    </div>
                </div>

                <form
                    className={`auth-form ${activeTab === "login" ? "active" : ""}`}
                    onSubmit={handleLoginSubmit}
                >
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            name="email"
                            value={loginData.email}
                            onChange={handleLoginChange}
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
                            required
                        />
                    </div>

                    <div className="form-group">
                        <button type="submit">Войти</button>
                    </div>
                </form>

                <form
                    className={`auth-form ${activeTab === "register" ? "active" : ""}`}
                    onSubmit={handleRegisterSubmit}
                >
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            name="email"
                            value={registerData.email}
                            onChange={handleRegisterChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Пароль</label>
                        <input
                            type="password"
                            name="password"
                            value={registerData.password}
                            onChange={handleRegisterChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Роль</label>
                        <select
                            name="role"
                            value={registerData.role}
                            onChange={handleRegisterChange}
                            required
                        >
                            <option value="">Выберите роль</option>
                            <option value="1">Пациент</option>
                            <option value="2">Врач</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <button type="submit">Зарегистрироваться</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Auth;