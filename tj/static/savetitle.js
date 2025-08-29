
document.addEventListener("DOMContentLoaded", function () {
    // 
    document.getElementById('save-title-btn').addEventListener('click', function () {
        const titleInput = document.getElementById('journey-title').value.trim();
        const journeyUuid = "{{ uuid }}"; // Replace with actual UUID passed from Django context

        if (!titleInput) {
            alert("Please enter a valid title.");
            return;
        }

        // Disable all controls while the title is being saved
     

        // Make the fetch request to save the title
        fetch('/save-title/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': '{{ csrf_token }}', // Django CSRF token
            },
            body: JSON.stringify({
                uuid: journeyUuid,
                title: titleInput,
            }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                alert("Title saved successfully!");
                const modal = document.getElementById('save-title-modal');
                        if (modal) {
                            modal.remove();
                        }
                // Enable all controls after the title is saved successfully
               
            } else {
                alert("Failed to save title: " + data.message);

                // Enable all controls if there was an error saving
             
            }
        })
        .catch(error => {
            console.error("Error saving title:", error);

            // Enable all controls if there was an error during the fetch
            enableAllControls();
        });
    });
});