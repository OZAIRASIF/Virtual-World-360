import React from 'react'
import './Dashboard.css'
import { Pannellum } from 'pannellum-react';
import Navbar from '../components/Navbar'
import { Link } from 'react-router-dom';

const Dashboard = () => {
    return (
        <div className="container">
            <Navbar />
            <div className="overlay">
                <div className="left">
                    <div className="textContent">

                        <h2>Welcome to the Virtual World 360</h2>
                        <p>Explore the scenes and get a closer look at the environment.</p>
                    </div>
                    <button className='tour-editor-btn'>
                        <Link to="/editor">Tour Editor</Link>

                    </button>
                </div>
                <div className="right">
                </div>
            </div>
            <div className="banner">
                <Pannellum
                    // ref={PanImage}
                    // imageType="cube"
                    width="100%"
                    height="100%"
                    image="dash5.jpeg"
                    autoRotate={-5}
                    pitch={0}
                    yaw={0}
                    hfov={120}
                    // hotspotDebug={true}
                    showControls={false}
                    autoLoad
                // title="GEC BILASPUR -  VTour"
                // author="Swikrit Shukla"
                />
            </div>
        </div>
    )
}

export default Dashboard