import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import './Tours.css';
import { backend_url } from "../constants";

const Tours = () => {
    const [tours, setTours] = useState([]);
    const [tourName, setTourName] = useState("");
    const [currentid, setCurrentid] = useState(null);
    const navigate = useNavigate();

    // Fetch tours from the backend when the component mounts
    useEffect(() => {
        const fetchTours = async () => {
            const response = await fetch(`${backend_url}/api/tours`);
            const data = await response.json();
            setTours(data);
            console.log(data);
        };
        fetchTours();
    }, []);

    // Add a new tour
    const addTour = async () => {
        if (!tourName) return; // Ensure the tour name is not empty
        const newTour = {
            name: tourName,
            sceneIds: []
        };

        const response = await fetch(`${backend_url}/api/tours`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(newTour)
        });

        const addedTour = await response.json();
        setTours([...tours, addedTour]);
        setTourName(""); // Clear the input after adding
    };

    // Navigate to the tour editor
    const handleTourClick = (id) => {
        navigate(`/editor/${id}`); // Navigate to the tour editor
    };

    // Update the tour name
    const updateTourName = async (id) => {
        const updatedName = prompt("Enter new tour name: ");
        if (updatedName) {
            const response = await fetch(`${backend_url}/api/tours/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ name: updatedName })
            });

            if (response.ok) {
                setTours(tours.map(tour =>
                    tour.id === id ? { ...tour, name: updatedName } : tour
                ));
            }
        }
    };

    return (
        <div className="outer">
            <div className="tours-container">
                <h1>Tours</h1>
                <div className="add-tour">
                    <input
                        type="text"
                        placeholder="Tour Name"
                        value={tourName}
                        onChange={(e) => setTourName(e.target.value)}
                        className="tour-input"
                    />
                    <button className="add-button" onClick={addTour}>Add Tour</button>
                </div>
                <div className="tours-list">
                    {tours.map(tour => (
                        <div key={tour.id} className="tour-item">
                            <h2 onClick={() => handleTourClick(tour.id)} className="tour-title">
                                {tour.name}
                            </h2>
                            <button className="update-button" onClick={() => updateTourName(tour.id)}>Update Name</button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Tours;
