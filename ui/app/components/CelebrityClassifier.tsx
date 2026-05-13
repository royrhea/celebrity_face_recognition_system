"use client";

import { useState, useRef, useCallback } from "react";

const API_URL = "http://127.0.0.1:5000/classify_image";

// 1MB limit
const MAX_FILE_SIZE = 1 * 1024 * 1024;

const CELEBRITIES = [
  { name: "Angelina Jolie", category: "Actor" },
  { name: "Scarlett Johansson", category: "Actor" },
  { name: "Brad Pitt", category: "Actor" },
  { name: "Jennifer Lawrence", category: "Actor" },
  { name: "Johnny Depp", category: "Actor" },
  { name: "Megan Fox", category: "Actor" },
  { name: "Natalie Portman", category: "Actor" },
  { name: "Lionel Messi", category: "Sports" },
  { name: "Maria Sharapova", category: "Sports" },
  { name: "Roger Federer", category: "Sports" },
  { name: "Serena Williams", category: "Sports" },
  { name: "Virat Kohli", category: "Sports" },
];

const CATEGORY_ICON: Record<string, string> = {
  Actor: "🎬",
  Sports: "🏆",
};

interface Result {
  class: string;
  confidence: number;
}

function formatName(name: string): string {
  return name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function ConfidenceBar({ value }: { value: number }) {
  const color =
    value > 70
      ? "bg-emerald-500"
      : value > 40
      ? "bg-amber-400"
      : "bg-red-400";

  return (
    <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

function Badge({ confidence }: { confidence: number }) {
  const style =
    confidence > 70
      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
      : confidence > 40
      ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
      : "bg-red-500/20 text-red-300 border-red-500/30";

  const label =
    confidence > 70
      ? "High"
      : confidence > 40
      ? "Medium"
      : "Low";

  return (
    <span
      className={`text-xs font-medium px-2.5 py-1 rounded-full border ${style}`}
    >
      {label}
    </span>
  );
}

export default function CelebrityClassifier() {
  const [image, setImage] = useState<string | null>(null);
  const [b64, setB64] = useState<string | null>(null);
  const [results, setResults] = useState<Result[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [fileSize, setFileSize] = useState<number | null>(null);

  const fileInput = useRef<HTMLInputElement>(null);

  const processFile = useCallback((file: File) => {
    if (!file || !file.type.startsWith("image/")) {
      setError("Please upload a valid image file.");
      return;
    }

    // File size validation
    if (file.size > MAX_FILE_SIZE) {
      setError(
        "Image exceeded 1MB limit. Please upload a smaller image."
      );

      setImage(null);
      setB64(null);
      setResults(null);
      setFileSize(null);

      return;
    }

    setError(null);
    setResults(null);
    setFileSize(file.size);

    const reader = new FileReader();

    reader.onload = (e) => {
      const result = e.target?.result as string;

      setImage(result);
      setB64(result);
    };

    reader.readAsDataURL(file);
  }, []);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files?.[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();

      setDragging(false);

      if (e.dataTransfer.files[0]) {
        processFile(e.dataTransfer.files[0]);
      }
    },
    [processFile]
  );

  const handleClassify = async () => {
    if (!b64) return;

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const formData = new FormData();

      formData.append("img_data", b64);

      const res = await fetch(API_URL, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error(
          `Server responded with status ${res.status}`
        );
      }

      const data = await res.json();

      if (data.error) {
        setError(data.error);
        setLoading(false);
        return;
      }

      if (!Array.isArray(data) || data.length === 0) {
        setError(
          "No face with 2 eyes detected. Please try a clear frontal image."
        );
      } else {
        setResults(
          [...data].sort(
            (a, b) => b.confidence - a.confidence
          )
        );
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Unknown error occurred.";

      setError(
        message ||
          "Could not reach the server. Make sure FastAPI is running."
      );
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setImage(null);
    setB64(null);
    setResults(null);
    setError(null);
    setFileSize(null);

    if (fileInput.current) {
      fileInput.current.value = "";
    }
  };

  const actors = CELEBRITIES.filter(
    (c) => c.category === "Actor"
  );

  const sports = CELEBRITIES.filter(
    (c) => c.category === "Sports"
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-gray-900 to-black py-12 px-4">
      <div className="w-full max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white tracking-tight mb-2">
            🎬 Celebrity Classifier
          </h1>

          <p className="text-gray-400 text-sm">
            Upload a photo to identify celebrities using your ML model.
          </p>
        </div>

        {/* Upload + Results */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

          {/* Upload */}
          <div className="flex flex-col gap-3">

            <div
              className={`relative rounded-2xl border-2 border-dashed overflow-hidden flex items-center justify-center transition-all duration-200
              ${
                dragging
                  ? "border-blue-400 bg-blue-500/10"
                  : "border-gray-700 bg-gray-900/70 hover:border-gray-500"
              }
              ${!image ? "cursor-pointer" : "cursor-default"}`}
              style={{ height: "420px" }}
              onClick={() =>
                !image && fileInput.current?.click()
              }
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
            >
              {image ? (
                <>
                  <img
                    src={image}
                    alt="Uploaded preview"
                    className="w-full h-full object-cover"
                  />

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      reset();
                    }}
                    className="absolute top-3 right-3 bg-black/70 hover:bg-black text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold transition-colors shadow"
                  >
                    ✕
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center text-gray-500 p-8 select-none">
                  <span className="text-6xl mb-4">📁</span>

                  <p className="text-base font-medium text-gray-300 mb-1">
                    Drop image here
                  </p>

                  <p className="text-sm text-gray-500">
                    or click to browse
                  </p>

                  <p className="text-xs text-gray-600 mt-3">
                    JPG · PNG · WebP
                  </p>
                </div>
              )}
            </div>

            {/* Image Size Info */}
            <div className="flex items-center justify-between text-xs px-1">
              <p className="text-gray-500">
                Maximum image size: 1MB
              </p>

              {fileSize && (
                <p className="text-gray-400">
                  Uploaded: {(fileSize / 1024).toFixed(0)} KB
                </p>
              )}
            </div>

            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            <button
              onClick={handleClassify}
              disabled={!image || loading}
              className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200
              bg-white text-black hover:bg-gray-200 active:scale-95
              disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed"
            >
              {loading ? "Analysing..." : "Classify Image"}
            </button>
          </div>

          {/* Results */}
          <div className="flex flex-col">

            {!loading && !results && !error && (
              <div className="flex-1 border-2 border-dashed border-gray-700 rounded-2xl flex flex-col items-center justify-center text-gray-500 bg-gray-900/40">
                <span className="text-4xl mb-3">🔍</span>

                <p className="text-sm font-medium">
                  Results will appear here
                </p>
              </div>
            )}

            {loading && (
              <div className="flex-1 bg-gray-900/70 border border-gray-800 rounded-2xl p-6">
                <p className="text-sm text-gray-400">
                  Detecting faces...
                </p>
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-300 rounded-2xl p-4 text-sm">
                {error}
              </div>
            )}

            {results && !loading && (
              <div className="flex-1 bg-gray-900/70 border border-gray-800 rounded-2xl p-5">

                <p className="text-xs text-gray-500 uppercase tracking-widest mb-4">
                  {results.length} face
                  {results.length !== 1 ? "s" : ""} detected
                </p>

                <div className="flex flex-col divide-y divide-gray-800">

                  {results.map((r, i) => (
                    <div
                      key={i}
                      className={i > 0 ? "pt-4 mt-4" : ""}
                    >
                      <div className="flex items-start justify-between mb-2">

                        <div>
                          <p className="font-semibold text-white text-base">
                            {formatName(r.class)}
                          </p>

                          <p className="text-xs text-gray-500 mt-0.5">
                            Confidence:{" "}
                            {r.confidence.toFixed(1)}%
                          </p>
                        </div>

                        <Badge confidence={r.confidence} />
                      </div>

                      <ConfidenceBar value={r.confidence} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Supported Celebrities */}
        <div className="bg-gray-900/70 border border-gray-800 rounded-2xl p-6">

          <p className="text-xs text-gray-500 uppercase tracking-widest mb-5">
            Supported Celebrities
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

            {/* Actors */}
            <div>
              <p className="text-xs font-semibold text-gray-400 flex items-center gap-1.5 mb-3">
                <span>{CATEGORY_ICON["Actor"]}</span> Actors
              </p>

              <div className="flex flex-col gap-2">
                {actors.map((c) => (
                  <div
                    key={c.name}
                    className="flex items-center gap-3 bg-black/40 border border-gray-800 rounded-xl px-3 py-2.5"
                  >
                    <span className="w-7 h-7 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center text-xs font-bold">
                      {c.name.charAt(0)}
                    </span>

                    <span className="text-sm text-gray-200 font-medium">
                      {c.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sports */}
            <div>
              <p className="text-xs font-semibold text-gray-400 flex items-center gap-1.5 mb-3">
                <span>{CATEGORY_ICON["Sports"]}</span> Sports Stars
              </p>

              <div className="flex flex-col gap-2">
                {sports.map((c) => (
                  <div
                    key={c.name}
                    className="flex items-center gap-3 bg-black/40 border border-gray-800 rounded-xl px-3 py-2.5"
                  >
                    <span className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-xs font-bold">
                      {c.name.charAt(0)}
                    </span>

                    <span className="text-sm text-gray-200 font-medium">
                      {c.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}