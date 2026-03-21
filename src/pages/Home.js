import Header from "./../components/header/Header";

const Home = () => {
    return ( 
        <>
            <Header />

            <main className="section">
                <div className="container">

                    <ul className="content-list">
                        <li className="content-list__item">
                            <h2 className="title-2">Ваше здоровье в надёжных руках</h2>
                            <p>Профилактика, диагностика и лечение зубов: чистки, пломбирование, 
                                эндодонтия, имплантация, виниры и эстетические реставрации. 
                                Индивидуальный план лечения, профессиональная гигиена и 
                                контрольный осмотр послеоперационных процедур.</p>
                        </li>
                    </ul>

                </div>
            </main>
        </>
    );
}
 
export default Home;