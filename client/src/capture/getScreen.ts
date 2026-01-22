const getScreen = async () => {
    const stream = await navigator.mediaDevices.getDisplayMedia({ audio: true, video: true })
    return stream;
}

export default getScreen;