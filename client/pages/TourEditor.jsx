import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Pannellum } from 'pannellum-react';
import './TourEditor.css'; // Ensure this file is correctly linked
import { useParams } from 'react-router-dom';
import { backend_url } from '../constants';
import Menubar from '../components/Menubar';

const TourEditor = () => {
    const tourId = useParams().id;
    const [targetScene, setTargetScene] = useState('');
    const [file, setFile] = useState(null);
    const [scenes, setScenes] = useState({});
    const [currentScene, setCurrentScene] = useState('');
    const [hotspotType, setHotspotType] = useState('custom');
    const [text, setText] = useState("");
    const [sceneName, setSceneName] = useState("");
    const [isEditing, setIsEditing] = useState(false); // Toggle editing mode
    const PanImage = useRef(null);

    const fetchScenes = async () => {
        try {
            const response = await axios.get(`${backend_url}/api/tours/${tourId}/scenes`);
            const fetchedScenes = response.data.reduce((acc, scene) => {
                acc[scene.id] = scene;
                return acc;
            }, {});
            setScenes(fetchedScenes);
            if (Object.keys(fetchedScenes).length > 0) {
                setCurrentScene(Object.keys(fetchedScenes)[0]);
                setSceneName(fetchedScenes[Object.keys(fetchedScenes)[0]].name);
            }
        } catch (error) {
            console.error('Error fetching scenes:', error);
        }
    };
    useEffect(() => {

        fetchScenes();
    }, [tourId]);

    const handleFileChange = (event) => {
        setFile(event.target.files[0]);
    };

    const handleUploadScene = async () => {
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post(`${backend_url}/api/tours/${tourId}/scenes`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            const newScene = response.data;
            console.log(newScene)
            setScenes((prevScenes) => ({
                ...prevScenes,
                [newScene.id]: newScene,
            }));
            alert("upload succesfull")
            setCurrentScene(newScene);
            setSceneName(newScene.name);
            fetchScenes()
            setFile(null);
        } catch (error) {
            console.error('Error uploading scene:', error);
        }
    };

    const addHotspot = async () => {
        const viewer = PanImage.current.getViewer();
        const pitch = viewer.getPitch();
        const yaw = viewer.getYaw();

        const newHotspot = {
            pitch,
            yaw,
            type: hotspotType,
            sceneId: targetScene,
            text: text === "" ? `Go to ${targetScene}` : text,
        };

        // Clear the input text after adding a hotspot
        setText("");

        // Update the local state first
        setScenes(prevScenes => ({
            ...prevScenes,
            [currentScene]: {
                ...prevScenes[currentScene],
                hotspots: [...prevScenes[currentScene].hotspots, newHotspot],
            },
        }));

        try {
            // Send request to the backend to save the new hotspot
            await axios.post(`${backend_url}/api/scenes/${currentScene}/hotspots`, newHotspot, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            console.log('Hotspot added successfully');
        } catch (error) {
            console.error('Error adding hotspot:', error);
        }
    };


    const loadScene = (sceneId) => {
        setCurrentScene(sceneId);
        setSceneName(scenes[sceneId].name);
    };

    const toggleEdit = () => {
        setIsEditing(!isEditing);
    };

    const updateSceneName = async () => {
        try {
            // Send a request to update the scene name in the backend
            const response = await axios.put(
                `${backend_url}/api/tours/${tourId}/scenes/${currentScene}`,
                { name: sceneName }, // Your payload
                {
                    headers: {
                        'Content-Type': 'application/json' // Set content type to application/json
                    }
                }
            );

            console.log('Update response:', response.data);

            // Update the local state after the backend update succeeds
            setScenes(prevScenes => ({
                ...prevScenes,
                [currentScene]: {
                    ...prevScenes[currentScene],
                    name: sceneName,
                },
            }));

            setIsEditing(false); // Close edit mode after updating
        } catch (error) {
            console.error('Error updating scene name:', error);
        }
    };



    const current = scenes[currentScene];

    return (
        <div className="tour-editor">
            <div className="sidebar">
                <h2>Scene Management</h2>
                <input type="file" onChange={handleFileChange} />
                <button onClick={handleUploadScene}>Upload Scene</button>
                <div className="scene-list">
                    <h3>Scenes</h3>
                    {Object.keys(scenes).length > 0 ? (
                        Object.keys(scenes).map((sceneId) => (
                            <div
                                key={sceneId}
                                className={`scene-item ${currentScene === sceneId ? 'active' : ''}`}
                                onClick={() => loadScene(sceneId)}
                            >
                                <div className="scene-content">
                                    <img src={scenes[sceneId].image} alt={scenes[sceneId].name} className="scene-image" />
                                    <span>{scenes[sceneId].name}</span>
                                </div>
                                <button onClick={(e) => { e.stopPropagation(); toggleEdit(sceneId); }} className="edit-btn">Edit</button>
                            </div>

                        ))
                    ) : (
                        <p>No scenes available.</p>
                    )}
                </div>
            </div>

            <div className="main-content">
                {isEditing && (
                    <>
                        <div className="scene-name-edit-overlay">
                            <input
                                type="text"
                                value={sceneName}
                                onChange={(e) => setSceneName(e.target.value)}
                                placeholder="Change scene name"
                                className="edit-input"
                            />
                            <button onClick={updateSceneName} className="update-btn">Update</button>
                        </div>
                        <Menubar
                            hotspotType={hotspotType}
                            setHotspotType={setHotspotType}
                            targetScene={targetScene}
                            setTargetScene={setTargetScene}
                            scenes={scenes}
                            addHotspot={addHotspot}
                            text={text}
                            setText={setText}
                            currentScene={currentScene}
                            sceneName={sceneName}
                            setSceneName={setSceneName}
                            updateSceneName={updateSceneName} // Pass updateSceneName to Menubar
                        />
                    </>
                )}

                <Pannellum
                    ref={PanImage}
                    width="75vw"
                    height="98vh"
                    image={current?.image || ''}
                    autoRotate={currentScene === "scene1" ? -5 : 0}
                    pitch={0}
                    yaw={0}
                    hfov={120}
                    hotspotDebug={true}
                    showControls={false}
                    autoLoad
                    title="GEC BILASPUR - VTour"
                    author="Swikrit Shukla"
                >
                    {current && current.hotspots.map((hs, idx) => (
                        <Pannellum.Hotspot
                            key={idx}
                            type={hs.type || 'custom'}
                            pitch={hs.pitch}
                            yaw={hs.yaw}
                            text={hs.text}
                            // handleClick={() => console.log(hs.sceneId)}
                            handleClick={() => hs.sceneId && loadScene(hs.sceneId)} // Load the scene if the hotspot has a sceneId
                        />
                    ))}
                </Pannellum>
            </div>
        </div>
    );
};

export default TourEditor;
