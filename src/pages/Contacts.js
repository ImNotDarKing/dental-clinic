const Contacts = () => {
    return ( 
        <main className="section">
            <div className="container">
                    <h1 className="title-1">Контакты клиники</h1>

                    <ul className="content-list">
                        <li className="content-list__item">
                            <h2 className="title-2">Адрес</h2>
                            <p>Россия, г. Ногинск</p>
                        </li>
                        <li className="content-list__item">
                            <h2 className="title-2">Telegram / WhatsApp</h2>
                            <p><a href="tel:+79051234567">+7 (800) 555-35-35</a></p>
                        </li>
                        <li className="content-list__item">
                            <h2 className="title-2">Почта</h2>
                            <p><a href="mailto:webdev@protonmail.com">dentalcl1n1c@mail.com</a></p>
                        </li>
                    </ul>

            </div>
        </main>
     );
}
 
export default Contacts;