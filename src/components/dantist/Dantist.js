import { useState } from "react";
import AppointmentModal from "../appointment/AppointmentModal";
import defaultDoctor from "../../img/default-doctor.svg";
import "./style.css";

const Dantist = ({ id, title, img, specialization }) => {
    const [showModal, setShowModal] = useState(false);
    const [imgError, setImgError] = useState(false);

    const handleImgError = () => {
        console.log("Ошибка загрузки изображения для врача:", id, "URL:", img);
        setImgError(true);
    };

    return (
        <>
            <li className="dantist">
                <div onClick={() => setShowModal(true)} style={{ cursor: 'pointer' }}>
                    <img 
                        src={imgError ? defaultDoctor : img}
                        alt={title} 
                        className="dantist__img"
                        onError={handleImgError}
                    />
                    <h3 className="dantist__title">{title}</h3>
                    {specialization && <p className="dantist__specialty">{specialization}</p>}
                </div>
            </li>

            {showModal && (
                <AppointmentModal
                    doctorId={id}
                    doctorName={title}
                    onClose={() => setShowModal(false)}
                />
            )}
        </>
    );
};

export default Dantist;