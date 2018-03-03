btnGetDisplayMedia.onclick = evt => {
    navigator.getDisplayMedia({ video: true })
        .then(stream => {
            debugger;
            localView.srcObject = stream;
        }).catch(e => console.error(e));
};
console.log('hoge');