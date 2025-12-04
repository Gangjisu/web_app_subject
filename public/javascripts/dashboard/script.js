function loadSession(sessionId) {
    alert(`Resuming session: ${sessionId}`);
    // location.href = `frontend.html?session=${sessionId}`;
}

function handleFileUpload(input) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const json = JSON.parse(e.target.result);
                console.log("Loaded JSON:", json);
                alert(`Successfully loaded plan for: ${json.city || 'Unknown City'}`);
            } catch (err) {
                alert("Invalid JSON file!");
            }
        };
        reader.readAsText(file);
    }
}
