/**
 * Browser-compatible PlantUML encoder
 * Uses native JavaScript compression instead of pako
 */

/**
 * Encode PlantUML code using native compression
 */
export async function encodePlantUML(plantUMLCode: string): Promise<string> {
  try {
    // Convert string to UTF-8 bytes
    const utf8Bytes = new TextEncoder().encode(plantUMLCode);

    // Use native compression if available
    if ('CompressionStream' in window) {
      const stream = new CompressionStream('deflate-raw');
      const writer = stream.writable.getWriter();
      const reader = stream.readable.getReader();

      writer.write(utf8Bytes);
      writer.close();

      const chunks = [];
      let done = false;
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) chunks.push(value);
      }

      const compressed = new Uint8Array(
        chunks.reduce((acc, chunk) => acc + chunk.length, 0)
      );
      let offset = 0;
      for (const chunk of chunks) {
        compressed.set(chunk, offset);
        offset += chunk.length;
      }

      return encode64(compressed);
    } else {
      // Fallback to base64 encoding
      return encodePlantUMLFallback(plantUMLCode);
    }
  } catch (error) {
    console.error('Failed to encode PlantUML:', error);
    return encodePlantUMLFallback(plantUMLCode);
  }
}

/**
 * PlantUML's custom base64-like encoding
 */
function encode64(data: Uint8Array): string {
  let r = '';
  for (let i = 0; i < data.length; i += 3) {
    if (i + 2 === data.length) {
      r += append3bytes(data[i], data[i + 1], 0);
    } else if (i + 1 === data.length) {
      r += append3bytes(data[i], 0, 0);
    } else {
      r += append3bytes(data[i], data[i + 1], data[i + 2]);
    }
  }
  return r;
}

/**
 * Helper function for PlantUML's custom encoding
 */
function append3bytes(b1: number, b2: number, b3: number): string {
  const c1 = b1 >> 2;
  const c2 = ((b1 & 0x3) << 4) | (b2 >> 4);
  const c3 = ((b2 & 0xf) << 2) | (b3 >> 6);
  const c4 = b3 & 0x3f;
  let r = '';
  r += encode6bit(c1 & 0x3f);
  r += encode6bit(c2 & 0x3f);
  r += encode6bit(c3 & 0x3f);
  r += encode6bit(c4 & 0x3f);
  return r;
}

/**
 * PlantUML's custom 6-bit encoding
 */
function encode6bit(b: number): string {
  if (b < 10) {
    return String.fromCharCode(48 + b);
  }
  b -= 10;
  if (b < 26) {
    return String.fromCharCode(65 + b);
  }
  b -= 26;
  if (b < 26) {
    return String.fromCharCode(97 + b);
  }
  b -= 26;
  if (b === 0) {
    return '-';
  }
  if (b === 1) {
    return '_';
  }
  return '?';
}

/**
 * Fallback encoder using base64 with ~1 header
 */
export function encodePlantUMLFallback(plantUMLCode: string): string {
  try {
    const utf8String = unescape(encodeURIComponent(plantUMLCode));
    const base64 = btoa(utf8String);
    return '~1' + base64;
  } catch (error) {
    console.error('Failed to encode PlantUML (fallback):', error);
    throw new Error('PlantUML fallback encoding failed');
  }
}
