"use client";

import { useRef, useState } from "react";

const CLASSES = ["buen_estado", "grietas", "huecos"] as const;
type ClassName = (typeof CLASSES)[number];

const CLASS_LABELS: Record<ClassName, string> = {
  buen_estado: "Buen estado",
  grietas: "Grietas",
  huecos: "Huecos",
};

const CLASS_COLOR: Record<ClassName, string> = {
  buen_estado: "var(--good)",
  grietas: "var(--warn)",
  huecos: "var(--bad)",
};

type PredictResponse = {
  predicted_class: ClassName;
  confidence: number;
  probabilities: Record<ClassName, number>;
};

type Status = "empty" | "ready" | "loading" | "result" | "error";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>("empty");
  const [result, setResult] = useState<PredictResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const isEmpty = status === "empty";
  const isLoading = status === "loading";

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setFileName(file.name);
    setPreviewUrl(URL.createObjectURL(file));
    setResult(null);
    setErrorMessage("");
    setStatus("ready");
  }

  async function handlePredict() {
    if (!selectedFile) return;

    setStatus("loading");
    setErrorMessage("");

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch(`${API_URL}/predict`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.error ?? "No se pudo procesar la imagen.");
        setStatus("error");
        return;
      }

      setResult(data);
      setStatus("result");
    } catch {
      setErrorMessage(
        `No se pudo conectar con el servidor. Verifica que el backend esté corriendo en ${API_URL}.`
      );
      setStatus("error");
    }
  }

  return (
    <div className="page">
      <main className="panel">
        <div className="panel-head">
          <h1>Clasificador de estado vial</h1>
          <p className="subtitle">
            Sube una foto de un tramo de vía del <span className="accent-word">Sumapaz</span> y
            el modelo te dice si está en buen estado, agrietada o con huecos.
          </p>
        </div>

        <div className="panel-body">
          <section className="upload-col">
            <div
              className="frame"
              data-filled={String(!isEmpty)}
              role="button"
              tabIndex={0}
              aria-label="Subir una imagen de la vía"
              onClick={openFilePicker}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  openFilePicker();
                }
              }}
            >
              {isEmpty && (
                <div className="frame-placeholder">
                  <svg
                    className="placeholder-illustration"
                    width="100%"
                    height="100%"
                    viewBox="0 0 400 300"
                    preserveAspectRatio="xMidYMid slice"
                  >
                    <defs>
                      <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor="var(--sky-a)" />
                        <stop offset="1" stopColor="var(--sky-b)" />
                      </linearGradient>
                    </defs>
                    <rect width="400" height="300" fill="url(#skyGrad)" />
                    <path
                      d="M0 185 Q100 150 210 172 T400 160 L400 300 L0 300 Z"
                      fill="var(--hill-back)"
                    />
                    <path
                      d="M0 225 Q120 195 220 212 T400 202 L400 300 L0 300 Z"
                      fill="var(--hill-front)"
                    />
                    <circle cx="62" cy="158" r="17" fill="var(--tree)" />
                    <circle cx="80" cy="168" r="12" fill="var(--tree)" />
                    <rect x="67" y="172" width="7" height="22" fill="#7a5a3a" />
                    <path
                      d="M150 300 C168 244 186 222 199 210 C212 222 232 244 250 300 Z"
                      fill="var(--road)"
                    />
                    <path
                      d="M199 300 C199 250 200 228 199 213"
                      stroke="var(--road-line)"
                      strokeWidth={4}
                      strokeLinecap="round"
                      strokeDasharray="10 10"
                    />
                    <ellipse cx="206" cy="266" rx="15" ry="7" fill="#5a422b" opacity={0.55} />
                  </svg>
                  <div className="placeholder-cta">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      strokeWidth={1.8}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 16V4M12 4L7 9M12 4l5 5" />
                      <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
                    </svg>
                    <span>Sube una foto de la vía</span>
                  </div>
                </div>
              )}

              {previewUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="frame-img" src={previewUrl} alt="Vista previa de la imagen subida" />
              )}

              {isLoading && (
                <div className="frame-loading">
                  <div className="spinner" />
                  <span>Analizando imagen…</span>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handleFileChange}
            />

            <div className="upload-actions">
              <button type="button" className="btn-ghost" onClick={openFilePicker}>
                Elegir imagen
              </button>
              {fileName && <span className="caption">{fileName}</span>}
            </div>
          </section>

          <section className="result-col">
            <button
              type="button"
              className="btn-primary"
              disabled={isEmpty || isLoading}
              onClick={handlePredict}
            >
              {isLoading
                ? "Prediciendo…"
                : status === "result" || status === "error"
                ? "Predecir de nuevo"
                : "Predecir"}
            </button>

            {status === "result" && result && (
              <div className="result">
                <div className="result-headline">
                  <span className="dot" style={{ background: CLASS_COLOR[result.predicted_class] }} />
                  <span className="result-class">{CLASS_LABELS[result.predicted_class]}</span>
                  <span
                    className="result-confidence"
                    style={{ color: CLASS_COLOR[result.predicted_class] }}
                  >
                    {(result.confidence * 100).toFixed(1)}%
                  </span>
                </div>

                <div className="bars">
                  {CLASSES.map((className) => {
                    const value = result.probabilities[className] * 100;
                    return (
                      <div
                        className="bar-row"
                        key={className}
                        data-active={String(className === result.predicted_class)}
                      >
                        <span className="bar-label">{CLASS_LABELS[className]}</span>
                        <div className="bar-track">
                          <div
                            className="bar-fill"
                            style={{ width: `${value}%`, background: CLASS_COLOR[className] }}
                          />
                        </div>
                        <span className="bar-value">{value.toFixed(1)}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {status === "error" && (
              <div className="error-block">
                <strong>No se pudo procesar la imagen</strong>
                <p>{errorMessage}</p>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
