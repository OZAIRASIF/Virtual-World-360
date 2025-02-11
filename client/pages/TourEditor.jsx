import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Pannellum } from 'pannellum-react';
import './TourEditor.css'; // Ensure this file is correctly linked
import { useParams } from 'react-router-dom';
import { backend_url } from '../constants';
import Menubar from '../components/Menubar';
import SceneManager from '../components/SceneManager';
// import VRModeBtn from '../components/VRModeBtn';

const TourEditor = () => {
    const tourId = useParams().id;
    const [selectedHotspot, setSelectedHotspot] = useState(null); // Currently selected hotspot
    const [isEditorOpen, setIsEditorOpen] = useState(true); // Toggle editor visibility
    const [targetScene, setTargetScene] = useState('');
    const [scenes, setScenes] = useState({});
    const [currentScene, setCurrentScene] = useState('');
    const [hotspotType, setHotspotType] = useState('custom');
    const [text, setText] = useState("");
    const [sceneName, setSceneName] = useState("");
    const [previewMode, setPreviewMode] = useState(false)
    const [isEditing, setIsEditing] = useState(false); // Toggle editing mode
    const PanImage = useRef(null);
    const [isVrMode, setIsVrMode] = useState(false);

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



    const addHotspot = async () => {
        const viewer = PanImage.current.getViewer();
        const pitch = viewer.getPitch();
        const yaw = viewer.getYaw();
        if (targetScene === "" && hotspotType === "custom") {
            alert("Please select a scene to add a hotspot")
            return;
        }

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

    const deleteScene = async (sceneId) => {
        const res = await axios.delete(`${backend_url}/api/tours/${tourId}/scenes/${sceneId}`)
        if (res.status === 200) {
            alert("Scene Deleted Succesfully")
        }
    }

    const clickHostpot = (hs) => {
        if (!previewMode) {
            setSelectedHotspot(hs); // Set the selected hotspot
            setIsEditorOpen(true); // Open the editor
        } else if (hs.sceneId) {
            if (hs.type === "info") {
                alert("info is clicked")
            } else {
                loadScene(hs.sceneId); // Load the scene
            }
        } else {
            alert("This hotspot is not linked to any scene.");
        }
    };


    const updateHotspot = async () => {
        if (!selectedHotspot || !selectedHotspot.text) {
            alert("Hotspot text is required!");
            return;
        }

        const updatedHotspot = { ...selectedHotspot };

        // Optimistically update the UI
        setScenes((prevScenes) => ({
            ...prevScenes,
            [currentScene]: {
                ...prevScenes[currentScene],
                hotspots: prevScenes[currentScene].hotspots.map((hs) =>
                    hs.pitch === updatedHotspot.pitch && hs.yaw === updatedHotspot.yaw
                        ? updatedHotspot
                        : hs
                ),
            },
        }));
        try {
            await axios.put(
                `${backend_url}/api/scenes/${currentScene}/hotspots`,
                updatedHotspot,
                { headers: { "Content-Type": "application/json" } }
            );

            alert("Hotspot updated successfully");
        } catch (error) {
            console.error("Error updating hotspot:", error);
            alert("Failed to update hotspot. Please try again.");
        } finally {
            setIsEditorOpen(false); // Close the editor
        }
    };


    const deleteHotspot = async () => {
        // Remove the hotspot locally
        setScenes((prevScenes) => ({
            ...prevScenes,
            [currentScene]: {
                ...prevScenes[currentScene],
                hotspots: prevScenes[currentScene].hotspots.filter(
                    (hs) =>
                        hs.pitch !== selectedHotspot.pitch || hs.yaw !== selectedHotspot.yaw
                ),
            },
        }));

        // Remove the hotspot from the backend
        try {
            await axios.delete(
                `${backend_url}/api/scenes/${currentScene}/hotspots`,
                {
                    data: { pitch: selectedHotspot.pitch, yaw: selectedHotspot.yaw },
                    headers: { "Content-Type": "application/json" },
                }
            );
            alert("Hotspot deleted successfully");
        } catch (error) {
            console.error("Error deleting hotspot:", error);
        }

        setIsEditorOpen(false); // Close the editor
    };


    const togglePreviewMode = () => {
        setPreviewMode(!previewMode);
        setIsEditing(false)
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
            {isEditorOpen && selectedHotspot && !previewMode && (
                <div className="hotspot-editor-overlay">
                    <div className="hotspot-editor">
                        <h3>Edit Hotspot</h3>
                        {hotspotType === "info" ? <label>
                            Text:
                            <input
                                type="text"
                                value={selectedHotspot.text}
                                onChange={(e) =>
                                    setSelectedHotspot({ ...selectedHotspot, text: e.target.value })
                                }
                            />
                        </label> :
                            <label>
                                Target Scene:
                                <select
                                    value={selectedHotspot.sceneId || ""}
                                    onChange={(e) =>
                                        setSelectedHotspot({ ...selectedHotspot, sceneId: e.target.value })
                                    }
                                >
                                    <option value="">None</option>
                                    {Object.keys(scenes).map((sceneId) => (
                                        <option key={sceneId} value={sceneId}>
                                            {scenes[sceneId].name}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        }
                        <div className="editor-actions">
                            <button className='editBtn' onClick={updateHotspot}>Save</button>
                            <button className='deleteBtn' onClick={deleteHotspot}>Delete</button>
                            <button className='' onClick={() => setIsEditorOpen(false)}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {!previewMode ?
                <SceneManager // New component
                    scenes={scenes}
                    setScenes={setScenes}
                    setCurrentScene={setCurrentScene}
                    currentScene={currentScene}
                    loadScene={loadScene}
                    toggleEdit={toggleEdit}
                    deleteScene={deleteScene}
                    tourId={tourId}
                    fetchScenes={fetchScenes}
                />
                :
                <>
                    {/* <VRModeBtn
                        scenes={scenes}
                        currentScene={currentScene}
                        isVrMode={isVrMode}
                        setIsVrMode={setIsVrMode} /> */}


                    <div className="bottombar">
                        {Object.keys(scenes).length > 0 ? (
                            Object.keys(scenes).map((sceneId) => (
                                <div
                                    key={sceneId}
                                    className={`scene-item2 ${currentScene === sceneId ? "active" : ""}`}
                                    onClick={() => loadScene(sceneId)}
                                >
                                    <div className="scene-content2">
                                        <img
                                            src={scenes[sceneId].image}
                                            alt={scenes[sceneId].name}
                                            className="scene-image2"
                                        />
                                        <span>{scenes[sceneId].name}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p>No scenes available</p>
                        )}
                    </div>

                </>
            }

            <div className="main-content">
                {isEditing && (
                    <>
                        <div className="scene-name-edit-overlay">
                            {/* <input type="number" min={1} />
                            <button >Reorder</button> */}
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

                {<Pannellum
                    ref={PanImage}
                    width={previewMode ? "100vw" : "75vw"}
                    height={previewMode ? "100vh" : "98vh"}
                    image={current?.image || ''}
                    autoRotate={currentScene === "scene1" ? -5 : 0}
                    pitch={0}
                    yaw={0}
                    hfov={90}
                    hotspotDebug={!previewMode}
                    showControls={true}
                    autoLoad
                // title="GEC BILASPUR - VTour"
                // author="Swikrit Shukla"
                >
                    {current && current.hotspots.map((hs, idx) => (
                        <Pannellum.Hotspot
                            key={idx}
                            type={hs.type || 'custom'}
                            pitch={hs.pitch}
                            yaw={hs.yaw}
                            text={hs.text}
                            // handleClick={() => console.log(hs.sceneId)}
                            cssClass="tooltipcss"
                            handleClick={() => clickHostpot(hs)} // Load the scene if the hotspot has a sceneId
                        />
                    ))}
                </Pannellum>}
            </div>
            <button className="preview-toggle" onClick={togglePreviewMode}>
                {previewMode ? 'Exit Preview' : 'Enter Preview'}
            </button>
        </div >
    );
};

export default TourEditor;
