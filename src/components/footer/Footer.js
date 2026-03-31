import gitHub from "./../../img/icons/gitHub.svg";

import "./style.css";

const Footer = () => {
    return ( 
        <footer className="footer">
            <div className="container">
                <div className="footer__wrapper">
                    <ul className="social">
                        <li className="social__item"><a href="https://github.com/ImNotDarKing"><img src={gitHub} alt="Link"/></a></li>
                    </ul>
                    <div className="copyright">
                        <p>© 2026 web-production-b8064e.up.railway.app</p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
 
export default Footer;