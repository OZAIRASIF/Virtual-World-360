

const VRModeBtn = ({ scenes, currentScene, isVrMode, setIsVrMode }) => {
    const enterVrMode = async () => {
        if (navigator.xr) {
            try {
                const session = await navigator.xr.requestSession('immersive-vr');
                session.addEventListener('end', exitVrMode);
                // Set up your WebXR rendering loop here
            } catch (error) {
                console.error('Unable to start VR session:', error);
            }
        } else {
            console.error('WebXR not supported');
        }
    };

    const exitVrMode = () => {
        // Logic to exit VR mode
        console.log('Exiting VR Mode');
        // You would typically end the WebXR session here
    };

    const toggleVrMode = () => {
        if (isVrMode) {
            exitVrMode();
        } else {
            enterVrMode();
        }
        setIsVrMode(!isVrMode);
    };

    return (
        <div>
            <button className="vrButton" onClick={toggleVrMode}>
                {isVrMode ? 'Exit VR Mode' : 'Enter VR Mode'}
            </button>

        </div>
    );
};

export default VRModeBtn;