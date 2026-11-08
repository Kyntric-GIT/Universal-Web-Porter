
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

export function analyzeGameFile(file: File): AnalysisResult {
  const extension =
    file.name.split(".").pop()?.toLowerCase() || "";

  const result: Omit<AnalysisResult, "fileName" | "extension"> =
    {
      detectedFormat: "Unknown file format",
      engine: "Unknown",
      compatibility: "Unknown",
      explanation:
        "The file format is not recognized yet.",
      recommendation:
        "Check the file type and identify the game engine."
    };

  const formats: Record<
    string,
    Omit<AnalysisResult, "fileName" | "extension">
  > = {
    html: {
      detectedFormat: "HTML game or webpage",
      engine: "HTML5 / Web",
      compatibility: "Browser-ready candidate",
      explanation:
        "HTML games are designed to run in browsers, but required assets and scripts must also be present.",
      recommendation:
        "Import the game's complete folder or archive and test it in the browser player."
    },

    wasm: {
      detectedFormat: "WebAssembly module",
      engine: "WebAssembly",
      compatibility: "Possible with runtime",
      explanation:
        "WebAssembly can run in browsers, but this module may require additional game files or JavaScript glue.",
      recommendation:
        "Identify the module's dependencies and connect its required browser runtime."
    },

    exe: {
      detectedFormat: "Windows executable",
      engine: "Unknown Windows game",
      compatibility: "Requires porting",
      explanation:
        "Windows executables cannot run directly in a normal browser. This file has not been executed.",
      recommendation:
        "Identify the engine and look for source code, a browser export, or a compatible emulation approach."
    },

    zip: {
      detectedFormat: "ZIP archive",
      engine: "Unknown",
      compatibility: "Unknown",
      explanation:
        "The archive may contain game code, assets, or an existing browser build.",
      recommendation:
        "Inspect the archive contents and identify its main executable or entry point."
    },

    pck: {
      detectedFormat: "Godot package",
      engine: "Godot",
      compatibility: "Possible with runtime",
      explanation:
        "This appears to be a Godot package. Compatibility depends on the engine version and game features.",
      recommendation:
        "Identify the Godot version and determine whether a compatible Web export or runtime is available."
    },

    pak: {
      detectedFormat: "Unreal Engine package",
      engine: "Unreal Engine",
      compatibility: "Asset or data file",
      explanation:
        "Unreal PAK files usually contain game assets rather than a complete playable game.",
      recommendation:
        "Identify the game's Unreal Engine version and locate its executable, source, or browser-compatible build."
    },

    unity3d: {
      detectedFormat: "Unity asset or package",
      engine: "Unity",
      compatibility: "Possible with runtime",
      explanation:
        "Unity files may contain assets or game data and are not necessarily standalone games.",
      recommendation:
        "Identify whether this is an asset bundle or a complete Unity build. A WebGL build is the preferred browser target."
    },

    glb: {
      detectedFormat: "3D model",
      engine: "glTF / WebGL",
      compatibility: "Asset or data file",
      explanation:
        "GLB is a 3D asset format, not a complete game.",
      recommendation:
        "Preview the model and use it as an asset in a compatible browser game."
    },

    gltf: {
      detectedFormat: "3D model",
      engine: "glTF / WebGL",
      compatibility: "Asset or data file",
      explanation:
        "glTF is a 3D asset format, not a complete game.",
      recommendation:
        "Import the model and its related textures and binary files into a browser game."
    }
  };

  const detected = formats[extension];

  if (detected) {
    Object.assign(result, detected);
  }

  return {
    fileName: file.name,
    extension,
    ...result
  };
}
