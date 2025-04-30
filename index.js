import express from 'express'
import axios from 'axios'
import { Jimp } from 'jimp'

const PORT = 3000
const SOLAR_SYSTEM_PLANETS = [
  'sun', 'mercury', 'venus',
  'earth', 'mars', 'jupiter',
  'saturn', 'uranus', 'neptune'
]
const ASCII_BRIGHTNESS = '@%#*+=-:. '

const app = express()
const axiosInstance = axios.create({
  baseURL: 'https://images-api.nasa.gov/',
  timeout: 5000,
  headers: {
    'content-type': 'application/json',
  }
})

app.get('/', async (req, res) => {
  try {
    let planet = req.query.planet

    if (!planet) {
      const length = SOLAR_SYSTEM_PLANETS.length
      const random = Math.floor(Math.random() * length)
      planet = SOLAR_SYSTEM_PLANETS[random]
    }

    const parameter = {
      q: planet,
      media_type: 'image',
      keywords: planet,
      description: planet,
      title: planet,
    }
    const response = await axiosInstance.get('search', { params: parameter })

    const items = response.data.collection.items
    const hrefs = items.map(item => item.links[0].href)
    const length = hrefs.length
    const random = Math.floor(Math.random() * length)

    const href = hrefs[random]

    const image = await Jimp.read(href)

    const pixelSize = 8
    image.pixelate(pixelSize)

    const buffer = Array.from(image.bitmap.data)
    const width = image.bitmap.width
    const height = image.bitmap.height

    let html = ''

    html += `<img src=${href}>`
    html += `<br>`

    html += '<pre style="font-family: monospace; font-size:16px; line-height:60%; letter-spacing:0px;">'

    for (let y = 0; y < height; y += pixelSize) {
      for (let x = 0; x < width; x += pixelSize) {
        const index = (width * y + x) * 4
        const red = buffer[index]
        const green = buffer[index + 1]
        const blue = buffer[index + 2]

        const brightness = (0.2126 * red) + (0.7152 * green) + (0.0722 * blue)
        const charIndex = Math.floor((brightness / 255) * (ASCII_BRIGHTNESS.length - 1))
        const char = ASCII_BRIGHTNESS[charIndex]

        html += `<span style="color: rgb(${red},${green},${blue})">${char}</span>`
      }
      html += '<br>'
    }

    html += '</pre>'

    res.send(html)

  } catch (e) {
    res.send(`${e.message}`)
  }

})

app.listen(
  PORT,
  () => {
    console.log(`server running on port ${PORT}`)
  }
)