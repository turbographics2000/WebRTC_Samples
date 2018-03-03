btnGetDisplayMedia.onclick = evt => {
    navigator.getDisplayMedia({ video: true })
        .then(stream => localView.srcObject = stream)
        .catch(e => console.error(e));
};