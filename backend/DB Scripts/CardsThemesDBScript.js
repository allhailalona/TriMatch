import fs from 'fs'
import path from 'path'
import os from 'os'

function genCards() {
  const numbers = [1, 2, 3]
  const shadings = ['full', 'striped', 'empty']
  const colors = ['purple', 'green', 'red']
  const symbols = ['diamond', 'squiggle', 'oval']

  const cards = []

  for (let number of numbers) {
    for (let shading of shadings) {
      for (let color of colors) {
        for (let symbol of symbols) {
          const id = `${number}${shading[0]}${color[0]}${symbol[0]}`
          cards.push({
            _id: id,
            number,
            shading,
            color,
            symbol
          })
        }
      }
    }
  }

  return cards
}

function createSvg(number, shading, color, shape, uniqueId) {
  // The golden ratio of gaming cards is 5:7 - width:height
  const svgWidth = 100
  const svgHeight = 140

  // Undefined for now, to be adjusted according to the shape of choice
  let shapeWidth, shapeHeight, verticalGap

  // Don't forget to add curvy corners to the card!!

  // Define more precise colors
  const colors = {
    purple: '#800080',
    green: '#008000',
    red: '#FF0000'
  }

  let shapePath = ''
  switch (shape) {
    case 'diamond':
      shapeWidth = 70
      shapeHeight = 30
      verticalGap = 10

      shapePath = `M0,${shapeHeight / 2} L${shapeWidth / 2},0 L${shapeWidth},${shapeHeight / 2} L${shapeWidth / 2},${shapeHeight} Z`
      break
    case 'squiggle':
      shapeWidth = 80 // Adjusted width to fit the shape properly
      shapeHeight = 30 // Adjusted height to fit the shape properly
      verticalGap = 12

      // This path gets a custom x offset, my suspicion is towards 'bounding box', which is most likely one of the svg params
      shapePath = `
        M62,0
        c -1.61,-0.05 -3.32,0.54 -4.63,1.36 -4.41,3.75 -10.86,4.99 -16.29,2.91 -2.67,-1.34 -5.43,-2.58 -8.41,-3.05 -3.3,-0.49 -6.68,-0.84 -10,-0.51 -6.86,1.33 -11.6,8.36 -11.43,15.15 -0.29,4 0.1,8.85 3.71,11.33 1.44,0.75 3.15,0.55 4.62,0.02 4.56,-1.66 8.85,-5.28 14,-4.4 5.3,1.75 10.72,3.86 16.41,3.44 5.53,0.15 10.8,-2.89 13.93,-7.36 3.51,-4.92 4.86,-12.08 1.44,-17.39 -0.89,-1.02 -2.09,-1.45 -3.34,-1.49 
        Z
      `
      break
    case 'oval':
      shapeWidth = 55
      shapeHeight = 25
      verticalGap = 12

      const cornerRadius = shapeHeight / 2 // Adjust this value to change corner roundness
      shapePath = `
				M${cornerRadius},0
				L${shapeWidth - cornerRadius},0
				A${cornerRadius},${cornerRadius} 0 0 1 ${shapeWidth},${cornerRadius}
				L${shapeWidth},${shapeHeight - cornerRadius}
				A${cornerRadius},${cornerRadius} 0 0 1 ${shapeWidth - cornerRadius},${shapeHeight}
				L${cornerRadius},${shapeHeight}
				A${cornerRadius},${cornerRadius} 0 0 1 0,${shapeHeight - cornerRadius}
				L0,${cornerRadius}
				A${cornerRadius},${cornerRadius} 0 0 1 ${cornerRadius},0
				Z
			`
      break
  }

  let patternId = `stripes-${color}-${uniqueId}`
  let pattern = ''
  let fill = ''
  switch (shading) {
    case 'full':
      fill = colors[color]
      break
    case 'striped':
      pattern = `
        <pattern id="${patternId}" patternUnits="userSpaceOnUse" width="2.5" height="2.5">
          <line x1="0" y1="0" x2="0" y2="4" stroke="${colors[color]}" stroke-width="1.5" />
        </pattern>
      `
      fill = `url(#${patternId})`
      break
    case 'empty':
      fill = 'none'
      break
  }

  const shapes = Array(number)
    .fill()
    .map((_, i) => {
      // Vertically center card
      const yOffset =
        (svgHeight - (number * shapeHeight + (number - 1) * verticalGap)) / 2 +
        i * (shapeHeight + verticalGap)

      // Horizontally center card
      const xOffset = (svgWidth - shapeWidth) / 2

      // Generate shape
      return `<path d="${shapePath}" transform="translate(${xOffset},${yOffset})" fill="${fill}" stroke="${colors[color]}" stroke-width="2.5" />`
    })
    .join('')

  // The pattern has to be decalred inside the svg props to be used.
  // As can be seen above, the 'striped' fill is first declared with the pattern, to whcih the 'fill', which id declared right afterwards, is pointing.
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}">
      <defs>${pattern}</defs>
      ${shapes}
    </svg>
  `

  return svg
}

function exportSvg(cards) {
  // Get the path to the desktop
  const desktopPath = path.join(os.homedir(), 'Desktop')
  const outputFolderPath = path.join(desktopPath, 'Exports Folder')

  // Clear previous output and create folder again
  if (fs.existsSync) {
    fs.rmSync(outputFolderPath, { recursive: true })
  }
  fs.mkdirSync(outputFolderPath, { recursive: true })

  for (const card of cards) {
    // Generate file name here
    const fileName = `${card._id}.svg`
    console.log('current file name is', fileName)

    // Full path for the file
    const fileOutputPath = path.join(outputFolderPath, fileName)

    // Create current card
    const svg = createSvg(card.number, card.shading, card.color, card.symbol, card._id)

    // Write the file
    fs.writeFileSync(fileOutputPath, svg)
  }

  console.log(`Exported to desktop`)
}

const cards = genCards()
console.log('generated', cards.length, 'cards')
exportSvg(cards)
console.log('DONE!')
