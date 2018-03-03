/**
 * このテストは、リモートがトラックを削除(pc.removeTrack(sender))を行った際に、イベントが発生するかのテストです。
 * https://github.com/w3c/webrtc-pc/issues/1161
 * において、議論が継続中？のようで
 * onremovetrack (Chrome)
 * onmuted
 * onended
 * のいずれかのイベントが発生するようです。
 **/

const socket = io();
let pc = null, cnv = null, ctx = null, rafId = null, sender = null;
btnConnect.onclick = evt => {
    createPC(true);
};
btnRemoveAudioTrack.onclick = evt => {
    removeTrack('audio');
};
btnRemoveVideoTrack.onclick = evt => {
    removeTrack('video');
};
function removeTrack(kind) {
    if (pc) {
        const senders = pc.getSenders().filter(sender => sender.track.kind === kind);
        if (senders.length) {
            pc.removeTrack(senders[0]);
        }
    }
}

btnStopAudioTrack.onclick = evt => {
    stopTrack('audio');
};
btnStopVideoTrack.onclick = evt => {
    stopTrack('video');
};
function stopTrack(kind) {
    if (pc) {
        const senders = pc.getSenders().filter(sender => sender.track.kind === kind);
        if (senders.length) {
            senders[0].track.stop();
        }
    }
}

btnDisabledAudioTrack.onclick = evt => {
    disabledTrack('audio');
};
btnDisabledVideoTrack.onclick = evt => {
    disabledTrack('video');
};
function disabledTrack(kind) {
    if (pc) {
        const senders = pc.getSenders().filter(sender => sender.track.disabled === kind);
        if (senders.length) {
            senders[0].track.disabled = true;
        }
    }
}


async function createPC(isCaller) {
    pc = new RTCPeerConnection(null);
    pc.onicecandidate = evt => {
        socket.emit('sig', { candidate: evt.candidate });
    }
    pc.ontrack = evt => {
        // onendedイベントリスナー設定
        evt.track.onended = evt => {
            console.log('onended', evt.target.kind);
        };
        // onmuteイベントリスナー設定
        evt.track.onmute = evt => {
            console.log('onmute', evt.target.kind);
        };
        // onmutedイベントリスナー設定
        evt.track.onmuted = evt => {
            console.log('onmuted', evt.target.kind);
        }

        remoteView.srcObject = evt.streams[0];
    };
    // removetrackイベントリスナー設定
    pc.onremovetrack = evt => {
        console.log('onremovetrack', evt.track.kind);
    };
    pc.onnegotiationneeded = async evt => {
        console.log('onnegotiationneeded');
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('sig', { offer });
    };
    if (isCaller) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        localView.srcObject = stream;
        stream.getTracks().forEach(track => {
            pc.addTrack(track, stream);
        });
    } else {
        localView.onloadedmetadata = evt => {
            cnv = document.createElement('canvas');
            cnv.width = localView.videoWidth;
            cnv.height = localView.videoHeight;
            ctx = cnv.getContext('2d');
            rafId = requestAnimationFrame(canvasRender);
            const stream = cnv.captureStream(15);
            stream.getTracks().forEach(track => {
                sender = pc.addTrack(track, stream);
            });
        };
        localView.src = 'sintel.mp4';
    }
}

socket.on('connect', _ => {
    socket.on('sig', async data => {
        if (!pc) {
            createPC();
        }
        if (data.offer) {
            await pc.setRemoteDescription(data.offer);
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('sig', { answer });
        } else if (data.answer) {
            await pc.setRemoteDescription(data.answer);
        } else if (data.candidate) {
            await pc.addIceCandidate(data.candidate);
        }
    });
});

function canvasRender() {
    rafId = requestAnimationFrame(canvasRender);
    ctx.drawImage(localView, 0, 0);
}
