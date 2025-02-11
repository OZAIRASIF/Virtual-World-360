import React, { useState } from 'react';
import axios from 'axios';
import { backend_url } from '../constants';

const SceneManager = ({ scenes, setScenes, setCurrentScene, currentScene, loadScene, toggleEdit, deleteScene, tourId, fetchScenes }) => {
    const [file, setFile] = useState(null);
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
    };;

    return (
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
                            <div className="btns">
                                <button onClick={(e) => {
                                    // e.stopPropagation();
                                    toggleEdit(sceneId);
                                }}
                                    title="Edit"
                                    className="edit-btn">E</button>

                                <button onClick={(e) => {
                                    // e.stopPropagation();
                                    deleteScene(sceneId);
                                }}
                                    title="Delete"
                                    className="deleteBtn">D</button>

                            </div>
                        </div>

                    ))
                ) : (
                    <p>No scenes available.</p>
                )}
            </div>
        </div>
    );
};

export default SceneManager;

