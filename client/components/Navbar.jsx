import React from 'react'
import { Link } from 'react-router-dom'

const Navbar = () => {
    return (
        <div className='nav'>
            <div className="icon">
                <div className="image">

                    <img src="https://icons.veryicon.com/png/o/miscellaneous/multicolor-linear-icon/vr-8.png" alt="icon" />
                </div>
                <h2>Virtual World 360</h2>
            </div>
            <div className="links">

                <Link to="">Home</Link>
                <Link to="">About</Link>
                <Link to="">Contact</Link>
            </div>

            <div className="regxlog">
                <button className='tour-editor-btn'>
                    <Link to="/editor">Tour Editor</Link>

                </button>
            </div>


        </div>
    )
}

export default Navbar