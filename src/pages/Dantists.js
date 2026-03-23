import { useState, useEffect } from "react";
import Dantist from '../components/dantist/Dantist';
import API_BASE_URL from '../api/config';
import defaultDoctor from '../img/default-doctor.svg';

const Dantists = () => {
    const [dantists, setDantists] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadDantists = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/doctors`);
                const data = await response.json();
                console.log("Загруженные врачи с photo_url:", data);
                setDantists(data);
            } catch (err) {
                console.error("Ошибка загрузки врачей:", err);
            } finally {
                setLoading(false);
            }
        };

        loadDantists();
    }, []);

    if (loading) return <div>Загрузка...</div>;

    return ( 
        <main className="section">
            <div className="container">
                <h2 className="title-1">Запишитесь на прием</h2>
                <ul className="dantists">
                {dantists.map((dantist) => (
                    <Dantist 
                        key={dantist.doctor_id}
                        id={dantist.doctor_id} 
                        title={`${dantist.first_name} ${dantist.last_name}`}
                        specialization={dantist.specialization}
                        img={dantist.photo_url ? `${API_BASE_URL}${dantist.photo_url}` : defaultDoctor}
                    />
                ))}
                </ul>
            </div>
        </main> 
    );
}
 
export default Dantists;