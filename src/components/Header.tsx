

function Header(){
return (
    <header>
        <div className="burger">
            <span className="bspan"></span>
            <span className="bspan"></span>
            <span className="bspan"></span>
        </div>

        <nav>
            <ul>
                <li><a href="index.html" className="gl">Главная</a></li>            
                <li><a href="find.html" className="find">Подбор</a></li>
            </ul>
        </nav>

        <label className="theme-switch">
            <input type="checkbox"  />
            <span  className="switch-icon"></span>
        </label>
    </header>

    
);


}

export default Header