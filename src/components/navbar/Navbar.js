import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react"; 
import tooth from "./../../img/icons/zuby_r0h6xqeujxx4.svg";
import userProfile from "./../../img/icons/userProfile.svg";

import "./style.css";

const Navbar = () => {
    const location = useLocation(); 
    const navigate = useNavigate();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false); 
    const [isDoctor, setIsDoctor] = useState(false); 

    useEffect(() => {
        const checkAuth = () => {
            const token = localStorage.getItem("token");
            setIsLoggedIn(!!token);
            
            if (token) {
                try {
                    const decoded = JSON.parse(atob(token.split('.')[1]));
                    setIsDoctor(decoded.role === 2);
                } catch (e) {
                    setIsDoctor(false);
                }
            } else {
                setIsDoctor(false);
            }
        };

        checkAuth();
        window.addEventListener("authChange", checkAuth);
        return () => window.removeEventListener("authChange", checkAuth);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        setIsLoggedIn(false);
        setShowProfileMenu(false);
        window.location.href = "/auth"; 
    };

    const handleProtectedClick = (path) => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/auth");
        } else {
            navigate(path);
        }
    };

    return ( 
        <nav className="nav">
            <div className="container">
                <div className="nav-row">
                    <img src={tooth} className="tooth-img" alt="Link"/>
                    <Link to="/" className="logo"><strong>Dental</strong> clinic</Link>

                    <ul className="nav-list">
                        <li className="nav-list__item">
                            <Link 
                                to="/" 
                                className={`nav-list__link ${location.pathname === "/" ? "nav-list__link--active" : ""}`}
                            >
                                Клиника
                            </Link>
                        </li>
                        
                        {!isDoctor && (
                            <li className="nav-list__item">
                                <div 
                                    className={`nav-list__link ${location.pathname === "/dantists" ? "nav-list__link--active" : ""}`}
                                    onClick={() => handleProtectedClick("/dantists")}
                                    style={{ cursor: "pointer" }}
                                >
                                    Стоматологи
                                </div>
                            </li>
                        )}
                        
                        <li className="nav-list__item">
                            <Link 
                                to="/contacts" 
                                className={`nav-list__link ${location.pathname === "/contacts" ? "nav-list__link--active" : ""}`}
                            >
                                Контакты
                            </Link>
                        </li>
                        {!isLoggedIn ? (
                            <li className="nav-list__item">
                                <Link to="/auth" className="nav-list__link">Вход</Link>
                            </li>
                        ) : (
                            <li className="nav-list__item profile-menu">
                                <div 
                                    className="profile-icon" 
                                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                                >
                                   <img src={userProfile} className="tooth-img" alt="Link"/>
                                </div>
                                {showProfileMenu && (
                                    <div className="profile-dropdown">
                                        <div className="profile-option" onClick={() => navigate("/profile")}>Профиль</div>
                                        <div className="profile-option" onClick={handleLogout}>Выйти</div>
                                    </div>
                                )}
                            </li>
                        )}
                    </ul>
                </div>
            </div>
        </nav>
    );
}
 
export default Navbar;