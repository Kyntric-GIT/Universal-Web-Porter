
export type CompatibilityLevel =
  | "Browser-ready candidate"
  | "Possible with runtime"
  | "Requires porting"
  | "Asset or data file"
  | "Unknown";

export type AnalysisResult = {
  fileName: string;
  extension: string;
  detectedFormat: string;
  engine: string;
  compatibility: CompatibilityLevel;
  explanation: string;
  recommendation: string;
};

type FormatInfo = Omit<AnalysisResult, "fileName" | "extension">;

const unknownFormat: FormatInfo = {
  detectedFormat: "Unknown file format",
  engine: "Unknown",
  compatibility: "Unknown",
  explanation: "The file format could not be identified.",
  recommendation: "Inspect the file and identify its game engine."
};

const extensionFormats: Record<string, FormatInfo> = {
  html: {
    detectedFormat: "HTML game or webpage",
    engine: "HTML5 / Web",
    compatibility: "Browser-ready candidate",
    explanation: "HTML content can run in browsers, but may require scripts and assets.",
    recommendation: "Import the complete game folder and test its browser dependencies."
  },
  wasm: {
    detectedFormat: "WebAssembly module",
    engine: "WebAssembly",
    compatibility: "Possible with runtime",
    explanation: "WebAssembly can run in browsers but may need JavaScript glue and other files.",
    recommendation: "Identify the module's dependencies and required runtime."
  },
  exe: {
    detectedFormat: "Windows executable",
    engine: "Windows",
    compatibility: "Requires porting",
    explanation: "Windows executables do not run directly in a normal browser.",
    recommendation: "Look for source code, a browser export, or a compatible porting approach."
  },
  zip: {
    detectedFormat: "ZIP archive",
    engine: "Unknown",
    compatibility: "Unknown",
    explanation: "The archive may contain game code, assets, or a browser build.",
    recommendation: "Inspect the archive contents."
  },
  pck: {
    detectedFormat: "Godot package",
    engine: "Godot",
    compatibility: "Possible with runtime",
    explanation: "Compatibility depends on the Godot version and game features.",
    recommendation: "Identify the Godot version and locate a compatible web export or runtime."
  },
  pak: {
    detectedFormat: "Unreal Engine package",
    engine: "Unreal Engine",
    compatibility: "Asset or data file",
    explanation: "PAK files generally contain game assets rather than a complete game.",
    recommendation: "Locate the game's executable, source, or browser-compatible build."
  },
  unity3d: {
    detectedFormat: "Unity asset or package",
    engine: "Unity",
    compatibility: "Possible with runtime",
    explanation: "This may be an asset bundle rather than a complete game.",
    recommendation: "Look for a Unity WebGL build."
  },
  glb: {
    detectedFormat: "GLB 3D model",
    engine: "glTF / WebGL",
    compatibility: "Asset or data file",
    explanation: "GLB is a 3D asset format, not a complete game.",
    recommendation: "Preview the model and use it as an asset in a browser game."
  },
  gltf: {
    detectedFormat: "glTF 3D model",
    engine: "glTF / WebGL",
    compatibility: "Asset or data file",
    explanation: "glTF is a 3D asset format, not a complete game.",
    recommendation: "Import the model with its related textures and binary files."
  }
};

function detectSignature(bytes: Uint8Array): FormatInfo | null {
  // Windows executable: MZ
  if (bytes[0] === 0x4d && bytes[1] === 0x5a) {
    return extensionFormats.exe;
  }

  // WebAssembly: \0asm
  if (
    bytes[0] === 0x00 &&
    bytes[1] === 0x61 &&
    bytes[2] === 0x73 &&
    bytes[3] === 0x6d
  ) {
    return extensionFormats.wasm;
  }

  // ZIP archive: PK
  if (
    bytes[0] === 0x50 &&
    bytes[1] === 0x4b &&
    bytes[2] === 0x03 &&
    bytes[3] === 0x04
  ) {
    return extensionFormats.zip;
  }

  // GLB: glTF
  if (
    bytes[0] === 0x67 &&
    bytes[1] === 0x6c &&
    bytes[2] === 0x54 &&
    bytes[3] === 0x46
  ) {
    return extensionFormats.glb;
  }

  // PNG image
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return {
      detectedFormat: "PNG image",
      engine: "Image asset",
      compatibility: "Asset or data file",
      explanation: "This file is a PNG image, not a standalone game.",
      recommendation: "Use it as a texture or UI asset."
    };
  }

  // JPEG image
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return {
      detectedFormat: "JPEG image",
      engine: "Image asset",
      compatibility: "Asset or data file",
      explanation: "This file is a JPEG image, not a standalone game.",
      recommendation: "Use it as a texture or UI asset."
    };
  }

  return null;
}

export async function analyzeGameFile(file: File): Promise<AnalysisResult> {
  const extension = file.name.split(".").pop()?.toLowerCase() || "";

  let result: FormatInfo = extensionFormats[extension] || unknownFormat;

  try {
    const buffer = await file.slice(0, 32).arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const signatureResult = detectSignature(bytes);

    if (signatureResult) {
      result = signatureResult;
    } else if (extension === "html" || extension === "htm") {
      const text = await file.slice(0, 512).text();
      if (/<html|<!doctype html/i.test(text)) {
        result = extensionFormats.html;
      }
    }
  } catch {
    // If reading the file fails, retain extension-based identification.
  }

  return {
    fileName: file.name,
    extension,
    ...result
  };
}
