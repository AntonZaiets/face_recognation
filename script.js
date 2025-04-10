const imageUpload = document.getElementById('imageUpload')

Promise.all([
  faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
  faceapi.nets.ssdMobilenetv1.loadFromUri('/models')
]).then(start)

async function start() {
  const container = document.createElement('div')
  container.style.position = 'relative'
  document.body.append(container)

  let image
  let canvas
  document.body.append('Loaded')

  imageUpload.addEventListener('change', async () => {
    if (image) image.remove()
    if (canvas) canvas.remove()

    image = await faceapi.bufferToImage(imageUpload.files[0])
    container.append(image)

    canvas = faceapi.createCanvasFromMedia(image)
    container.append(canvas)

    const displaySize = { width: image.width, height: image.height }
    faceapi.matchDimensions(canvas, displaySize)

    // 1. Отримуємо дескриптор обличчя з завантаженого зображення користувача
    const detections = await faceapi.detectSingleFace(image).withFaceLandmarks().withFaceDescriptor()
    if (!detections) {
      alert("Обличчя не знайдено!")
      return
    }

    const userDescriptor = detections.descriptor

    // 2. Завантажуємо всі фотографії з GitHub
    const labels = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14']

    for (const label of labels) {
      const imageUrls = [
        `https://raw.githubusercontent.com/AntonZaiets/face_recognation/master/labeled_images/${label}/1.jpg`,
      ]

      for (const imageUrl of imageUrls) {
        const img = await faceapi.fetchImage(imageUrl)
        const detectionsOnImage = await faceapi.detectAllFaces(img).withFaceLandmarks().withFaceDescriptors()

        // Перевіряємо, чи є збіг з фото користувача
        detectionsOnImage.forEach(detection => {
          const match = faceapi.euclideanDistance(userDescriptor, detection.descriptor) < 0.6
          if (match) {
            console.log(`Збіг знайдено на фотографії ${imageUrl} для особи ${label}`)
            const box = detection.detection.box
            const drawBox = new faceapi.draw.DrawBox(box, { label: label })
            drawBox.draw(canvas)
          }
        })
      }
    }
  })
}
