// import React, { useState } from 'react';
// import axios from 'axios';
// import { backend_url } from '../constants';

// const SceneManager = ({ scenes, setScenes, setCurrentScene, currentScene, loadScene, toggleEdit, deleteScene, tourId, fetchScenes }) => {
//     const [file, setFile] = useState(null);
//     const handleFileChange = (event) => {
//         setFile(event.target.files[0]);
//     };

//     const handleUploadScene = async () => {
//         if (!file) return;

//         const formData = new FormData();
//         formData.append('file', file);

//         try {
//             const response = await axios.post(`${backend_url}/api/tours/${tourId}/scenes`, formData, {
//                 headers: {
//                     'Content-Type': 'multipart/form-data',
//                 },
//             });
//             const newScene = response.data;
//             console.log(newScene)
//             setScenes((prevScenes) => ({
//                 ...prevScenes,
//                 [newScene.id]: newScene,
//             }));
//             alert("upload succesfull")
//             setCurrentScene(newScene);
//             setSceneName(newScene.name);
//             fetchScenes()
//             setFile(null);
//         } catch (error) {
//             console.error('Error uploading scene:', error);
//         }
//     };;

//     return (
//         <div className="sidebar">
//             <h2>Scene Management</h2>
//             <input type="file" onChange={handleFileChange} />
//             <button onClick={handleUploadScene}>Upload Scene</button>
//             <div className="scene-list">
//                 <h3>Scenes</h3>
//                 {Object.keys(scenes).length > 0 ? (
//                     Object.keys(scenes).map((sceneId) => (
//                         <div
//                             key={sceneId}
//                             className={`scene-item ${currentScene === sceneId ? 'active' : ''}`}
//                             onClick={() => loadScene(sceneId)}
//                         >
//                             <div className="scene-content">
//                                 <img src={scenes[sceneId].image} alt={scenes[sceneId].name} className="scene-image" />
//                                 <span>{scenes[sceneId].name}</span>
//                             </div>
//                             <div className="btns">
//                                 <button onClick={(e) => {
//                                     // e.stopPropagation();
//                                     toggleEdit(sceneId);
//                                 }}
//                                     title="Edit"
//                                     className="edit-btn">E</button>

//                                 <button onClick={(e) => {
//                                     // e.stopPropagation();
//                                     deleteScene(sceneId);
//                                 }}
//                                     title="Delete"
//                                     className="deleteBtn">D</button>

//                             </div>
//                         </div>

//                     ))
//                 ) : (
//                     <p>No scenes available.</p>
//                 )}
//             </div>
//         </div>
//     );
// };

// export default SceneManager;



import React, { useState } from 'react';
import axios from 'axios';
import { backend_url } from '../constants';

const SceneManager = ({ scenes, setScenes, setCurrentScene, currentScene, loadScene, toggleEdit, deleteScene, tourId, fetchScenes }) => {
    const [files, setFiles] = useState([]);

    const handleFileChange = (event) => {
        setFiles(Array.from(event.target.files));
    };


  const handleUploadScene = async () => {
  if (files.length === 0) return;

  try {
    if (files.length === 1) {
      // ✅ Single upload
      const formData = new FormData();
      formData.append("file", files[0]);

      const response = await axios.post(
        `${backend_url}/api/tours/${tourId}/scenes`,  // <-- single scene endpoint
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      const newScene = response.data;
      setScenes((prevScenes) => ({
        ...prevScenes,
        [newScene.id]: newScene,
      }));
      setCurrentScene(newScene.id);
      alert("Upload successful");
    } else {
      // ✅ Multiple upload → auto-link
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));

      const response = await axios.post(
        `${backend_url}/api/tours/${tourId}/auto-links`,  // <-- fixed
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      const { scenes: newScenes } = response.data;

      setScenes((prevScenes) => ({
        ...prevScenes,
        ...newScenes,
      }));

      alert("Multiple images uploaded & hotspots auto-generated!");
    }

    setFiles([]);
    fetchScenes();
  } catch (error) {
    console.error("Error uploading scene(s):", error);
    alert("Upload failed");
  }
};



    return (
        <div className="sidebar">
            <h2>Scene Management</h2>
            <input type="file" multiple onChange={handleFileChange} />
            <button onClick={handleUploadScene}>
                {files.length > 1 ? "Upload & Auto-Link" : "Upload Scene"}
            </button>

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


