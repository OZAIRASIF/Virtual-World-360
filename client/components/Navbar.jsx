import React from 'react'
import { Link } from 'react-router-dom'

const Navbar = () => {
    return (
        <div className='nav'>
            <div className="icon">
                <div className="image">

                    <img src="https://cdn-icons-png.freepik.com/256/8170/8170956.png?ga=GA1.1.402226809.1713673499&semt=ais_hybrid" alt="icon" />
                </div>
                <h2>Virtual World 360</h2>
            </div>
            <div className="links">

                <Link to="">Home</Link>
                <Link to="">About</Link>
                <Link to="">Contact</Link>
            </div>




        </div>
    )
}

export default Navbar