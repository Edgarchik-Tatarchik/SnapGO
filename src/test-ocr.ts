import Tesseract from 'tesseract.js'

async function test() {
  console.log('Starting OCR...')
  const result = await Tesseract.recognize(
    'https://upload.wikimedia.org/wikipedia/commons/a/a7/Camponotus_flavomarginatus_ant.jpg',
  'jpn',
    {
      logger: (m) => console.log(m.status, m.progress)
    }
  )
  console.log('Result:', result.data.text)
}

test()