import sharp from 'sharp'

/**
 * Resize and encode a staged PNG into the final asset format/size (voidborn reference).
 * @param {Buffer} inputBuffer
 * @param {{ width: number, height: number, format: string, quality?: number }} spec
 */
export async function encodeAsset(inputBuffer, spec) {
  let pipeline = sharp(inputBuffer).resize(spec.width, spec.height, {
    fit: 'cover',
    position: 'centre',
  })

  if (spec.format === 'webp') {
    return pipeline.webp({ quality: spec.quality ?? 85 }).toBuffer()
  }
  if (spec.format === 'png') {
    return pipeline.png().toBuffer()
  }
  if (spec.format === 'jpeg' || spec.format === 'jpg') {
    return pipeline.jpeg({ quality: spec.quality ?? 90 }).toBuffer()
  }

  throw new Error(`Unsupported output format: ${spec.format}`)
}

export async function readImageMeta(filePath) {
  return sharp(filePath).metadata()
}
