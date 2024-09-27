const Menubar = ({ hotspotType, setHotspotType, targetScene, setTargetScene, scenes, addHotspot, setText, text, currentScene }) => {
    return (
        <div className="menubar">
            <label>
                Hotspot Type:
                <select value={hotspotType} onChange={(e) => setHotspotType(e.target.value)}>
                    <option value="custom">Custom</option>
                    <option value="info">Info</option>
                </select>
            </label>
            {hotspotType === "info" && (
                <label>
                    Custom Text:
                    <input
                        type="text"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                    />
                </label>
            )}
            {hotspotType === "custom" && (
                <label>
                    Target Scene:
                    <select value={targetScene} onChange={(e) => setTargetScene(e.target.value)}>
                        {Object.keys(scenes)
                            .filter(sceneId => sceneId !== currentScene) // Filter out the current scene
                            .map(sceneId => (
                                <option key={sceneId} value={sceneId}>
                                    {scenes[sceneId].name} {/* Display the scene name */}
                                </option>
                            ))}
                    </select>
                </label>
            )}
            <button className='addhs' onClick={addHotspot}>
                Add Hotspot
            </button>
        </div>
    );
};
export default Menubar