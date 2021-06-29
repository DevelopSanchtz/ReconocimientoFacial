const video = document.getElementById('videoInput')

Promise.all([
    faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
    faceapi.nets.ssdMobilenetv1.loadFromUri('/models') //heavier/accurate version of tiny face detector
]).then(start)

function start() {
    document.body.append('Models Loaded')

    navigator.getUserMedia(
        { video:{} },
        stream => video.srcObject = stream,
        err => console.error(err)
    )
    //video.src = '../videos/speech.mp4'
       
    recognizeFaces()
}

async function recognizeFaces(){

    const labeledDescriptors = await loadLabeledImages()
    console.log(labeledDescriptors)
    const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.7)

    video.addEventListener('play', () => {

        console.log('Reproduciendo')

        const canvas = faceapi.createCanvasFromMedia(video)
        document.body.append(canvas)

        const displaySize = { width: video.width, height: video.height }

        faceapi.matchDimensions(canvas, displaySize)

        setInterval( async () => {
            const detections = await faceapi.detectAllFaces(video).withFaceLandmarks().withFaceDescriptors()

            const resizedDetections = faceapi.resizeResults(detections, displaySize)
            canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)

            const results = resizedDetections.map((d) => {
                return faceMatcher.findBestMatch(d.descriptor)
            })

            results.forEach((result, i) => {
                const box = resizedDetections[i].detection.box
                //const drawBow = new faceapi.draw.DrawBow(box, {label: result.toString()})
                const drawBox = new faceapi.draw.DrawBox(box, { label: result.toString() })
                
                //drawBow.draw(canvas)
                drawBox.draw(canvas)
            })

        }, 100)
    })
}

function loadLabeledImages() {
    //const labels = ['Armando Sanchez', 'Harly Queen', 'Jhonesy', 'Midas']

    const labels = ['Armando Sanchez', 'Estrada Master', 'Ingeniero Roberto', 'Angel Catedral', 'RaHdz07', 'Santiago00P', 'Tempis13']

    return Promise.all(
        labels.map(async (label) => {
            const descriptions = []
            for (let i = 1; i<=2; i++ ) {
                const img = await faceapi.fetchImage(`../labeled_images/${label}/${i}.jpg`)
                const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor()
                descriptions.push(detections.descriptor)
            }
            document.body.append(label + 'Faces Loaded |')
            return new faceapi.LabeledFaceDescriptors(label, descriptions)
        })
    )
}