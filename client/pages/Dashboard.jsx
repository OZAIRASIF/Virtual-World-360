import React from 'react'
import './Dashboard.css'
import { Pannellum } from 'pannellum-react';
import Navbar from '../components/Navbar'

const Dashboard = () => {
    return (
        <div className="container">
            <Navbar />
            <div className="banner">
                <Pannellum
                    // ref={PanImage}
                    // imageType="cube"
                    width="100%"
                    height="100%"
                    image="dash4.jpg"
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